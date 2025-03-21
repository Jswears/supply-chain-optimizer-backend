import type { APIGatewayProxyHandler } from 'aws-lambda';
import { nanoid } from 'nanoid';
import { errorResponse, successResponse } from '../../utils/response.js';
import { productSchema, validateInput } from '../../utils/validators/inventoryValidation.js';
import { dynamodb, INVENTORY_TABLE_NAME } from '../../utils/dynamodb.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return errorResponse(new Error('Request body is required'), 400);
    }

    const data = JSON.parse(event.body);
    const product = validateInput(productSchema, data);

    const productItem = {
      ...product,
      product_id: `PROD-${nanoid(8)}`,
    };

    await dynamodb.put({
      TableName: INVENTORY_TABLE_NAME,
      Item: productItem,
    });

    return successResponse({
      message: 'Product added successfully',
      product: productItem,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
