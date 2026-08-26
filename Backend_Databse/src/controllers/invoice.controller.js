const invoiceService = require("../services/invoice.service");

// ─── GET /api/invoices ─────────────────────────────────────────────────────
// Query params: page, pageSize, sortBy, sortOrder, status, search,
//               customerSearch, invoiceSearch, dateFrom, dateTo
exports.getInvoices = async (req, res, next) => {
  try {
    // Accept both ?limit= and ?pageSize= for compatibility
    const pageSize = parseInt(req.query.limit) ||
                     parseInt(req.query.pageSize) || 20;

    const result = await invoiceService.listInvoices({
      page: parseInt(req.query.page) || 1,
      pageSize,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
      status: req.query.status || undefined,
      search: req.query.search || undefined,
      customerSearch: req.query.customerSearch || undefined,
      invoiceSearch: req.query.invoiceSearch || undefined,
      dateFrom: req.query.dateFrom || undefined,
      dateTo: req.query.dateTo || undefined
    });

    // Normalise pagination — expose both limit and pageSize for compatibility
    const pagination = {
      total:      result.pagination.total,
      page:       result.pagination.page,
      limit:      result.pagination.pageSize,   // frontend expects "limit"
      pageSize:   result.pagination.pageSize,   // keep for backward compat
      totalPages: result.pagination.totalPages
    };

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/invoices/status/:status ──────────────────────────────────────
exports.getInvoicesByStatus = async (req, res, next) => {
  try {
    const validStatuses = ["PAID", "UNPAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"];
    const status = req.params.status.toUpperCase();

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    const result = await invoiceService.listInvoices({
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.limit) || parseInt(req.query.pageSize) || 20,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
      status,
      search: req.query.search || undefined,
      customerSearch: req.query.customerSearch || undefined,
      invoiceSearch: req.query.invoiceSearch || undefined,
      dateFrom: req.query.dateFrom || undefined,
      dateTo: req.query.dateTo || undefined
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total:      result.pagination.total,
        page:       result.pagination.page,
        limit:      result.pagination.pageSize,
        pageSize:   result.pagination.pageSize,
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/invoices/:id ─────────────────────────────────────────────────
exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/invoices ────────────────────────────────────────────────────
// Body: { customerId, lineItems: [{ productId, productName, quantity, unitPrice }],
//         discountRate, taxRate, dueDate, salesTransactionId }
exports.createInvoice = async (req, res, next) => {
  try {
    const { customerId, lineItems, discountRate, taxRate, dueDate, salesTransactionId } = req.body;

    // Validate required fields
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required"
      });
    }

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "lineItems must be a non-empty array"
      });
    }

    for (const item of lineItems) {
      if (!item.productId || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: "Each line item must have productId, quantity, and unitPrice"
        });
      }
      if (item.quantity <= 0 || item.unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "quantity and unitPrice must be positive numbers"
        });
      }
    }

    const invoice = await invoiceService.createManualInvoice({
      customerId,
      salesTransactionId,
      lineItems,
      discountRate: discountRate || 0,
      taxRate: taxRate || 18,
      dueDate: dueDate || undefined,
      createdById: req.user?.id || null
    });

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice
    });
  } catch (error) {
    if (error.code === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// ─── POST /api/invoices/:id/payments ───────────────────────────────────────
// Body: { amount, method, reference, note }
exports.recordPayment = async (req, res, next) => {
  try {
    const { amount, method, reference, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "A positive payment amount is required"
      });
    }

    const payment = await invoiceService.recordPayment(req.params.id, {
      amount,
      method: method || "CASH",
      reference,
      note,
      recordedById: req.user?.id || null
    });

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: payment
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ─── GET /api/invoices/revenue/summary ─────────────────────────────────────
exports.getRevenueSummary = async (req, res, next) => {
  try {
    const summary = await invoiceService.getRevenueSummary();
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/invoices/overdue/check ──────────────────────────────────────
exports.checkOverdueInvoices = async (req, res, next) => {
  try {
    const result = await invoiceService.updateOverdueInvoices();
    return res.status(200).json({
      success: true,
      message: `${result.updatedCount} invoice(s) marked as overdue`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/invoices/:id/download ────────────────────────────────────────
// Returns a plain-text invoice receipt as a downloadable file.
// PDF generation libraries are not available in this environment, so a
// well-formatted text receipt is returned with the correct Content-Disposition.
exports.downloadInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Build a human-readable text receipt
    const lines = [];
    const sep = "=".repeat(60);
    const thin = "-".repeat(60);

    lines.push(sep);
    lines.push("                   MARKETMIND AI");
    lines.push("                  INVOICE RECEIPT");
    lines.push(sep);
    lines.push("");
    lines.push(`Invoice Number : ${invoice.invoiceNumber}`);
    lines.push(`Date Created   : ${new Date(invoice.createdAt).toLocaleDateString("en-IN")}`);
    lines.push(`Due Date       : ${new Date(invoice.dueDate).toLocaleDateString("en-IN")}`);
    lines.push(`Status         : ${invoice.status}`);
    lines.push("");
    lines.push(thin);
    lines.push("BILL TO:");
    lines.push(`  Name         : ${invoice.customer?.name || "N/A"}`);
    lines.push(`  Customer Code: ${invoice.customer?.customerCode || "N/A"}`);
    if (invoice.customer?.email) {
      lines.push(`  Email        : ${invoice.customer.email}`);
    }
    lines.push("");
    lines.push(thin);
    lines.push("LINE ITEMS:");
    lines.push(thin);

    // Line items from JSON field
    const items = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
    if (items.length > 0) {
      lines.push(
        "  Product".padEnd(30) + "Qty".padStart(6) + "Unit Price".padStart(12) + "Total".padStart(12)
      );
      lines.push(thin);
      for (const item of items) {
        const name  = String(item.productName || item.productId || "Item").slice(0, 28);
        const qty   = String(item.quantity || 0);
        const price = String((item.unitPrice || 0).toFixed(2));
        const total = String((item.lineTotal  || 0).toFixed(2));
        lines.push(
          `  ${name.padEnd(28)}${qty.padStart(6)}${price.padStart(12)}${total.padStart(12)}`
        );
      }
    } else {
      lines.push("  (No line items recorded)");
    }

    lines.push("");
    lines.push(thin);
    lines.push(`${"Subtotal :".padEnd(48)}${String(invoice.subtotal?.toFixed(2) || "0.00").padStart(12)}`);
    if (invoice.discountRate > 0) {
      lines.push(`${"Discount (" + invoice.discountRate + "%) :".padEnd(48)}${("-" + String(invoice.discountAmount?.toFixed(2) || "0.00")).padStart(12)}`);
    }
    lines.push(`${"GST (" + invoice.taxRate + "%) :".padEnd(48)}${String(invoice.taxAmount?.toFixed(2) || "0.00").padStart(12)}`);
    lines.push(sep);
    lines.push(`${"TOTAL AMOUNT :".padEnd(48)}${String(invoice.totalAmount?.toFixed(2) || "0.00").padStart(12)}`);
    lines.push(sep);
    lines.push("");

    // Payment history
    if (invoice.payments && invoice.payments.length > 0) {
      lines.push("PAYMENT HISTORY:");
      lines.push(thin);
      for (const p of invoice.payments) {
        lines.push(`  ${new Date(p.paidAt).toLocaleDateString("en-IN").padEnd(14)} ${p.method.padEnd(16)} ${String(p.amount.toFixed(2)).padStart(10)}`);
      }
      const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
      lines.push(thin);
      lines.push(`${"AMOUNT PAID :".padEnd(48)}${String(totalPaid.toFixed(2)).padStart(12)}`);
      lines.push(`${"BALANCE DUE :".padEnd(48)}${String(Math.max(0, invoice.totalAmount - totalPaid).toFixed(2)).padStart(12)}`);
      lines.push(sep);
    }

    lines.push("");
    lines.push("   Thank you for your business — MarketMind AI");
    lines.push(sep);

    const content  = lines.join("\n");
    const filename = `invoice-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.txt`;

    res.setHeader("Content-Type",        "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length",      Buffer.byteLength(content, "utf8"));
    res.setHeader("Cache-Control",       "no-cache");

    return res.status(200).send(content);
  } catch (error) {
    next(error);
  }
// ─── PUT /api/invoices/:id ──────────────────────────────────────────────────
// Update an existing invoice (status, amount, customer name, etc.)
exports.updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, amount, customer } = req.body;

    const existing = await invoiceService.getInvoiceById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const dataToUpdate = {};
    if (status) {
      const validStatuses = ["PAID", "UNPAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"];
      const upperStatus = status.toUpperCase().replace(/\s+/g, "_");
      if (validStatuses.includes(upperStatus)) {
        dataToUpdate.status = upperStatus;
      }
    }
    if (amount !== undefined && !isNaN(Number(amount))) {
      dataToUpdate.totalAmount = Number(amount);
    }

    const prisma = require("../config/prisma");
    const updated = await prisma.$transaction(async (tx) => {
      // If customer name changed, update customer name as well
      if (customer && existing.customerId) {
        await tx.customer.update({
          where: { id: existing.customerId },
          data: { name: customer }
        });
      }

      return await tx.invoice.update({
        where: { id },
        data: dataToUpdate,
        include: {
          customer: true,
          payments: true
        }
      });
    });

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/invoices/:id ──────────────────────────────────────────────
exports.deleteInvoice = async (req, res, next) => {
  try {
    const existing = await invoiceService.getInvoiceById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    await invoiceService.deleteInvoice(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};