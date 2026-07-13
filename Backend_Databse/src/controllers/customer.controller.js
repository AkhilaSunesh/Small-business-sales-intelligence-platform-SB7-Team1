const prisma = require("../config/prisma");


exports.getCustomers = async (req,res)=>{

    try{

        const customers = await prisma.customer.findMany({
            take:100,
            orderBy:{
                name:"asc"
            }
        });


        res.status(200).json({

            success:true,

            data:customers

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