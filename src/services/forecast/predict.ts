import type { APIGatewayEvent } from 'aws-lambda';
import { errorResponse, successResponse } from '../../utils/response';
import type { Prediction } from '../../types';
import { correlationId, StructuredLogger } from '../../utils/logger';
import { fetchForecastData } from '../../utils/fetchForecastData';

export const handler = async (event: APIGatewayEvent) => {
  const logger = new StructuredLogger({
    correlationId,
    service: 'prediction-service',
    environment: process.env.NODE_ENV || 'dev',
  });

  logger.log('info', 'Received prediction request', {
    requestId: event.requestContext?.requestId,
    correlationId,
    body: event.body,
  });

  const productId = event.pathParameters?.productId;
  logger.log('debug', 'Product ID from request', { productId, correlationId });

  if (!productId || typeof productId !== 'string' || productId.trim() === '') {
    logger.log('error', 'Invalid or missing product_id', { correlationId });
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid or missing product_id' }) };
  }

  try {
    const csvRows = await fetchForecastData(productId);
    logger.log('debug', 'Filtered CSV rows for product', {
      productId,
      rowCount: csvRows.length,
      correlationId,
    });

    const predictions: Prediction[] = csvRows.map((row) => ({
      date: row.date,
      predicted_value: Number(row.predicted_value),
      lower_bound: Number(row.lower_bound),
      upper_bound: Number(row.upper_bound),
    }));

    if (predictions.length === 0) {
      logger.log('error', 'No predictions found for the given product_id', { correlationId });
      return errorResponse(new Error('No predictions found for the given product_id'), 404);
    }

    logger.log('info', 'Predictions fetched successfully', {
      productId,
      predictionCount: predictions.length,
      correlationId,
    });

    return successResponse({
      message: 'Predictions fetched successfully',
      data: predictions,
    });
  } catch (err: unknown) {
    logger.log('error', 'Prediction fetch error', {
      error: err instanceof Error ? err.message : 'Unknown error',
      correlationId,
    });
    return errorResponse(new Error('Failed to fetch predictions. Please try again later.'), 500);
  }
};
