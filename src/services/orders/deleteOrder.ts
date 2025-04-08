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

  logger.log('info', 'Received deleteOrder request', {
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

    // First check if the order exists
    const checkResult = await query('SELECT * FROM orders WHERE order_id = $1', [orderId]);

    if (checkResult.rows.length === 0) {
      logger.log('error', `Order with ID ${orderId} not found`, { correlationId });
      return errorResponse(new Error(`Order with ID ${orderId} not found`), 404);
    }

    // Delete the order if it exists
    await query('DELETE FROM orders WHERE order_id = $1', [orderId]);

    logger.log('info', 'Order deleted successfully', {
      orderId,
      correlationId,
    });

    return successResponse({
      message: 'Order deleted successfully',
      order_id: orderId,
    });
  } catch (error) {
    logger.log('error', 'Error encountered during deleteOrder flow', {
      error: error instanceof Error ? error.message : String(error),
      correlationId,
    });
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
