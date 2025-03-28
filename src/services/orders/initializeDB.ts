import type { Handler } from 'aws-lambda';
import { query } from '../../utils/postgresDb';
import { correlationId, StructuredLogger } from '../../utils/logger';
import { errorResponse, successResponse } from '../../utils/response';

export const handler: Handler = async () => {
  const logger = new StructuredLogger({
    correlationId,
    service: 'orders-service',
    environment: process.env.NODE_ENV || 'dev',
  });

  try {
    logger.log('info', 'Initializing database...');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS orders (
        order_id UUID PRIMARY KEY,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await query(createTableQuery);
    logger.log('info', 'Orders table created successfully.');

    return successResponse({
      message: 'Database initialized successfully.',
    });
  } catch (error) {
    logger.log('error', 'Error initializing database', {
      error: error instanceof Error ? error.message : String(error),
      correlationId,
    });
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
