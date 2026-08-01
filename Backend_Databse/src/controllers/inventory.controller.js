const prisma = require("../config/prisma");

// ─── GET /api/inventory ───────────────────────────────────────────────────────
// Supports: ?page, ?limit, ?sort=quantity|product.name, ?order=asc|desc
// Backward-compatible: callers that don't send pagination get page 1, limit 20.
// The legacy response shape (success, inventory, summary) is preserved so
// existing frontend/test consumers are not broken.
exports.getInventory = async (req, res) => {
  try {
    // ── Pagination ──────────────────────────────────────────────────────────
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip  = (page - 1) * limit;

    // ── Sorting ─────────────────────────────────────────────────────────────
    const allowedSort = { quantity: true, "product.name": true };
    const sortParam   = req.query.sort || "product.name";
    const sortOrder   = req.query.order === "desc" ? "desc" : "asc";

    let orderBy;
    if (sortParam === "quantity") {
      orderBy = { quantity: sortOrder };
    } else {
      orderBy = { product: { name: sortOrder } };
    }

    // ── Query ────────────────────────────────────────────────────────────────
    const [total, inventory] = await Promise.all([
      prisma.inventory.count(),
      prisma.inventory.findMany({
        include: { product: true },
        orderBy,
        skip,
        take: limit
      })
    ]);

    // Annotate with lowStock flag
    const annotated    = inventory.map((item) => ({
      ...item,
      lowStock: item.quantity <= item.lowStockThreshold
    }));
    const lowStockCount = annotated.filter((i) => i.lowStock).length;

    return res.status(200).json({
      success: true,
      inventory: annotated,           // preserved for backward compatibility
      data:      annotated,           // new field for frontend consistency
      summary: { total: annotated.length, lowStockCount },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("[inventory.controller] getInventory:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/inventory/low-stock ────────────────────────────────────────────
exports.getLowStock = async (req, res) => {
    try {
        const inventory = await prisma.inventory.findMany({
            include: { product: true },
            orderBy: { quantity: "asc" }
        });

        const lowStock = inventory
            .filter((item) => item.quantity <= item.lowStockThreshold)
            .map((item) => ({ ...item, lowStock: true }));

        return res.status(200).json({
            success: true,
            inventory: lowStock,
            summary: { lowStockCount: lowStock.length }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── POST /api/inventory/add ──────────────────────────────────────────────────
exports.addStock = async (req, res) => {
  try {
    const { productCode, quantity } = req.body;

    const product = await prisma.product.findUnique({ where: { productCode } });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const inventory = await prisma.inventory.update({
      where: { productId: product.id },
      data:  { quantity: { increment: Number(quantity) } },
      include: { product: true }
    });

    return res.status(200).json({ success: true, inventory });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/inventory/update ────────────────────────────────────────────────
exports.updateStock = async (req, res) => {
  try {
    const { productCode, quantity } = req.body;

    const product = await prisma.product.findUnique({ where: { productCode } });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const inventory = await prisma.inventory.update({
      where: { productId: product.id },
      data:  { quantity: Number(quantity) },
      include: { product: true }
    });

    return res.status(200).json({ success: true, inventory });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/inventory/delete ────────────────────────────────────────────
exports.deleteInventory = async (req, res) => {
  try {
    const { productCode } = req.body;

    const product = await prisma.product.findUnique({ where: { productCode } });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await prisma.inventory.deleteMany({ where: { productId: product.id } });

    return res.status(200).json({ success: true, message: "Inventory record deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
