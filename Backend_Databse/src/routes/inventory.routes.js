const router=require("express").Router();

const controller=require("../controllers/inventory.controller");
const { validateAdd, validateUpdate, validateDelete } = require("../validations/inventory.validation");


router.get(
"/",
controller.getInventory
);


router.post(
"/add",
validateAdd,
controller.addStock
);


router.put(
"/update",
validateUpdate,
controller.updateStock
);

router.delete(
"/delete",
validateDelete,
controller.deleteInventory
);


module.exports=router;