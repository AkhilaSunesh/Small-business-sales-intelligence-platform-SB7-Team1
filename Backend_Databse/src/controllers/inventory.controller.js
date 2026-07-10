const {PrismaClient}=require("@prisma/client");

const prisma=new PrismaClient();



// GET ALL INVENTORY

exports.getInventory=async(req,res)=>{

try{


const inventory=await prisma.inventory.findMany({

include:{
product:true
}

});


res.json({

success:true,
inventory

});


}
catch(error){

res.status(500).json({
message:error.message
});

}

};




// ADD STOCK

exports.addStock=async(req,res)=>{


try{


const {
productCode,
quantity
}=req.body;



const product=await prisma.product.findUnique({

where:{
productCode
}

});



if(!product){

return res.status(404).json({

message:"Product not found"

});

}



const inventory=
await prisma.inventory.update({

where:{
productId:product.id
},

data:{
quantity:{
increment:Number(quantity)
}
}

});


res.json({

success:true,
inventory

});


}
catch(error){

res.status(500).json({

message:error.message

});

}


};
// UPDATE STOCK

exports.updateStock = async(req,res)=>{

    try{

        const {
            productCode,
            quantity
        } = req.body;


        const product = await prisma.product.findUnique({

            where:{
                productCode
            }

        });


        if(!product){

            return res.status(404).json({

                message:"Product not found"

            });

        }


        const inventory = await prisma.inventory.update({

            where:{
                productId:product.id
            },

            data:{
                quantity:Number(quantity)
            }

        });


        res.json({

            success:true,
            inventory

        });


    }
    catch(error){

        res.status(500).json({

            message:error.message

        });

    }

};