import type { APIGatewayProxyHandler } from 'aws-lambda';
// Import { nanoid } from 'nanoid';
import { errorResponse, successResponse } from '../../utils/response';
import { productSchema, validateInput } from '../../utils/validators/inventoryValidation';
import { dynamoDb, INVENTORY_TABLE_NAME } from '../../utils/dynamodb';
import { correlationId, StructuredLogger } from '../../utils/logger';

export const handler: APIGatewayProxyHandler = async (event) => {
  const logger = new StructuredLogger({
    correlationId,
    service: 'inventory-service',
    environment: process.env.NODE_ENV || 'dev',
  });

  logger.log('info', 'Received addProduct request', {
    requestId: event.requestContext?.requestId,
    correlationId,
    body: event.body,
  });

  try {
    if (!event.body) {
      logger.log('error', 'Request body is required', { correlationId });
      return errorResponse(new Error('Request body is required'), 400);
    }

    const data = JSON.parse(event.body);
    const product = validateInput(productSchema, data);

    const productItem = {
      ...product,
      // Product_id: `PROD-${nanoid(8)}`   // This is correct usage, underneath it is just to test with pre-made product_id, easier for sagemaker
      product_id: product.product_id,
    };

    logger.log('debug', 'Storing product in DynamoDB', { product: productItem, correlationId });

    await dynamoDb.put({
      TableName: INVENTORY_TABLE_NAME,
      Item: productItem,
    });

    // Return a simplified response with only the requested fields
    const responseData = {
      product_id: productItem.product_id,
      name: productItem.product_name,
      stock_level: productItem.stock_level,
    };

    logger.log('info', 'Product added successfully', { product: productItem, correlationId });
    return successResponse({
      message: 'Product added successfully',
      data: responseData,
    });
  } catch (error) {
    logger.log('error', 'Error adding product', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      correlationId,
    });
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
