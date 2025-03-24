import type { APIGatewayProxyHandler } from 'aws-lambda';
import { dynamoDb, INVENTORY_TABLE_NAME } from '../../utils/dynamodb';
import { errorResponse, successResponse } from '../../utils/response';
import { correlationId, StructuredLogger } from '../../utils/logger';

export const handler: APIGatewayProxyHandler = async (event) => {
  const logger = new StructuredLogger({
    correlationId,
    service: 'inventory-service',
    environment: process.env.NODE_ENV || 'dev',
  });

  logger.log('info', 'Received getAllProductsByWarehouseId request', { correlationId });

  try {
    const warehouseId = event.pathParameters?.warehouseId;
    logger.log('info', 'warehouseId', { warehouseId, correlationId });
    if (!warehouseId) {
      logger.log('error', 'warehouseId is required', { correlationId });
      return errorResponse('warehouseId is required', 400);
    }
    const result = await dynamoDb.query({
      TableName: INVENTORY_TABLE_NAME,
      IndexName: 'GSI-Warehouse',
      KeyConditionExpression: '#warehouse_id = :warehouse_id',
      ExpressionAttributeNames: {
        '#warehouse_id': 'warehouse_id',
      },
      ExpressionAttributeValues: {
        ':warehouse_id': warehouseId,
      },
      ProjectionExpression: 'product_id, product_name, stock_level',
    });

    if (!result.Items) {
      logger.log('info', 'No products found', { correlationId });
      return errorResponse('No products found', 404);
    }

    logger.log('info', 'Products found', { count: result.Items.length, correlationId });
    return successResponse(result.Items || []);
  } catch (error) {
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
