const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


// Routes
const salesRoutes = require("./routes/sales.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const authenticate = require("./middleware/authenticate");
const dashboardRoutes = require("./routes/dashboard.routes");
const productRoutes = require("./routes/product.routes");
const customerRoutes = require("./routes/customer.routes");
const analyticsRoutes = require("./routes/analytics.routes");


// APIs
// Protect sensitive backend API endpoints: require valid JWT
app.use("/api/sales", authenticate, salesRoutes);

app.use("/api/inventory", authenticate, inventoryRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/products", productRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/analytics", analyticsRoutes);


module.exports = app;