const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

router.post("/", paymentController.create);
router.post("/:id/reverse", paymentController.reverse);

module.exports = router;
