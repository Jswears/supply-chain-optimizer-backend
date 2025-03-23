import type { APIGatewayProxyHandler } from 'aws-lambda';
import { errorResponse, successResponse } from '../../utils/response';
import { dynamoDb, INVENTORY_TABLE_NAME } from '../../utils/dynamodb';
import { correlationId, StructuredLogger } from '../../utils/logger';

export const handler: APIGatewayProxyHandler = async (event) => {
  const logger = new StructuredLogger({
    correlationId,
    service: 'inventory-service',
    environment: process.env.NODE_ENV || 'dev',
  });

  logger.log('info', 'Received getProduct request', {
    correlationId,
    productId: event.pathParameters?.id,
  });
  try {
    const productId = event.pathParameters?.id;
    const warehouseId = event.queryStringParameters?.warehouseId;

    if (!productId || !warehouseId) {
      logger.log('error', 'Product ID and Warehouse ID are required', { correlationId });
      return errorResponse(new Error('Product ID is required'), 400);
    }

    const result = await dynamoDb.get({
      TableName: INVENTORY_TABLE_NAME,
      Key: {
        product_id: productId,
        warehouse_id: warehouseId,
      },
    });

    if (!result.Item) {
      logger.log('info', 'Product not found', { productId, warehouseId, correlationId });
      return errorResponse(new Error('Product not found'), 404);
    }

    logger.log('info', 'Product found', { productId, warehouseId, correlationId });
    return successResponse(result.Item);
  } catch (error) {
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
