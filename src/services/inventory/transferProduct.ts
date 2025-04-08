import type { APIGatewayProxyHandler } from 'aws-lambda';
import { errorResponse, successResponse } from '../../utils/response';
import { dynamoDb, INVENTORY_TABLE_NAME } from '../../utils/dynamodb';
import { correlationId, StructuredLogger } from '../../utils/logger';
import { transferSchema, validateInput } from '../../utils/validators/transferValidation';

export const handler: APIGatewayProxyHandler = async (event) => {
  const logger = new StructuredLogger({
    correlationId,
    service: 'inventory-service',
    environment: process.env.NODE_ENV || 'dev',
  });

  logger.log('info', 'Received transferProduct request', {
    correlationId,
    body: event.body,
  });

  try {
    if (!event.body) {
      logger.log('error', 'Request body is required', { correlationId });
      return errorResponse(new Error('Request body is required'), 400);
    }

    const data = JSON.parse(event.body);
    const transfer = validateInput(transferSchema, data);

    // 1. Check if product exists in source warehouse with enough stock
    const sourceProduct = await dynamoDb.get({
      TableName: INVENTORY_TABLE_NAME,
      Key: {
        product_id: transfer.product_id,
        warehouse_id: transfer.from_warehouse,
      },
    });

    if (!sourceProduct.Item) {
      logger.log('error', 'Product not found in source warehouse', {
        productId: transfer.product_id,
        warehouseId: transfer.from_warehouse,
        correlationId,
      });
      return errorResponse(new Error('Product not found in source warehouse'), 404);
    }

    if (sourceProduct.Item.stock_level < transfer.quantity) {
      logger.log('error', 'Insufficient stock in source warehouse', {
        productId: transfer.product_id,
        warehouseId: transfer.from_warehouse,
        available: sourceProduct.Item.stock_level,
        requested: transfer.quantity,
        correlationId,
      });
      return errorResponse(new Error('Insufficient stock in source warehouse'), 400);
    }

    // 2. Check if product exists in destination warehouse
    const destProduct = await dynamoDb.get({
      TableName: INVENTORY_TABLE_NAME,
      Key: {
        product_id: transfer.product_id,
        warehouse_id: transfer.to_warehouse,
      },
    });

    // 3. Transaction: Decrease source stock, increase destination stock
    if (destProduct.Item) {
      // Product exists in destination warehouse, update stock
      await dynamoDb.update({
        TableName: INVENTORY_TABLE_NAME,
        Key: {
          product_id: transfer.product_id,
          warehouse_id: transfer.from_warehouse,
        },
        UpdateExpression: 'set stock_level = stock_level - :quantity',
        ExpressionAttributeValues: {
          ':quantity': transfer.quantity,
        },
      });

      await dynamoDb.update({
        TableName: INVENTORY_TABLE_NAME,
        Key: {
          product_id: transfer.product_id,
          warehouse_id: transfer.to_warehouse,
        },
        UpdateExpression: 'set stock_level = stock_level + :quantity',
        ExpressionAttributeValues: {
          ':quantity': transfer.quantity,
        },
      });
    } else {
      // Product doesn't exist in destination warehouse, create it
      // Reduce source stock
      await dynamoDb.update({
        TableName: INVENTORY_TABLE_NAME,
        Key: {
          product_id: transfer.product_id,
          warehouse_id: transfer.from_warehouse,
        },
        UpdateExpression: 'set stock_level = stock_level - :quantity',
        ExpressionAttributeValues: {
          ':quantity': transfer.quantity,
        },
      });

      // Create product in destination warehouse
      const newProduct = {
        ...sourceProduct.Item,
        warehouse_id: transfer.to_warehouse,
        stock_level: transfer.quantity,
        last_updated: new Date().toISOString().split('T')[0],
      };

      await dynamoDb.put({
        TableName: INVENTORY_TABLE_NAME,
        Item: newProduct,
      });
    }

    logger.log('info', 'Product transferred successfully', {
      productId: transfer.product_id,
      fromWarehouse: transfer.from_warehouse,
      toWarehouse: transfer.to_warehouse,
      quantity: transfer.quantity,
      correlationId,
    });

    return successResponse({
      message: 'Product transferred successfully',
      data: {
        product_id: transfer.product_id,
        quantity_transferred: transfer.quantity,
        from_warehouse: transfer.from_warehouse,
        to_warehouse: transfer.to_warehouse,
      },
    });
  } catch (error) {
    logger.log('error', 'Error transferring product', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      correlationId,
    });
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
