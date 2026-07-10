const requiredColumns = [
    "invoice_no",
    "customer_id",
    "product_id",
    "quantity",
    "amount",
    "date"
];


function validateColumns(headers) {

    for (const column of requiredColumns) {

        if (!headers.includes(column)) {

            return {
                valid:false,
                missing:column
            };

        }
    }

    return {
        valid:true
    };

}



function validateRow(row){

    const errors=[];


    if(!row.invoice_no || row.invoice_no.trim()==="")
        errors.push("invoice_no is missing");


    if(!row.customer_id || row.customer_id.trim()==="")
        errors.push("customer_id is missing");


    if(!row.product_id || row.product_id.trim()==="")
        errors.push("product_id is missing");



    if(
        !row.quantity ||
        isNaN(row.quantity) ||
        Number(row.quantity)<=0
    )
        errors.push("quantity must be a positive number");



    if(
        !row.amount ||
        isNaN(row.amount) ||
        Number(row.amount)<=0
    )
        errors.push("amount must be a positive number");



    if(!row.date)
        errors.push("date is missing");



    return errors;

}


module.exports={
    validateColumns,
    validateRow
};