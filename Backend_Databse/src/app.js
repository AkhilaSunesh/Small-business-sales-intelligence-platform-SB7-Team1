const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

const express  = require("express");
const cors     = require("cors");
const morgan   = require("morgan");
const swaggerUi       = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");

const authenticate = require("./middleware/authenticate");

const salesRoutes        = require("./routes/sales.routes");
const inventoryRoutes    = require("./routes/inventory.routes");
const dashboardRoutes    = require("./routes/dashboard.routes");
const productRoutes      = require("./routes/product.routes");
const customerRoutes     = require("./routes/customer.routes");
const analyticsRoutes    = require("./routes/analytics.routes");
const invoiceRoutes      = require("./routes/invoice.routes");
const forecastRoutes     = require("./routes/forecast.routes");
const notificationRoutes = require("./routes/notification.routes");
const userRoutes         = require("./routes/user.routes");

const app = express();

app.use(cors());
app.use(express.json());

// ── JSON parse-error handler — returns 400 instead of 500 for malformed JSON ─
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON in request body",
            errors:  [err.message]
        });
    }
    next(err);
});

app.use(morgan("dev"));

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        service: "MarketMind Backend API",
        status:  "Running"
    });
});

// ── Swagger docs (internal) ───────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── Protected API routes ──────────────────────────────────────────────────────
// All routes require a valid JWT issued by the Security API Gateway.
app.use("/api/sales",      authenticate, salesRoutes);
app.use("/api/inventory",  authenticate, inventoryRoutes);
app.use("/api/dashboard",  authenticate, dashboardRoutes);
app.use("/api/products",   authenticate, productRoutes);
app.use("/api/customers",  authenticate, customerRoutes);
app.use("/api/analytics",  authenticate, analyticsRoutes);
app.use("/api/invoices",       authenticate, invoiceRoutes);
app.use("/api/forecast",       authenticate, forecastRoutes);
app.use("/api/notifications",  authenticate, notificationRoutes);
app.use("/api/users",          authenticate, userRoutes);

// ── Centralised error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

module.exports = app;
