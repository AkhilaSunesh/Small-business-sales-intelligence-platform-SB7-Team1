const prisma = require("../config/prisma");


exports.getProducts = async (req,res)=>{

    try{

        const products = await prisma.product.findMany({
            orderBy:{
                id:"asc"
            }
        });


        res.status(200).json({

            success:true,

            data:products

        });


    }
    catch(error){

        console.log(error);

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

// ─── GET /api/products/with-stock ─────────────────────────────────────────────
// Returns products joined with their current inventory quantity.
// Used by Create Invoice to show actual available stock + DB price.
exports.getProductsWithStock = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { productCode: "asc" },
            include: {
                inventory: {
                    select: { quantity: true, lowStockThreshold: true }
                }
            }
        });

        const data = products.map(p => ({
            id:          p.id,
            productCode: p.productCode,
            name:        p.name,
            category:    p.category,
            // price from DB — this is the authoritative unit price
            price:       p.price,
            // Display price formatted to 2 decimal places
            priceDisplay: `₹${p.price.toFixed(2)}`,
            quantity:    p.inventory?.quantity           ?? 0,
            lowStockThreshold: p.inventory?.lowStockThreshold ?? 10,
            inStock:     (p.inventory?.quantity ?? 0) > 0
        }));

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("[product.controller] getProductsWithStock:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
