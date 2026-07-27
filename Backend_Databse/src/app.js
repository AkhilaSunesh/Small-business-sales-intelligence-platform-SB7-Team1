const express  = require("express");
const cors     = require("cors");
const morgan   = require("morgan");
const swaggerUi       = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");

const authenticate = require("./middleware/authenticate");

const salesRoutes     = require("./routes/sales.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const productRoutes   = require("./routes/product.routes");
const customerRoutes  = require("./routes/customer.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const invoiceRoutes   = require("./routes/invoice.routes");
const forecastRoutes  = require("./routes/forecast.routes");

const app = express();

app.use(cors());
app.use(express.json());
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
app.use("/api/invoices",   authenticate, invoiceRoutes);
app.use("/api/forecast",   authenticate, forecastRoutes);

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
