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

  logger.log('info', 'Received getOrder request', {
    requestId: event.requestContext?.requestId,
    orderId: event.pathParameters?.orderId,
    correlationId,
  });

  try {
    const orderId = event.pathParameters?.orderId;

    if (!orderId) {
      logger.log('error', 'Order ID is required', { correlationId });
      return errorResponse(new Error('Order ID is required'), 400);
    }

    const result = await query('SELECT * FROM orders WHERE order_id = $1', [orderId]);

    if (result.rows.length === 0) {
      logger.log('error', `Order with ID ${orderId} not found`, { correlationId });
      return errorResponse(new Error(`Order with ID ${orderId} not found`), 404);
    }

    logger.log('info', 'Fetched order successfully', {
      orderId,
      correlationId,
    });

    return successResponse(result.rows[0]);
  } catch (error) {
    logger.log('error', 'Error encountered during getOrder flow', {
      error: error instanceof Error ? error.message : String(error),
      correlationId,
    });
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
