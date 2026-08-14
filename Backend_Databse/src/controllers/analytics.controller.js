const prisma = require("../config/prisma");



exports.getAnalyticsSummary = async(req,res)=>{

try{


const revenue =
await prisma.salesTransaction.aggregate({

_sum:{
totalAmount:true
}

});



const sales =
await prisma.salesTransaction.count();



const topProductsRaw =
await prisma.salesTransaction.groupBy({

by:["productId"],

_sum:{
quantity:true,
totalAmount:true
},

orderBy:{
_sum:{
quantity:"desc"
}
},

take:5

});


const productIds = topProductsRaw.map(
    item => item.productId
);


const products = await prisma.product.findMany({

where:{
id:{
in:productIds
}
}

});


const topProducts = topProductsRaw.map(item=>{


const product = products.find(
p=>p.id === item.productId
);


return {

productName: product?.name || "Unknown",

category: product?.category || "Unknown",

quantitySold:
item._sum.quantity,

revenue:
item._sum.totalAmount

};


});



res.json({

success:true,

data:{

totalSales:sales,

totalRevenue:
revenue._sum.totalAmount || 0,

topProducts

}

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

// ─── GET /api/analytics/payment-methods ──────────────────────────────────────
// Returns revenue/count grouped by payment method from real Payment records
exports.getPaymentMethods = async (req, res) => {
    try {
        const rows = await prisma.payment.groupBy({
            by: ["method"],
            _sum: { amount: true },
            _count: { id: true },
            orderBy: { _sum: { amount: "desc" } }
        });

        const data = rows.map(r => ({
            method: r.method,
            count:   r._count.id,
            revenue: r._sum.amount || 0
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error("[analytics] getPaymentMethods:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/analytics/categories ────────────────────────────────────────────
// Returns revenue/quantity grouped by product category from real transactions
exports.getCategoryBreakdown = async (req, res) => {
    try {
        const rows = await prisma.salesTransaction.groupBy({
            by: ["productId"],
            _sum: { totalAmount: true, quantity: true },
            orderBy: { _sum: { totalAmount: "desc" } }
        });

        const productIds = rows.map(r => r.productId);
        const products   = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, category: true }
        });
        const catMap = new Map(products.map(p => [p.id, p.category || "Other"]));

        // Aggregate by category
        const categoryTotals = {};
        for (const row of rows) {
            const cat = catMap.get(row.productId) || "Other";
            if (!categoryTotals[cat]) categoryTotals[cat] = { name: cat, value: 0, quantity: 0 };
            categoryTotals[cat].value    += row._sum.totalAmount || 0;
            categoryTotals[cat].quantity += row._sum.quantity    || 0;
        }

        const data = Object.values(categoryTotals).sort((a, b) => b.value - a.value);
        res.json({ success: true, data });
    } catch (error) {
        console.error("[analytics] getCategoryBreakdown:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
