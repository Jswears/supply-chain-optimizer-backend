import type { APIGatewayProxyHandler } from 'aws-lambda';
import { query } from '../../utils/postgresDb';
import { successResponse, errorResponse } from '../../utils/response';
import { dynamoDb, INVENTORY_TABLE_NAME } from '../../utils/dynamodb';
import { orderUpdateSchema, validateInput } from '../../utils/validators/orderValidation';
import { correlationId, StructuredLogger } from '../../utils/logger';

export const handler: APIGatewayProxyHandler = async (event) => {
  const logger = new StructuredLogger({
    correlationId,
    service: 'orders-service',
    environment: process.env.NODE_ENV || 'dev',
  });

  logger.log('info', 'Received updateOrder request', {
    requestId: event.requestContext?.requestId,
    orderId: event.pathParameters?.orderId,
    correlationId,
    body: event.body,
  });

  try {
    const orderId = event.pathParameters?.orderId;

    if (!orderId) {
      logger.log('error', 'Order ID is required', { correlationId });
      return errorResponse(new Error('Order ID is required'), 400);
    }

    if (!event.body) {
      logger.log('error', 'Request body is required', { correlationId });
      return errorResponse(new Error('Request body is required'), 400);
    }

    const data = JSON.parse(event.body);
    const updateData = validateInput(orderUpdateSchema, data);

    // Check if order exists
    const orderResult = await query('SELECT * FROM orders WHERE order_id = $1', [orderId]);

    if (orderResult.rows.length === 0) {
      logger.log('error', `Order with ID ${orderId} not found`, { correlationId });
      return errorResponse(new Error(`Order with ID ${orderId} not found`), 404);
    }

    const originalOrder = orderResult.rows[0];

    // Handle inventory updates if status changes to 'Completed'
    if (updateData.status === 'Completed' && originalOrder.status !== 'Completed') {
      if (!updateData.warehouse_id) {
        logger.log('error', 'Warehouse ID is required when completing an order', { correlationId });
        return errorResponse(new Error('Warehouse ID is required when completing an order'), 400);
      }

      const productResult = await dynamoDb.get({
        TableName: INVENTORY_TABLE_NAME,
        Key: {
          product_id: originalOrder.product_id,
          warehouse_id: updateData.warehouse_id,
        },
      });

      if (!productResult.Item) {
        logger.log(
          'error',
          `Product ${originalOrder.product_id} not found in warehouse ${updateData.warehouse_id}`,
          { correlationId },
        );
        return errorResponse(new Error(`Product not found in specified warehouse`), 404);
      }

      const product = productResult.Item;
      const newStockLevel = Math.max(0, (product.stock_level || 0) - originalOrder.quantity);

      await dynamoDb.update({
        TableName: INVENTORY_TABLE_NAME,
        Key: {
          product_id: originalOrder.product_id,
          warehouse_id: updateData.warehouse_id,
        },
        UpdateExpression: 'set stock_level = :stock',
        ExpressionAttributeValues: {
          ':stock': newStockLevel,
        },
        ReturnValues: 'UPDATED_NEW',
      });

      if (newStockLevel <= product.reorder_threshold) {
        logger.log('warn', 'Stock level below threshold after update', {
          product_id: originalOrder.product_id,
          newStockLevel,
          reorder_threshold: product.reorder_threshold,
          correlationId,
        });
      }
    }

    // Build update query based on provided fields
    const updateFields = [];
    const queryParams = [];
    let paramCounter = 1;

    if (updateData.product_id !== undefined) {
      updateFields.push(`product_id = $${paramCounter}`);
      queryParams.push(updateData.product_id);
      paramCounter++;
    }

    if (updateData.quantity !== undefined) {
      updateFields.push(`quantity = $${paramCounter}`);
      queryParams.push(updateData.quantity);
      paramCounter++;
    }

    if (updateData.status !== undefined) {
      updateFields.push(`status = $${paramCounter}`);
      queryParams.push(updateData.status);
      paramCounter++;
    }

    // Add order_id as the last parameter
    queryParams.push(orderId);

    if (updateFields.length === 0) {
      logger.log('info', 'No fields to update', { correlationId });
      return successResponse({
        message: 'No changes applied to the order',
        order_id: orderId,
      });
    }

    const updateQuery = `UPDATE orders SET ${updateFields.join(', ')} WHERE order_id = $${paramCounter}`;
    await query(updateQuery, queryParams);

    logger.log('info', 'Order updated successfully', {
      orderId,
      correlationId,
    });

    return successResponse({
      message: 'Order updated successfully',
      order_id: orderId,
    });
  } catch (error) {
    logger.log('error', 'Error encountered during updateOrder flow', {
      error: error instanceof Error ? error.message : String(error),
      correlationId,
    });
    return errorResponse(error instanceof Error ? error : new Error(String(error)));
  }
};
