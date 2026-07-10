const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "src/uploads/");
    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            file.originalname;

        cb(null, uniqueName);

    }

});

const fileFilter = (req, file, cb) => {

    if (path.extname(file.originalname) !== ".csv") {

        return cb(new Error("Only CSV files are allowed."));

    }

    cb(null, true);

};

module.exports = multer({

    storage,
    fileFilter

});