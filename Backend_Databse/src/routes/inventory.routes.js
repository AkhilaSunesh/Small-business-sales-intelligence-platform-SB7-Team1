const router=require("express").Router();

const controller=require("../controllers/inventory.controller");


router.get(
"/",
controller.getInventory
);


router.post(
"/add",
controller.addStock
);


router.put(
"/update",
controller.updateStock
);


module.exports=router;