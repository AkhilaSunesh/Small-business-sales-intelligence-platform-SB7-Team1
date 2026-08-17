const prisma = require("../config/prisma");

// ─── Generate a unique invoice number ──────────────────────────────────────
async function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // Count existing invoices this month for sequence
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const count = await prisma.invoice.count({
    where: { createdAt: { gte: startOfMonth } }
  });

  const seq = String(count + 1).padStart(5, "0");
  return `INV-${year}${month}-${seq}`;
}

// ─── List invoices with search, pagination, sorting, filters ──────────────
async function listInvoices({
  page = 1,
  pageSize = 20,
  sortBy = "createdAt",
  sortOrder = "desc",
  status,
  search,
  customerSearch,
  invoiceSearch,
  dateFrom,
  dateTo
}) {
  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, pageSize));
  const take = Math.min(100, Math.max(1, pageSize));

  const where = {};

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Search by invoice number
  if (invoiceSearch) {
    where.invoiceNumber = { contains: invoiceSearch, mode: "insensitive" };
  }

  // Search by customer name or code
  if (customerSearch) {
    where.customer = {
      OR: [
        { name: { contains: customerSearch, mode: "insensitive" } },
        { customerCode: { contains: customerSearch, mode: "insensitive" } }
      ]
    };
  }

  // General search (invoice number or customer name)
  if (search && !invoiceSearch) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } }
    ];
  }

  // Date range filter
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  // Validate sort field (prevent injection)
  const allowedSortFields = ["createdAt", "dueDate", "totalAmount", "status", "invoiceNumber"];
  const field = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const order = sortOrder === "asc" ? "asc" : "desc";

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { [field]: order },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        payments: {
          select: { id: true, amount: true, method: true, paidAt: true, reference: true },
          orderBy: { paidAt: "desc" }
        }
      }
    })
  ]);

  return {
    data: invoices,
    pagination: {
      total,
      page: Math.max(1, page),
      pageSize: take,
      totalPages: Math.ceil(total / take)
    }
  };
}

// ─── Get single invoice by ID ─────────────────────────────────────────────
async function getInvoiceById(id) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, customerCode: true, email: true, phone: true } },
      salesTransaction: {
        include: {
          product: { select: { id: true, name: true, productCode: true, category: true, price: true } }
        }
      },
      createdBy: { select: { id: true, name: true, email: true } },
      payments: {
        include: {
          recordedBy: { select: { id: true, name: true } }
        },
        orderBy: { paidAt: "desc" }
      }
    }
  });

  return invoice;
}

// ─── Create invoice from sales transaction ────────────────────────────────
async function createInvoiceFromSale(sale, userId) {
  const gstRate = 18; // 18% GST

  // Calculate subtotal (quantity * unitPrice)
  const unitPrice = sale.totalAmount / sale.quantity;
  const subtotal = sale.quantity * unitPrice;

  // Apply discount if present on the sale (default 0)
  const discountRate = sale.discountApplied || 0;
  const discountAmount = subtotal * (discountRate / 100);

  // Calculate taxable amount after discount
  const taxableAmount = subtotal - discountAmount;

  // Calculate GST (18% on taxable amount)
  const taxAmount = taxableAmount * (gstRate / 100);

  // Total = subtotal - discount + tax
  const totalAmount = taxableAmount + taxAmount;

  // Due date: 30 days from transaction date
  const dueDate = new Date(sale.transactionDate);
  dueDate.setDate(dueDate.getDate() + 30);

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Build line items
  const lineItems = [{
    productId: sale.productId,
    productName: sale.product?.name || "Unknown Product",
    quantity: sale.quantity,
    unitPrice: unitPrice,
    lineTotal: subtotal
  }];

  // Use Prisma transaction for atomicity
  const invoice = await prisma.$transaction(async (tx) => {
    // Create the invoice
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: sale.customerId,
        salesTransactionId: sale.id,
        subtotal,
        taxRate: gstRate,
        taxAmount,
        discountRate,
        discountAmount,
        totalAmount,
        status: "UNPAID",
        dueDate,
        createdById: userId || null,
        lineItems
      }
    });

    // Deduct inventory (handled in sales controller already, but ensure consistency)
    // Update inventory - already deducted during sale creation, but we sync
    return inv;
  });

  return invoice;
}

// ─── Create a manual invoice (not tied to a sale) ─────────────────────────
// Security: unitPrice from the client is IGNORED. The authoritative price
// is always retrieved from the Product record in PostgreSQL.
async function createManualInvoice({
  customerId,
  salesTransactionId,
  lineItems,
  discountRate = 0,
  taxRate = 18,
  dueDate,
  createdById,
  note
}) {
  const gstRate = taxRate;

  // ── Step 1: Resolve product prices from DB (never trust client-supplied price) ──
  const productIds = lineItems.map(item => item.productId).filter(Boolean);
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true }
  });
  const productMap = new Map(dbProducts.map(p => [p.id, p]));

  // Validate all products exist and attach DB price to each line item
  const resolvedItems = [];
  for (const item of lineItems) {
    const dbProd = productMap.get(item.productId);
    if (!dbProd) {
      throw Object.assign(
        new Error(`Product not found: ${item.productId}`),
        { code: "PRODUCT_NOT_FOUND" }
      );
    }
    resolvedItems.push({
      ...item,
      productName: dbProd.name,
      // SECURITY: use DB price, reject any client-supplied unitPrice
      unitPrice: dbProd.price
    });
  }

  // ── Step 2: Calculate subtotal from resolved items ──
  const subtotal = resolvedItems.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice), 0
  );

  // Calculate discount
  const discountAmount = subtotal * (discountRate / 100);

  // Taxable amount after discount
  const taxableAmount = subtotal - discountAmount;

  // Calculate tax
  const taxAmount = taxableAmount * (gstRate / 100);

  // Total
  const totalAmount = taxableAmount + taxAmount;

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Default due date: 30 days from now
  const finalDueDate = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const invoice = await prisma.$transaction(async (tx) => {
    // ── Step 3: Validate inventory for every line item BEFORE creating anything ──
    for (const item of resolvedItems) {
      if (!item.productId) continue;
      const inventory = await tx.inventory.findUnique({ where: { productId: item.productId } });
      if (!inventory) {
        throw Object.assign(
          new Error(`No inventory record for product: ${item.productName || item.productId}`),
          { code: "INSUFFICIENT_STOCK" }
        );
      }
      if (inventory.quantity < item.quantity) {
        throw Object.assign(
          new Error(
            `Insufficient stock for ${item.productName || item.productId}. ` +
            `Available: ${inventory.quantity}, Requested: ${item.quantity}`
          ),
          { code: "INSUFFICIENT_STOCK" }
        );
      }
    }

    // ── Step 4: Build line items with computed lineTotal ──
    const lineItemsForDb = resolvedItems.map(item => ({
      productId:   item.productId,
      productName: item.productName,
      quantity:    item.quantity,
      unitPrice:   item.unitPrice,
      lineTotal:   item.quantity * item.unitPrice
    }));

    // ── Step 5: Create the invoice ──
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        salesTransactionId: salesTransactionId || null,
        subtotal,
        taxRate: gstRate,
        taxAmount,
        discountRate,
        discountAmount,
        totalAmount,
        status: "UNPAID",
        dueDate: new Date(finalDueDate),
        createdById: createdById || null,
        lineItems: lineItemsForDb
      }
    });

    // ── Step 6: Deduct inventory atomically (all or nothing) ──
    for (const item of resolvedItems) {
      if (!item.productId) continue;
      await tx.inventory.update({
        where: { productId: item.productId },
        data:  { quantity: { decrement: item.quantity } }
      });
    }

    return inv;
  });

  return invoice;
}

// ─── Record a payment against an invoice ──────────────────────────────────
async function recordPayment(invoiceId, { amount, method = "CASH", reference, note, recordedById }) {
  return prisma.$transaction(async (tx) => {
    // Get current invoice
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: { select: { amount: true } } }
    });

    if (!invoice) {
      throw Object.assign(new Error("Invoice not found"), { status: 404 });
    }

    if (invoice.status === "CANCELLED") {
      throw Object.assign(new Error("Cannot pay a cancelled invoice"), { status: 400 });
    }

    // Calculate total paid so far
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + amount;

    // Create the payment record
    const payment = await tx.payment.create({
      data: {
        invoiceId,
        amount,
        method,
        reference: reference || null,
        note: note || null,
        recordedById: recordedById || null
      }
    });

    // Update invoice status based on payment
    let newStatus = "UNPAID";
    if (totalPaid >= invoice.totalAmount) {
      newStatus = "PAID";
    } else if (totalPaid > 0) {
      newStatus = "PARTIALLY_PAID";
    }

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus }
    });

    return payment;
  });
}

// ─── Get revenue summary ──────────────────────────────────────────────────
async function getRevenueSummary() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalRevenue, outstandingAmount, dailyCollections] = await Promise.all([
    // Total revenue from paid/partial invoices
    prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["PAID", "PARTIALLY_PAID"] } }
    }),
    // Outstanding (unpaid) amount
    prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["UNPAID", "PARTIALLY_PAID"] } }
    }),
    // Today's collections
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: startOfToday } }
    })
  ]);

  return {
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    outstandingAmount: outstandingAmount._sum.totalAmount || 0,
    dailyCollections: dailyCollections._sum.amount || 0
  };
}

// ─── Check and update overdue invoices ────────────────────────────────────
async function updateOverdueInvoices() {
  const now = new Date();
  const result = await prisma.invoice.updateMany({
    where: {
      dueDate: { lt: now },
      status: { in: ["UNPAID", "PARTIALLY_PAID"] }
    },
    data: { status: "OVERDUE" }
  });

  return { updatedCount: result.count };
}

// ─── Delete invoice ───────────────────────────────────────────────────────
async function deleteInvoice(id) {
  return await prisma.$transaction(async (tx) => {
    // Delete associated payments first
    await tx.payment.deleteMany({
      where: { invoiceId: id }
    });

    const deleted = await tx.invoice.delete({
      where: { id }
    });

    return deleted;
  });
}

module.exports = {
  generateInvoiceNumber,
  listInvoices,
  getInvoiceById,
  createInvoiceFromSale,
  createManualInvoice,
  recordPayment,
  getRevenueSummary,
  updateOverdueInvoices,
  deleteInvoice
};