const Joi = require('joi');

const rowSchema = Joi.object({
  invoiceNo: Joi.string().optional().allow('', null),
  CustomerID: Joi.string().trim().required(),
  ProductID: Joi.string().trim().required(),
  Quantity: Joi.number().integer().min(1).required(),
  Price: Joi.number().positive().required(),
  TransactionDate: Joi.date().iso().required()
});

module.exports = { rowSchema };
