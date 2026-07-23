const express         = require("express");
const cors            = require("cors");
const helmet          = require("helmet");
const morgan          = require("morgan");
const swaggerUi       = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");

const authRoutes      = require("./routes/auth.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const salesRoutes     = require("./routes/sales.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const productsRoutes  = require("./routes/products.routes");
const customersRoutes = require("./routes/customers.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const invoicesRoutes  = require("./routes/invoices.routes");
const aiRoutes        = require("./routes/ai.routes");

const authenticate              = require("./middleware/authenticate");
const authorize                 = require("./middleware/authorize");
const {auditRejectMiddleware,auditSuccessfulAction} = require("./middleware/auditLogger");
const { apiLimiter, aiLimiter } = require("./middleware/rateLimiter");

const app = express();

app.set("trust proxy", 1); // trust first proxy — enables X-Forwarded-For for rate limiting
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));
app.use(auditRejectMiddleware);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        service: "Security API Gateway",
        status:  "Running",
        message: "Security API Gateway is running 🔐"
    });
});

// ── Swagger / OpenAPI docs ────────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── Public routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ── Protected routes (JWT → RBAC → general rate-limit → proxy) ───────────────
app.use("/api/inventory", authenticate, authorize, apiLimiter, inventoryRoutes);
app.use("/api/sales",     authenticate, authorize, apiLimiter, salesRoutes);
app.use("/api/dashboard", authenticate, authorize, apiLimiter, dashboardRoutes);
app.use("/api/products",  authenticate, authorize, apiLimiter, productsRoutes);
app.use("/api/customers", authenticate, authorize, apiLimiter, customersRoutes);
app.use("/api/analytics", authenticate, authorize, apiLimiter, analyticsRoutes);
app.use("/api/invoices",            authenticate, authorize, apiLimiter, invoicesRoutes);

// ── AI Insight routes (protected) ─────────────────────────────────────────────
app.use("/api/customer-groups", authenticate, authorize, apiLimiter,  aiLimiter, auditSuccessfulAction("AI Report Requested", "customer-groups"), aiRoutes);
app.use("/api/churn", authenticate, authorize, apiLimiter,  aiLimiter, auditSuccessfulAction("AI Report Requested", "churn"), aiRoutes);
app.use("/api/recommendations", authenticate, authorize, apiLimiter,  aiLimiter, auditSuccessfulAction("AI Report Requested", "recommendations"), aiRoutes);
app.use("/api/anomaly-detection", authenticate, authorize, apiLimiter,  aiLimiter,auditSuccessfulAction("AI Report Requested", "anomaly-detection"), aiRoutes);
// ── Centralised error handler ─────────────────────────────────────── ──────────
app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

module.exports = app;
