const multer = require("multer");
const path   = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads/"));
    },
    filename: (req, file, cb) => {
        // Preserve original name with a timestamp prefix to avoid collisions
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".csv") {
        return cb(new Error("Only CSV files are allowed."));
    }
    cb(null, true);
};

module.exports = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB cap
});