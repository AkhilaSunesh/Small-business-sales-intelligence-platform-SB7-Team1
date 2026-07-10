const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


// Routes
const salesRoutes = require("./routes/sales.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const productRoutes = require("./routes/product.routes");
const customerRoutes = require("./routes/customer.routes");
const analyticsRoutes = require("./routes/analytics.routes");


// APIs
app.use("/api/sales", salesRoutes);

app.use("/api/inventory", inventoryRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/products", productRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/analytics", analyticsRoutes);


module.exports = app;