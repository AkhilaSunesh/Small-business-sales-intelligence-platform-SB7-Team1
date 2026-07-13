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

productName: product.name,

category: product.category,

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