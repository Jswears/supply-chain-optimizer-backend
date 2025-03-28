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

  logger.log('info', 'Received deleteProduct request', {
    correlationId,
    productId: event.pathParameters?.productId,
  });
  try {
    const productId = event.pathParameters?.productId;
    const warehouseId = event.queryStringParameters?.warehouseId;

    if (!productId || !warehouseId) {
      logger.log('error', 'Product ID and Warehouse ID are required', { correlationId });
      return errorResponse(new Error('Product ID is required and Warehouse ID is required'), 400);
    }

    // Check if the product exists first
    const existingProduct = await dynamoDb.get({
      TableName: INVENTORY_TABLE_NAME,
      Key: {
        product_id: productId,
        warehouse_id: warehouseId,
      },
    });

    if (!existingProduct.Item) {
      logger.log('info', 'Product not found', { productId, warehouseId, correlationId });
      return errorResponse(new Error('Product not found'), 404);
    }

    logger.log('info', 'Product found', { productId, warehouseId, correlationId });
    await dynamoDb.delete({
      TableName: INVENTORY_TABLE_NAME,
      Key: {
        product_id: productId,
        warehouse_id: warehouseId,
      },
    });

    logger.log('info', 'Product deleted', { productId, correlationId });

    return successResponse({
      message: 'Product deleted successfully',
      product_id: productId,
    });
  } catch (error) {
    logger.log('error', 'Error deleting product', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      correlationId,
    });
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
