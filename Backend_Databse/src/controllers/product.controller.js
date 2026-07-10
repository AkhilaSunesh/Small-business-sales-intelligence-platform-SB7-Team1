const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();


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