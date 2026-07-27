const Joi = require("joi");

const registerSchema = Joi.object({
    name: Joi.string().trim().max(100).required(),
    email: Joi.string().email().trim().lowercase().required(),
    password: Joi.string().min(6).required(),
    roleId: Joi.number().integer().valid(3).default(3)
});

const loginSchema = Joi.object({
    email: Joi.string().email().trim().lowercase().required(),
    password: Joi.string().required()
});

const validateRegister = (req, res, next) => {
    const { error } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.details.map(err => err.message)
        });
    }
    next();
};

const refreshSchema = Joi.object({
    refreshToken: Joi.string().required()
});

const validateLogin = (req, res, next) => {
    const { error } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.details.map(err => err.message)
        });
    }
    next();
};

const validateRefresh = (req, res, next) => {
    const { error } = refreshSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.details.map(err => err.message)
        });
    }
    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateRefresh
};
