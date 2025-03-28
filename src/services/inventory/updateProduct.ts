import type { APIGatewayProxyHandler } from 'aws-lambda';
import { errorResponse, successResponse } from '../../utils/response';
import { correlationId, StructuredLogger } from '../../utils/logger';
import { updateProductSchema, validateInput } from '../../utils/validators/inventoryValidation';
import { dynamoDb, INVENTORY_TABLE_NAME } from '../../utils/dynamodb';

export const handler: APIGatewayProxyHandler = async (event) => {
  const logger = new StructuredLogger({
    correlationId,
    service: 'inventory-service',
    environment: process.env.NODE_ENV || 'dev',
  });

  logger.log('info', 'Received updateProduct request', { correlationId });

  try {
    const productId = event.pathParameters?.productId;
    const warehouseId = event.queryStringParameters?.warehouseId;

    logger.log('info', 'productId and warehouseId', { productId, warehouseId, correlationId });

    if (!productId || !warehouseId) {
      logger.log('error', 'Product ID and warehouse ID are required', { correlationId });
      return errorResponse(new Error('Product ID and warehouse ID are required'), 400);
    }

    if (!event.body) {
      logger.log('error', 'Request body is required', { correlationId });
      return errorResponse(new Error('Request body is required'), 400);
    }

    const data = JSON.parse(event.body);
    const { ...updateData } = validateInput(updateProductSchema, {
      ...data,
    });

    // Check if the product exists
    const existingProduct = await dynamoDb.get({
      TableName: INVENTORY_TABLE_NAME,
      Key: {
        product_id: productId,
        warehouse_id: warehouseId,
      },
    });

    if (!existingProduct.Item) {
      return errorResponse(new Error('Product not found'), 404);
    }

    // Build update expression dynamically
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, string | number | boolean | null> = {};

    Object.entries(updateData).forEach(([key, value]) => {
      updateExpressionParts.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null
      ) {
        expressionAttributeValues[`:${key}`] = value;
      } else {
        throw new Error(`Invalid value type for key ${key}`);
      }
    });

    await dynamoDb.update({
      TableName: INVENTORY_TABLE_NAME,
      Key: {
        product_id: productId,
        warehouse_id: warehouseId,
      },
      UpdateExpression: `set ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    return successResponse({
      message: 'Product updated successfully',
      data: {
        product_id: productId,
        updated_fields: Object.keys(updateData),
      },
    });
  } catch (error) {
    logger.log('error', 'Error updating product', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      correlationId,
    });
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
