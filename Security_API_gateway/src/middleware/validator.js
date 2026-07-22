const validateRequest = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      convert: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: error.details.map((detail) => detail.message)
      });
    }

    req[property] = value; 
    next();
  };
};

module.exports = validateRequest;