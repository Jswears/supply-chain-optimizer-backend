import type { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../../utils/postgresDb';
import { successResponse, errorResponse } from '../../utils/response';
import { correlationId, StructuredLogger } from '../../utils/logger';

export const handler: APIGatewayProxyHandler = async (event) => {
  const logger = new StructuredLogger({
    correlationId,
    service: 'orders-service',
    environment: process.env.NODE_ENV || 'dev',
  });

  logger.log('info', 'Received getOrders request', {
    requestId: event.requestContext?.requestId,
    correlationId,
  });

  try {
    const { status } = event.queryStringParameters || {};

    const queryText = status ? 'SELECT * FROM orders WHERE status = $1' : 'SELECT * FROM orders';
    const queryParams = status ? [status] : [];

    const result = await query(queryText, queryParams);

    logger.log('info', 'Fetched orders successfully', {
      count: result.rows.length,
      correlationId,
    });

    return successResponse(result.rows);
  } catch (error) {
    logger.log('error', 'Error encountered during getOrders flow', {
      error: error instanceof Error ? error.message : String(error),
      correlationId,
    });
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
