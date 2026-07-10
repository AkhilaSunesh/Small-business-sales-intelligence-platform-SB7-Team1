const Joi = require('joi');

const addSchema = Joi.object({
  productCode: Joi.string().trim().required(),
  quantity: Joi.number().integer().min(1).required()
});

const updateSchema = Joi.object({
  productCode: Joi.string().trim().required(),
  quantity: Joi.number().integer().min(0).required()
});

const deleteSchema = Joi.object({
  productCode: Joi.string().trim().required()
});

const validateAdd = (req, res, next) => {
  const { error } = addSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ success: false, message: 'Validation failed', errors: error.details.map(d => d.message) });
  next();
};

const validateUpdate = (req, res, next) => {
  const { error } = updateSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ success: false, message: 'Validation failed', errors: error.details.map(d => d.message) });
  next();
};

const validateDelete = (req, res, next) => {
  const { error } = deleteSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ success: false, message: 'Validation failed', errors: error.details.map(d => d.message) });
  next();
};

module.exports = { validateAdd, validateUpdate, validateDelete };
