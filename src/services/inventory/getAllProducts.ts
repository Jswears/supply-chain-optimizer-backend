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

  logger.log('info', 'Received getAllProducts request', { correlationId });

  try {
    const queryParams = event.queryStringParameters || {};
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 100;
    const lastEvaluatedKey = queryParams.offset ? JSON.parse(queryParams.offset) : undefined;

    if (limit <= 0 || limit > 1000) {
      return errorResponse(new Error('Limit must be between 1 and 1000'), 400);
    }

    const result = await dynamoDb.scan({
      TableName: INVENTORY_TABLE_NAME,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
      ProjectionExpression:
        'product_id, product_name, stock_level, warehouse_id, category, supplier',
    });

    if (!result.Items || result.Items.length === 0) {
      logger.log('info', 'No products found', { correlationId });
      return successResponse({
        message: 'No products found',
        data: [],
        pagination: null,
      });
    }

    logger.log('info', 'Products found', { count: result.Items.length, correlationId });

    // Format for pagination
    const pagination = result.LastEvaluatedKey
      ? { next_offset: JSON.stringify(result.LastEvaluatedKey) }
      : null;

    return successResponse({
      message: 'Products retrieved successfully',
      data: result.Items,
      pagination,
    });
  } catch (error) {
    logger.log('error', 'Error retrieving products', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      correlationId,
    });
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
