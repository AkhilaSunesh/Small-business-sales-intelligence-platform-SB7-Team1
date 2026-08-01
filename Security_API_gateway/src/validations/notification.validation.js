/**
 * notification.validation.js — Milestone 3
 * Gateway-level Joi validation for notification query params.
 */

const Joi = require("joi");

const notificationQuerySchema = Joi.object({
    page:  Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type:  Joi.string().valid("LOW_STOCK", "OVERDUE_INVOICE").optional()
}).options({ allowUnknown: false });

const bulkInvoiceSchema = Joi.object({
    ids:    Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
    status: Joi.string().valid("PAID", "UNPAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED").required()
});

const bulkInventorySchema = Joi.object({
    updates: Joi.array().items(
        Joi.object({
            productCode: Joi.string().trim().required(),
            quantity:    Joi.number().integer().min(0).required()
        })
    ).min(1).max(100).required()
});

function makeValidator(schema) {
    return (req, res, next) => {
        const target = req.method === "GET" ? req.query : req.body;
        const { error, value } = schema.validate(target, {
            abortEarly: false,
            convert:    true
        });
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors:  error.details.map(d => d.message)
            });
        }
        if (req.method === "GET") req.query = value;
        else                      req.body  = value;
        next();
    };
}

module.exports = {
    validateNotificationQuery: makeValidator(notificationQuerySchema),
    validateBulkInvoice:       makeValidator(bulkInvoiceSchema),
    validateBulkInventory:     makeValidator(bulkInventorySchema)
};
