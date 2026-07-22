const Joi = require("joi");

const lineItemSchema = Joi.object({
    productId:   Joi.string().uuid().required(),
    productName: Joi.string().trim().max(200).optional(),
    quantity:    Joi.number().integer().min(1).required(),
    unitPrice:   Joi.number().positive().required()   // blocks negative/zero price
});

const createInvoiceSchema = Joi.object({
    customerId:          Joi.string().uuid().required(),   // blocks "missing customer info"
    salesTransactionId:  Joi.string().uuid().optional().allow(null, ""),
    lineItems:           Joi.array().items(lineItemSchema).min(1).required(),
    discountRate:        Joi.number().min(0).max(100).default(0),
    taxRate:             Joi.number().min(0).max(100).default(18),
    dueDate:             Joi.date().iso().greater("now").optional(),
    notes:                Joi.string().trim().max(1000).optional().allow("", null)
});

const recordPaymentSchema = Joi.object({
    amount:    Joi.number().positive().required(),   // blocks negative/zero payment amount
    method:    Joi.string()
                  .valid("CASH", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE", "OTHER")
                  .default("CASH"),
    reference: Joi.string().trim().max(200).optional().allow("", null),
    note:      Joi.string().trim().max(1000).optional().allow("", null)
});

function makeValidator(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly:   false,
            convert:      true,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors:  error.details.map((d) => d.message)
            });
        }

        req.body = value; 
        next();
    };
}

const validateCreateInvoice = makeValidator(createInvoiceSchema);
const validateRecordPayment = makeValidator(recordPaymentSchema);

module.exports = {
    validateCreateInvoice,
    validateRecordPayment
};