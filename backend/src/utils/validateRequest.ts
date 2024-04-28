import Joi from "joi";

const defaults = {
  abortEarly: false,
  stripUnknown: true,
};

type ValidateRequest = <T = any>(
  schema: Joi.Schema,
  payload: any,
  opts?: Joi.ValidationOptions
) => T;

const validateRequest: ValidateRequest = (schema, payload, opts = {}) => {
  const { error, value } = schema.validate(payload, {
    ...defaults,
    ...opts,
  });
  if (error) throw error;

  return value;
};

export default validateRequest;
