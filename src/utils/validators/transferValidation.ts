import Joi from 'joi';

export const transferSchema = Joi.object({
  product_id: Joi.string().required(),
  from_warehouse: Joi.string().required(),
  to_warehouse: Joi.string().required().disallow(Joi.ref('from_warehouse')).messages({
    'any.invalid': 'Source and destination warehouses must be different',
  }),
  quantity: Joi.number().integer().min(1).required(),
});

export const validateInput = <T>(schema: Joi.ObjectSchema, data: T) => {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(`Validation error: ${error.message}`);
  }
  return value;
};
