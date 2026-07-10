const { PrismaClient } = require("@prisma/client");
const csv = require("csv-parser");
const fs = require("fs");

const prisma = new PrismaClient();



exports.uploadSales = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,
                message: "CSV file required"

            });

        }


        const rows = [];


        fs.createReadStream(req.file.path)

            .pipe(csv())

            .on("data", (row) => {

                rows.push(row);

            })


            .on("end", async () => {


                let inserted = 0;

                let duplicatesRemoved = 0;

                let invalidRows = 0;


                const invoices = new Set();



                for (const row of rows) {


                    // ----------------------------
                    // VALIDATION
                    // ----------------------------

                    if (
                        !row.CustomerID ||
                        !row.ProductID ||
                        !row.Quantity ||
                        !row.Price ||
                        !row.TransactionDate
                    ) {

                        invalidRows++;

                        continue;

                    }



                    // ----------------------------
                    // DUPLICATE CHECK
                    // ----------------------------

                    const invoiceNo =
                        `UPLOAD-${row.CustomerID}-${row.ProductID}-${row.TransactionDate}`;



                    if (invoices.has(invoiceNo)) {

                        duplicatesRemoved++;

                        continue;

                    }


                    invoices.add(invoiceNo);




                    // ----------------------------
                    // FIND CUSTOMER
                    // ----------------------------

                    const customer =
                        await prisma.customer.findUnique({

                            where: {

                                customerCode: row.CustomerID

                            }

                        });



                    // ----------------------------
                    // FIND PRODUCT
                    // ----------------------------

                    const product =
                        await prisma.product.findUnique({

                            where: {

                                productCode: row.ProductID

                            }

                        });



                    if (!customer || !product) {

                        invalidRows++;

                        continue;

                    }




                    // ----------------------------
                    // INSERT SALE
                    // ----------------------------

                    await prisma.salesTransaction.create({

                        data: {

                            invoiceNo: invoiceNo,


                            customerId: customer.id,


                            productId: product.id,


                            quantity:
                                Number(row.Quantity),



                            totalAmount:
                                Number(row.Quantity) *
                                Number(row.Price),



                            transactionDate:
                                new Date(row.TransactionDate),



                            userId:
                                "5d747c71-d890-4481-bc46-253b281d4464"

                        }

                    });



                    inserted++;


                }



                res.json({

                    success: true,

                    message:
                        "Sales uploaded with cleaning",


                    recordsInserted: inserted,


                    duplicatesRemoved: duplicatesRemoved,


                    invalidRows: invalidRows


                });



            });


    }


    catch(error) {


        console.log(error);


        res.status(500).json({

            success:false,

            message:error.message

        });


    }


};