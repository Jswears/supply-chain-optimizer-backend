import type { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../utils/postgresDb';
import { successResponse, errorResponse } from '../../utils/response';
import { dynamoDb, INVENTORY_TABLE_NAME } from '../../utils/dynamodb';
import { orderSchema, validateInput } from '../../utils/validators/orderValidation';
import { correlationId, StructuredLogger } from '../../utils/logger';

export const handler: APIGatewayProxyHandler = async (event) => {
  const logger = new StructuredLogger({
    correlationId,
    service: 'orders-service',
    environment: process.env.NODE_ENV || 'dev',
  });

  logger.log('info', 'Received createOrder request', {
    requestId: event.requestContext?.requestId,
    correlationId,
    body: event.body,
  });

  try {
    if (!event.body) {
      logger.log('error', 'Request body is required', { correlationId });
      return errorResponse(new Error('Request body is required'), 400);
    }

    const data = JSON.parse(event.body);
    logger.log('info', 'Parsed order data', { data, correlationId });

    const order = validateInput(orderSchema, data);
    const orderId = uuidv4();

    const productResult = await dynamoDb.get({
      TableName: INVENTORY_TABLE_NAME,
      Key: {
        product_id: order.product_id,
        warehouse_id: order.warehouse_id,
      },
    });

    if (!productResult.Item) {
      logger.log('error', `Product with ID ${order.product_id} not found`, { correlationId });
      return errorResponse(new Error(`Product with ID ${order.product_id} not found`), 404);
    }

    await query(
      'INSERT INTO orders (order_id, product_id, quantity, status, supplier, product_name) VALUES ($1, $2, $3, $4, $5, $6)',
      [orderId, order.product_id, order.quantity, order.status, order.supplier, order.product_name],
    );

    if (order.status === 'Completed') {
      const product = productResult.Item;

      logger.log('info', 'Processing completed order for stock update', {
        orderType: 'Supply Order',
        currentStockLevel: product.stock_level || 0,
        orderQuantity: order.quantity,
        operation: 'INCREASE',
        correlationId,
      });

      // IMPORTANT: For a supply/purchase order (createOrder), we INCREASE the stock level
      const currentStock = product.stock_level || 0;
      const orderQuantity = order.quantity;
      const newStockLevel = currentStock + orderQuantity; // Explicitly ADD to increase stock

      logger.log('info', 'Calculated new stock level', {
        currentStock,
        orderQuantity,
        newStockLevel,
        operation: 'INCREASE',
        correlationId,
      });

      await dynamoDb.update({
        TableName: INVENTORY_TABLE_NAME,
        Key: {
          product_id: order.product_id,
          warehouse_id: order.warehouse_id,
        },
        UpdateExpression: 'set stock_level = :stock',
        ExpressionAttributeValues: {
          ':stock': newStockLevel,
        },
        ReturnValues: 'UPDATED_NEW',
      });

      logger.log('info', 'Stock level updated after completed supply order', {
        product_id: order.product_id,
        warehouse_id: order.warehouse_id,
        previousStockLevel: product.stock_level || 0,
        newStockLevel,
        operation: 'INCREASE',
        correlationId,
      });
    }

    return successResponse({
      message: 'Order created successfully',
      order_id: orderId,
    });
  } catch (error) {
    logger.log('error', 'Error encountered during createOrder flow', {
      error: error instanceof Error ? error.message : String(error),
      correlationId,
    });
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
