const {
validateRow,
validateColumns
}=require("../src/utils/csvValidator");



test("valid row should pass",()=>{


const row={

invoice_no:"INV001",
customer_id:"C101",
product_id:"A",
quantity:"5",
amount:"250",
date:"2025-07-09"

};


expect(validateRow(row))
.toEqual([]);

});




test("missing amount should fail",()=>{


const row={

invoice_no:"INV001",
customer_id:"C101",
product_id:"A",
quantity:"5",
amount:"",
date:"2025-07-09"

};


expect(validateRow(row))
.toContain(
"amount must be a positive number"
);


});




test("negative quantity should fail",()=>{


const row={

invoice_no:"INV001",
customer_id:"C101",
product_id:"A",
quantity:"-5",
amount:"250",
date:"2025-07-09"

};


expect(validateRow(row))
.toContain(
"quantity must be a positive number"
);


});