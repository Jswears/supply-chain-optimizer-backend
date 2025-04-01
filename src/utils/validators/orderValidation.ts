import Joi from 'joi';

export const orderSchema = Joi.object({
  product_id: Joi.string().required(),
  warehouse_id: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  status: Joi.string().valid('Pending', 'Completed', 'Cancelled').default('Pending'),
});

export const orderUpdateSchema = Joi.object({
  product_id: Joi.string().optional(),
  warehouse_id: Joi.string().optional(),
  quantity: Joi.number().integer().min(1).optional(),
  status: Joi.string().valid('Pending', 'Completed', 'Cancelled').optional(),
}).min(1);

export const validateInput = <T>(schema: Joi.ObjectSchema, data: T) => {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(`Validation error: ${error.message}`);
  }
  return value;
};
