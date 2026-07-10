const { PrismaClient } = require("@prisma/client");
const csv = require("csv-parser");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

exports.uploadSales = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "CSV file required" });
    }

    const rows = [];

    const cleanupFile = (path) => {
      try {
        if (path) fs.unlink(path, () => {});
      } catch (err) {
        console.warn("Failed to cleanup uploaded file:", err.message);
      }
    };

    // determine userId: prefer req.user (set by backend middleware), fallback to decoding header
    let requestUserId = null;
    if (req.user && req.user.id) {
      requestUserId = req.user.id;
    } else {
      try {
        const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.split(" ")[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          requestUserId = decoded && decoded.id ? decoded.id : null;
        }
      } catch (err) {
        // ignore; will fallback to null (no user)
      }
    }

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", async () => {
        let inserted = 0;
        let duplicatesRemoved = 0;
        let invalidRows = 0;

        const invoices = new Set();

        for (const row of rows) {
          // validate CSV row with Joi
          try {
            const { error } = require("../validations/sales.validation").rowSchema.validate(row, { convert: true });
            if (error) {
              invalidRows++;
              continue;
            }
          } catch (e) {
            invalidRows++;
            continue;
          }
          // VALIDATION
          // (Joi validation above already ensures required fields and types)

          // DUPLICATE CHECK (file-level)
          const invoiceNo = `UPLOAD-${row.CustomerID}-${row.ProductID}-${row.TransactionDate}`;
          if (invoices.has(invoiceNo)) {
            duplicatesRemoved++;
            continue;
          }
          invoices.add(invoiceNo);

          // FIND CUSTOMER
          const customer = await prisma.customer.findUnique({ where: { customerCode: row.CustomerID } });

          // FIND PRODUCT
          const product = await prisma.product.findUnique({ where: { productCode: row.ProductID } });

          if (!customer || !product) {
            invalidRows++;
            continue;
          }

          // INSERT SALE + UPDATE INVENTORY as an atomic transaction
          try {
            const qty = Number(row.Quantity);
            await prisma.$transaction(async (tx) => {
              // read inventory inside transaction
              const inv = await tx.inventory.findUnique({ where: { productId: product.id } });
              if (!inv) {
                // no inventory record -> treat as invalid
                const e = new Error('NO_INVENTORY_RECORD');
                e.code = 'NO_INV';
                throw e;
              }

              if (inv.quantity < qty) {
                const e = new Error('INSUFFICIENT_STOCK');
                e.code = 'INSUFFICIENT';
                throw e;
              }

              // create sale
              await tx.salesTransaction.create({
                data: {
                  invoiceNo: invoiceNo,
                  customerId: customer.id,
                  productId: product.id,
                  quantity: qty,
                  totalAmount: qty * Number(row.Price),
                  transactionDate: new Date(row.TransactionDate),
                  userId: requestUserId || undefined,
                }
              });

              // decrement inventory
              await tx.inventory.update({
                where: { productId: product.id },
                data: { quantity: { decrement: qty } }
              });
            });
          } catch (txErr) {
            // handle expected business failures: insufficient stock or missing inventory
            if (txErr && (txErr.code === 'INSUFFICIENT' || txErr.message === 'INSUFFICIENT_STOCK')) {
              // reject this row due to insufficient stock
              invalidRows++;
              continue;
            }
            if (txErr && (txErr.code === 'NO_INV' || txErr.message === 'NO_INVENTORY_RECORD')) {
              // no inventory record -> invalid
              invalidRows++;
              continue;
            }

            // other unexpected errors: log and count as invalid row
            console.warn("Transaction failed for sale row:", txErr && txErr.message ? txErr.message : txErr);
            invalidRows++;
            continue;
          }

          inserted++;
        }

        cleanupFile(req.file.path);

        if (inserted === 0) {
          return res.status(400).json({ success: false, message: 'No valid sales rows were processed', recordsInserted: inserted, duplicatesRemoved, invalidRows });
        }

        res.json({ success: true, message: "Sales uploaded with cleaning", recordsInserted: inserted, duplicatesRemoved, invalidRows });
      })
      .on("error", (err) => {
        cleanupFile(req.file.path);
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
      });
  } catch (error) {
    console.log(error);
    try {
      if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
    } catch (e) {}
    res.status(500).json({ success: false, message: error.message });
  }
};
