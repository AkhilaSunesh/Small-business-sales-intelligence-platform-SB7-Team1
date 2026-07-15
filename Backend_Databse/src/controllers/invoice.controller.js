const invoiceService = require("../services/invoice.service");

// ─── GET /api/invoices ─────────────────────────────────────────────────────
// Query params: page, pageSize, sortBy, sortOrder, status, search,
//               customerSearch, invoiceSearch, dateFrom, dateTo
exports.getInvoices = async (req, res, next) => {
  try {
    const result = await invoiceService.listInvoices({
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
      status: req.query.status || undefined,
      search: req.query.search || undefined,
      customerSearch: req.query.customerSearch || undefined,
      invoiceSearch: req.query.invoiceSearch || undefined,
      dateFrom: req.query.dateFrom || undefined,
      dateTo: req.query.dateTo || undefined
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
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
      pageSize: parseInt(req.query.pageSize) || 20,
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
      pagination: result.pagination
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