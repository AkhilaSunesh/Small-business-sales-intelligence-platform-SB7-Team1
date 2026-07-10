const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();


exports.getDashboardSummary = async(req,res)=>{

    try{


        const totalCustomers =
        await prisma.customer.count();



        const totalProducts =
        await prisma.product.count();



        const totalSales =
        await prisma.salesTransaction.count();



        const revenue =
        await prisma.salesTransaction.aggregate({

            _sum:{
                totalAmount:true
            }

        });



        res.json({

            success:true,

            data:{

                totalCustomers,

                totalProducts,

                totalSales,

                totalRevenue:
                revenue._sum.totalAmount || 0

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