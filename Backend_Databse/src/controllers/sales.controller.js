const prisma = require("../config/prisma");
const csv    = require("csv-parser");
const fs     = require("fs");
const jwt    = require("jsonwebtoken");
const { validateKaggleColumns, validateKaggleRow } = require("../utils/csvValidator");
const invoiceService = require("../services/invoice.service");

// ─── GET /api/sales ───────────────────────────────────────────────────────────
// Query params:
//   page, limit (alias: pageSize), sort, order
//   customerId, productId, startDate, endDate, status, category
exports.getSales = async (req, res) => {
    try {
        // ── Pagination ────────────────────────────────────────────────────────
        const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
        // Accept both ?limit= and ?pageSize= for backward compatibility
        const limit = Math.min(100, Math.max(1,
            parseInt(req.query.limit,    10) ||
            parseInt(req.query.pageSize, 10) ||
            20
        ));
        const skip = (page - 1) * limit;

        // ── Sorting ───────────────────────────────────────────────────────────
        const allowedSortFields = {
            transactionDate: true,
            totalAmount:     true,
            quantity:        true
        };
        const sortBy    = allowedSortFields[req.query.sort] ? req.query.sort : "transactionDate";
        const sortOrder = req.query.order === "asc" ? "asc" : "desc";

        // ── Filtering ─────────────────────────────────────────────────────────
        const where = {};
        if (req.query.customerId) where.customerId = req.query.customerId;
        if (req.query.productId)  where.productId  = req.query.productId;
        if (req.query.startDate || req.query.endDate) {
            where.transactionDate = {};
            if (req.query.startDate) where.transactionDate.gte = new Date(req.query.startDate);
            if (req.query.endDate)   where.transactionDate.lte = new Date(req.query.endDate);
        }
        // Filter by product category (join-based — apply via include filter)
        const productFilter = {};
        if (req.query.category) {
            productFilter.category = { contains: req.query.category, mode: "insensitive" };
        }

        // ── Query ─────────────────────────────────────────────────────────────
        const includeBlock = {
            customer: { select: { id: true, name: true, customerCode: true } },
            product:  {
                select: { id: true, name: true, productCode: true, category: true },
                // Apply category filter at include level if provided
                ...(req.query.category ? { where: productFilter } : {})
            },
            user:     { select: { id: true, name: true, email: true } }
        };

        const [total, sales] = await Promise.all([
            prisma.salesTransaction.count({ where }),
            prisma.salesTransaction.findMany({
                where,
                skip,
                take:    limit,
                orderBy: { [sortBy]: sortOrder },
                include: includeBlock
            })
        ]);

        // If category filter was applied, filter in-memory (Prisma include-where
        // only filters the included records, not the parent rows)
        const filteredSales = req.query.category
            ? sales.filter(s => s.product !== null)
            : sales;

        return res.status(200).json({
            success: true,
            data: filteredSales,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/sales/:id ───────────────────────────────────────────────────────
exports.getSaleById = async (req, res) => {
    try {
        const sale = await prisma.salesTransaction.findUnique({
            where: { id: req.params.id },
            include: {
                customer: { select: { id: true, name: true, customerCode: true } },
                product:  { select: { id: true, name: true, productCode: true, category: true, price: true } },
                user:     { select: { id: true, name: true, email: true } }
            }
        });

        if (!sale) {
            return res.status(404).json({ success: false, message: "Sale not found" });
        }

        return res.status(200).json({ success: true, data: sale });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── POST /api/sales/upload ───────────────────────────────────────────────────
exports.uploadSales = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "CSV file required" });
        }

        const uploadedAt = new Date().toISOString();
        const filename   = req.file.originalname;
        const rows       = [];

        const cleanupFile = (filePath) => {
            try { if (filePath) fs.unlink(filePath, () => {}); } catch (_) {}
        };

        // Resolve userId from req.user (set by authenticate middleware)
        // or fall back to decoding the Authorization header directly.
        let requestUserId = null;
        if (req.user?.id) {
            requestUserId = req.user.id;
        } else {
            try {
                const authHeader = req.headers.authorization || req.headers.Authorization;
                if (authHeader?.startsWith("Bearer ")) {
                    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
                    requestUserId = decoded?.id ?? null;
                }
            } catch (_) { /* userId stays null — column is optional */ }
        }

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on("data", (row) => rows.push(row))
            .on("headers", (headers) => {
                // Validate required columns are present before processing any rows
                const colCheck = validateKaggleColumns(headers);
                if (!colCheck.valid) {
                    cleanupFile(req.file.path);
                    return res.status(400).json({
                        success: false,
                        message: `CSV is missing required column: '${colCheck.missing}'`,
                        requiredColumns: ["CustomerID", "ProductID", "Quantity", "Price", "TransactionDate"]
                    });
                }
            })
            .on("end",  async () => {
                let inserted          = 0;
                let duplicatesRemoved = 0;
                let invalidRows       = 0;
                const validationErrors = [];   // collect per-row error details

                // File-level invoice tracking (in-memory dedup)
                const invoices = new Set();

                for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                    const row = rows[rowIndex];

                    // ── 1. Joi schema validation ──────────────────────────────
                    const { rowSchema } = require("../validations/sales.validation");
                    const { error: joiError } = rowSchema.validate(row, { convert: true });
                    if (joiError) {
                        invalidRows++;
                        validationErrors.push({
                            row:    rowIndex + 2, // +2 → 1-based + header
                            reason: joiError.details.map((d) => d.message).join("; "),
                            data:   { CustomerID: row.CustomerID, ProductID: row.ProductID }
                        });
                        continue;
                    }

                    // ── 2. Missing-value check via csvValidator ────────────────
                    // Uses the Kaggle-column-aware validator (CustomerID / ProductID)
                    const fieldErrors = validateKaggleRow(row);
                    if (fieldErrors.length > 0) {
                        invalidRows++;
                        validationErrors.push({
                            row:    rowIndex + 2,
                            reason: fieldErrors.join("; "),
                            data:   { CustomerID: row.CustomerID, ProductID: row.ProductID }
                        });
                        continue;
                    }

                    // ── 3. File-level duplicate check ─────────────────────────
                    const invoiceNo = `UPLOAD-${row.CustomerID}-${row.ProductID}-${row.TransactionDate}`;
                    if (invoices.has(invoiceNo)) {
                        duplicatesRemoved++;
                        continue;
                    }
                    invoices.add(invoiceNo);

                    // ── 4. DB-level duplicate check ───────────────────────────
                    const existing = await prisma.salesTransaction.findUnique({ where: { invoiceNo } });
                    if (existing) {
                        duplicatesRemoved++;
                        continue;
                    }

                    // ── 5. Entity resolution ──────────────────────────────────
                    const customer = await prisma.customer.findUnique({ where: { customerCode: row.CustomerID } });
                    const product  = await prisma.product.findUnique({ where: { productCode:  row.ProductID  } });

                    if (!customer || !product) {
                        invalidRows++;
                        validationErrors.push({
                            row:    rowIndex + 2,
                            reason: !customer ? `CustomerID '${row.CustomerID}' not found` : `ProductID '${row.ProductID}' not found`,
                            data:   { CustomerID: row.CustomerID, ProductID: row.ProductID }
                        });
                        continue;
                    }

                    // ── 6. Atomic sale + inventory deduction + invoice creation ──
                    const qty = Number(row.Quantity);
                    const unitPrice = Number(row.Price);
                    const totalAmount = qty * unitPrice;
                    const discountApplied = row.DiscountApplied ? Number(row.DiscountApplied) : 0;
                    try {
                        await prisma.$transaction(async (tx) => {
                            const inv = await tx.inventory.findUnique({ where: { productId: product.id } });
                            if (!inv) throw Object.assign(new Error("NO_INVENTORY_RECORD"), { code: "NO_INV" });
                            if (inv.quantity < qty) throw Object.assign(new Error("INSUFFICIENT_STOCK"), { code: "INSUFFICIENT" });

                            // Create the sales transaction
                            const sale = await tx.salesTransaction.create({
                                data: {
                                    invoiceNo,
                                    customerId:      customer.id,
                                    productId:       product.id,
                                    quantity:        qty,
                                    totalAmount,
                                    transactionDate: new Date(row.TransactionDate),
                                    userId:          requestUserId ?? undefined
                                }
                            });

                            // Deduct inventory
                            await tx.inventory.update({
                                where: { productId: product.id },
                                data:  { quantity: { decrement: qty } }
                            });

                            // ── Auto-generate invoice for this sale ──────────
                            const gstRate = 18;
                            const subtotal = totalAmount;
                            const discountAmt = subtotal * (discountApplied / 100);
                            const taxableAmount = subtotal - discountAmt;
                            const taxAmount = taxableAmount * (gstRate / 100);
                            const finalTotal = taxableAmount + taxAmount;
                            const dueDate = new Date(row.TransactionDate);
                            dueDate.setDate(dueDate.getDate() + 30);

                            // Generate invoice number
                            const now = new Date();
                            const year = now.getFullYear();
                            const month = String(now.getMonth() + 1).padStart(2, "0");
                            const startOfMonth = new Date(year, now.getMonth(), 1);
                            const invCount = await tx.invoice.count({
                                where: { createdAt: { gte: startOfMonth } }
                            });
                            const seq = String(invCount + 1).padStart(5, "0");
                            const invoiceNumber = `INV-${year}${month}-${seq}`;

                            await tx.invoice.create({
                                data: {
                                    invoiceNumber,
                                    customerId: customer.id,
                                    salesTransactionId: sale.id,
                                    subtotal,
                                    taxRate: gstRate,
                                    taxAmount,
                                    discountRate: discountApplied,
                                    discountAmount: discountAmt,
                                    totalAmount: finalTotal,
                                    status: "UNPAID",
                                    createdAt: new Date(row.TransactionDate),
                                    dueDate,
                                    createdById: requestUserId ?? null,
                                    lineItems: [{
                                        productId: product.id,
                                        productName: product.name,
                                        quantity: qty,
                                        unitPrice,
                                        lineTotal: subtotal
                                    }]
                                }
                            });
                        });

                        inserted++;
                    } catch (txErr) {
                        const reason = txErr.code === "INSUFFICIENT"
                            ? "Insufficient stock"
                            : txErr.code === "NO_INV"
                                ? "No inventory record exists for product"
                                : txErr.message;
                        invalidRows++;
                        validationErrors.push({ row: rowIndex + 2, reason, data: { CustomerID: row.CustomerID, ProductID: row.ProductID } });
                    }
                }

                cleanupFile(req.file.path);

                const summary = {
                    filename,
                    uploadedAt,
                    totalRowsRead:    rows.length,
                    recordsInserted:  inserted,
                    duplicatesRemoved,
                    invalidRows,
                    validationErrors  // detailed per-row error report
                };

                if (inserted === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "No valid sales rows were processed",
                        summary
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Sales uploaded successfully",
                    summary
                });
            })
            .on("error", (err) => {
                cleanupFile(req.file.path);
                console.error(err);
                res.status(500).json({ success: false, message: err.message });
            });
    } catch (error) {
        try { if (req.file?.path) fs.unlink(req.file.path, () => {}); } catch (_) {}
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
