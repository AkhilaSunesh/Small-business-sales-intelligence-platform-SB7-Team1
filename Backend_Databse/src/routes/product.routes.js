const express = require("express");

const router = express.Router();


const productController = require("../controllers/product.controller");

router.get("/with-stock", productController.getProductsWithStock);
router.get("/",           productController.getProducts);


module.exports = router;