/**
 * Security API Gateway — app.js
 *
 * Port mapping (never merge AI services onto a single port):
 *   Gateway                   → 7000
 *   Backend_Databse           → 5000  (BACKEND_API_URL)
 *   Customer Segmentation     → 5010  (CUSTOMER_SEGMENTATION_URL)
 *   Churn Prediction          → 5011  (CHURN_PREDICTION_URL)
 *   Recommendations           → 5012  (RECOMMENDATION_URL)
 *   Anomaly Detection         → 5013  (ANOMALY_DETECTION_URL)
 *   Forecast API              → 5014  (FORECAST_API_URL, falls back to backend)
 */

const express         = require("express");
const cors            = require("cors");
const helmet          = require("helmet");
const morgan          = require("morgan");
const swaggerUi       = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes             = require("./routes/auth.routes");
const inventoryRoutes        = require("./routes/inventory.routes");
const salesRoutes            = require("./routes/sales.routes");
const dashboardRoutes        = require("./routes/dashboard.routes");
const productsRoutes         = require("./routes/products.routes");
const customersRoutes        = require("./routes/customers.routes");
const analyticsRoutes        = require("./routes/analytics.routes");
const invoicesRoutes         = require("./routes/invoices.routes");
const forecastRoutes         = require("./routes/forecast.routes");

// AI microservice routes — one file per service, one port per service
const customerGroupsRoutes   = require("./routes/customerGroups.routes");
const churnRoutes            = require("./routes/churn.routes");
const recommendationsRoutes  = require("./routes/recommendations.routes");
const anomalyDetectionRoutes = require("./routes/anomalyDetection.routes");

// ── Middleware imports ────────────────────────────────────────────────────────
const authenticate                      = require("./middleware/authenticate");
const authorize                         = require("./middleware/authorize");
const { auditRejectMiddleware,
        auditSuccessfulAction }         = require("./middleware/auditLogger");
const { apiLimiter, aiLimiter }         = require("./middleware/rateLimiter");

// ─── Environment validation ───────────────────────────────────────────────────
const requiredEnv = ["JWT_SECRET", "REFRESH_TOKEN_SECRET", "BACKEND_API_URL"];
for (const key of requiredEnv) {
    if (!process.env[key]) {
        console.warn(`[gateway] WARNING: environment variable ${key} is not set.`);
    }
}

// Log the resolved service URLs once on startup
console.log("[gateway] Service port mapping:");
console.log(`  Backend              → ${process.env.BACKEND_API_URL            || "http://localhost:5000/api"}`);
console.log(`  Customer Segmentation→ ${process.env.CUSTOMER_SEGMENTATION_URL  || "http://localhost:5010"}`);
console.log(`  Churn Prediction     → ${process.env.CHURN_PREDICTION_URL       || "http://localhost:5011"}`);
console.log(`  Recommendations      → ${process.env.RECOMMENDATION_URL         || "http://localhost:5012"}`);
console.log(`  Anomaly Detection    → ${process.env.ANOMALY_DETECTION_URL      || "http://localhost:5013"}`);
console.log(`  Forecast API         → ${process.env.FORECAST_API_URL           || "http://localhost:5014"} (fallback → backend)`);

// ─── Express app ─────────────────────────────────────────────────────────────
const app = express();

app.set("trust proxy", 1);   // enable X-Forwarded-For for accurate IP-based rate limiting
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
        version: "2.0",
        message: "Security API Gateway is running 🔐",
        ports: {
            gateway:              process.env.PORT                        || 7000,
            backend:              process.env.BACKEND_API_URL             || "http://localhost:5000/api",
            customerSegmentation: process.env.CUSTOMER_SEGMENTATION_URL  || "http://localhost:5010",
            churnPrediction:      process.env.CHURN_PREDICTION_URL        || "http://localhost:5011",
            recommendations:      process.env.RECOMMENDATION_URL          || "http://localhost:5012",
            anomalyDetection:     process.env.ANOMALY_DETECTION_URL       || "http://localhost:5013",
            forecast:             process.env.FORECAST_API_URL            || "http://localhost:5014"
        }
    });
});

// ── Swagger / OpenAPI docs ────────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── Public routes (no authentication required) ────────────────────────────────
app.use("/api/auth", authRoutes);

// ── Protected backend routes ─────────────────────────────────────────────────
// Flow: authenticate (JWT) → authorize (RBAC) → apiLimiter → proxy to backend
app.use("/api/inventory", authenticate, authorize, apiLimiter, inventoryRoutes);
app.use("/api/sales",     authenticate, authorize, apiLimiter, salesRoutes);
app.use("/api/dashboard", authenticate, authorize, apiLimiter, dashboardRoutes);
app.use("/api/products",  authenticate, authorize, apiLimiter, productsRoutes);
app.use("/api/customers", authenticate, authorize, apiLimiter, customersRoutes);
app.use("/api/analytics", authenticate, authorize, apiLimiter, analyticsRoutes);
app.use("/api/invoices",  authenticate, authorize, apiLimiter, invoicesRoutes);

// ── Forecast: tries AI service (5014) first, falls back to backend SMA ───────
app.use("/api/forecast",  authenticate, authorize, apiLimiter, forecastRoutes);

// ── AI microservice routes ────────────────────────────────────────────────────
// Each mounts on its own dedicated router → its own AI service port.
// aiLimiter is applied separately so AI calls don't consume the general apiLimiter.
// Returns 503 (not 500) when the AI service is offline.

app.use("/api/customer-groups",
    authenticate, authorize, apiLimiter, aiLimiter,
    auditSuccessfulAction("AI Report Requested", "customer-groups"),
    customerGroupsRoutes
);

app.use("/api/churn",
    authenticate, authorize, apiLimiter, aiLimiter,
    auditSuccessfulAction("AI Report Requested", "churn"),
    churnRoutes
);

app.use("/api/recommendations",
    authenticate, authorize, apiLimiter, aiLimiter,
    auditSuccessfulAction("AI Report Requested", "recommendations"),
    recommendationsRoutes
);

app.use("/api/anomaly-detection",
    authenticate, authorize, apiLimiter, aiLimiter,
    auditSuccessfulAction("AI Report Requested", "anomaly-detection"),
    anomalyDetectionRoutes
);

// ── 404 handler for unknown routes ───────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
});

// ── Centralised error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(`[gateway] Unhandled error on ${req.method} ${req.originalUrl}:`, err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
        success: false,
        message: "Internal server error",
        details: process.env.NODE_ENV !== "production" ? err.message : undefined
    });
});

module.exports = app;
