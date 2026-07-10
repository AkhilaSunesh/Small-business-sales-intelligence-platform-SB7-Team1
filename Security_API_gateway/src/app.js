const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");

const authRoutes = require("./routes/auth.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const salesRoutes = require("./routes/sales.routes");
const authenticate = require("./middleware/authenticate");
const authorize = require("./middleware/authorize");
const { auditRejectMiddleware } = require("./middleware/auditLogger");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));
app.use(auditRejectMiddleware);

// Home Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        service: "Security API Gateway",
        status: "Running",
        message: "Security API Gateway is running 🔐"
    });
});

// Swagger / OpenAPI documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Authentication Routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/inventory", authenticate, authorize, inventoryRoutes);
app.use("/api/sales", authenticate, authorize, salesRoutes);

// Centralized error handling
app.use((err, req, res, next) => {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

module.exports = app;