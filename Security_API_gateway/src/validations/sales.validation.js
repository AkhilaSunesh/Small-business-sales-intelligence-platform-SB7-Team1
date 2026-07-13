/**
 * sales.validation.js
 *
 * Gateway-level Joi validation for sales-related request payloads.
 * Rejects malformed requests before they reach the backend.
 */

const Joi = require("joi");

// ─── GET /api/sales query params ──────────────────────────────────────────────
const salesQuerySchema = Joi.object({
    page:       Joi.number().integer().min(1).default(1),
    pageSize:   Joi.number().integer().min(1).max(100).default(20),
    customerId: Joi.string().uuid().optional(),
    productId:  Joi.string().uuid().optional(),
    startDate:  Joi.date().iso().optional(),
    endDate:    Joi.date().iso().min(Joi.ref("startDate")).optional()
}).options({ allowUnknown: false });

const validateSalesQuery = (req, res, next) => {
    const { error, value } = salesQuerySchema.validate(req.query, { abortEarly: false, convert: true });
    if (error) {
        return res.status(400).json({
            success: false,
            message: "Invalid query parameters",
            errors:  error.details.map((d) => d.message)
        });
    }
    // Replace req.query with coerced/defaulted values
    req.query = value;
    next();
};

module.exports = { validateSalesQuery };
