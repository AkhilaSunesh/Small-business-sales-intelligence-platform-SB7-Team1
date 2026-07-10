const express = require("express");
const router = express.Router();

const salesController = require("../controllers/sales.controller");

const multer = require("multer");

const upload = multer({
    dest:"src/uploads/"
});


router.post(
    "/upload",
    upload.single("file"),
    salesController.uploadSales
);


module.exports = router;