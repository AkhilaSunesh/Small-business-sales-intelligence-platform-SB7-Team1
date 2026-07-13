const prisma = require("../config/prisma");

// ─── GET /api/inventory ───────────────────────────────────────────────────────
exports.getInventory = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { product: true },
      orderBy: { product: { name: "asc" } }
    });

    // Annotate each record with a lowStock flag
    const annotated = inventory.map((item) => ({
      ...item,
      lowStock: item.quantity <= item.lowStockThreshold
    }));

    const lowStockCount = annotated.filter((i) => i.lowStock).length;

    return res.status(200).json({
      success: true,
      inventory: annotated,
      summary: { total: annotated.length, lowStockCount }
    });
  } catch (error) {
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
