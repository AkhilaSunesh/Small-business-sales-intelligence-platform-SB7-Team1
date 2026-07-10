const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const csvFilePath = path.join(
    __dirname,
    "../dataset/Retail_Transaction_Dataset.csv"
);

const rows = [];

fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row) => rows.push(row))

    .on("end", async () => {

        try {

            console.log(`CSV Loaded: ${rows.length} rows`);


            // ----------------------------
            // CREATE ROLE
            // ----------------------------

            let role = await prisma.role.findFirst({
                where:{
                    name:"Admin"
                }
            });


            if(!role){

                role = await prisma.role.create({
                    data:{
                        name:"Admin"
                    }
                });

            }


            console.log("Role Ready");



            // ----------------------------
            // CREATE USER
            // ----------------------------

            let user = await prisma.user.findUnique({
                where:{
                    email:"admin@example.com"
                }
            });


            if(!user){

                user = await prisma.user.create({

    data:{
        name:"Admin User",
        email:"admin@example.com",
        password:"admin123",
        roleId:role.id
    }

});

            }


            console.log("User Ready:", user.id);



            // ----------------------------
            // UNIQUE CUSTOMERS
            // ----------------------------

            const customers = new Map();


            rows.forEach(row=>{

                customers.set(
                    row.CustomerID,
                    row
                );

            });


            console.log(
                `Unique Customers: ${customers.size}`
            );



            // ----------------------------
            // UNIQUE PRODUCTS
            // ----------------------------

            const products = new Map();


            rows.forEach(row=>{

                products.set(
                    row.ProductID,
                    row
                );

            });


            console.log(
                `Unique Products: ${products.size}`
            );




            // ----------------------------
            // INSERT CUSTOMERS
            // ----------------------------

            const customerData = [];


            for(const [customerCode] of customers){

                customerData.push({

                    customerCode,

                    name:`Customer ${customerCode}`,

                    email:`customer${customerCode}@example.com`,

                    phone:"N/A",

                    address:"Unknown"

                });

            }


            await prisma.customer.createMany({

                data:customerData,

                skipDuplicates:true

            });


            console.log("Customers Imported");





            // ----------------------------
            // INSERT PRODUCTS
            // ----------------------------

            const productData=[];


            for(const [productCode,row] of products){

                productData.push({

                    productCode,

                    name:`Product ${productCode}`,

                    category:row.ProductCategory,

                    price:Number(row.Price)

                });

            }



            await prisma.product.createMany({

                data:productData,

                skipDuplicates:true

            });


            console.log("Products Imported");





            // ----------------------------
            // CREATE INVENTORY
            // ----------------------------

            const allProducts =
            await prisma.product.findMany();



            const inventoryData=[];



            for(const product of allProducts){


                const existing =
                await prisma.inventory.findUnique({

                    where:{
                        productId:product.id
                    }

                });



                if(!existing){

                    inventoryData.push({

                        productId:product.id,

                        quantity:100000

                    });

                }


            }



            if(inventoryData.length>0){

                await prisma.inventory.createMany({

                    data:inventoryData

                });

            }


            console.log("Inventory Imported");






            // ----------------------------
            // INSERT SALES TRANSACTIONS
            // ----------------------------


            const allCustomers =
            await prisma.customer.findMany();


            const allProductsData =
            await prisma.product.findMany();



            const customerMap =
            new Map(
                allCustomers.map(c=>[
                    c.customerCode,
                    c.id
                ])
            );



            const productMap =
            new Map(
                allProductsData.map(p=>[
                    p.productCode,
                    p.id
                ])
            );




            const salesData=[];



            rows.forEach((row,index)=>{


                const customerId =
                customerMap.get(row.CustomerID);



                const productId =
                productMap.get(row.ProductID);



                if(customerId && productId){


                    salesData.push({

                        invoiceNo:
                        `INV-${Date.now()}-${index}`,

                        customerId,

                        productId,


                        userId:user.id,


                        quantity:
                        Number(row.Quantity),



                        totalAmount:
                        Number(row.Quantity) *
                        Number(row.Price),



                        transactionDate:
                        row.TransactionDate
                        ?
                        new Date(row.TransactionDate)
                        :
                        new Date()


                    });


                }


            });




            await prisma.salesTransaction.createMany({

                data:salesData,

                skipDuplicates:true

            });



            console.log(
                `Sales Transactions Imported: ${salesData.length}`
            );



            console.log(
                "✅ Kaggle Dataset Imported Successfully!"
            );



        }

        catch(error){

            console.error(
                "IMPORT ERROR:",
                error
            );

        }

        finally{

            await prisma.$disconnect();

        }



    })


    .on("error", async(error)=>{

        console.error(
            "CSV ERROR:",
            error
        );

        await prisma.$disconnect();

    });