import type { APIGatewayProxyHandler } from 'aws-lambda';
import { dynamoDb, INVENTORY_TABLE_NAME } from '../../utils/dynamodb';
import { errorResponse, successResponse } from '../../utils/response';
import { correlationId, StructuredLogger } from '../../utils/logger';

export const handler: APIGatewayProxyHandler = async () => {
  const logger = new StructuredLogger({
    correlationId,
    service: 'inventory-service',
    environment: process.env.NODE_ENV || 'dev',
  });

  logger.log('info', 'Received getAllProducts request', { correlationId });

  try {
    const result = await dynamoDb.scan({
      TableName: INVENTORY_TABLE_NAME,
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
