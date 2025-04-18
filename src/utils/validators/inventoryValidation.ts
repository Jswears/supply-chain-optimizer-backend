import Joi from 'joi';

export const productSchema = Joi.object({
  product_id: Joi.string().optional(),
  warehouse_id: Joi.string().required(),
  product_name: Joi.string().required(),
  stock_level: Joi.number().min(0).required(),
  reorder_threshold: Joi.number().min(0).required(),
  supplier: Joi.string().required(),
  category: Joi.string().required(),
  last_updated: Joi.date()
    .iso()
    .default(() => new Date().toISOString().split('T')[0]),
});

export const updateProductSchema = Joi.object({
  product_id: Joi.string().optional(),
  warehouse_id: Joi.string().optional(),
  product_name: Joi.string().optional(),
  stock_level: Joi.number().min(0).optional(),
  reorder_threshold: Joi.number().min(0).optional(),
  supplier: Joi.string().optional(),
  category: Joi.string().optional(),
  last_updated: Joi.date().iso().optional(),
}).min(1);

export const validateInput = <T>(schema: Joi.ObjectSchema, data: T) => {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(`Validation error: ${error.message}`);
  }
  return value;
};
