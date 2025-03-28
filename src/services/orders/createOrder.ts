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
      'INSERT INTO orders (order_id, product_id, quantity, status) VALUES ($1, $2, $3, $4)',
      [orderId, order.product_id, order.quantity, order.status],
    );

    if (order.status === 'Completed') {
      const product = productResult.Item;
      const newStockLevel = Math.max(0, (product.stock_level || 0) - order.quantity);

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

      if (newStockLevel <= product.reorder_threshold) {
        logger.log('warn', 'Stock level below threshold after update', {
          product_id: order.product_id,
          newStockLevel,
          reorder_threshold: product.reorder_threshold,
          correlationId,
        });
      }
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
