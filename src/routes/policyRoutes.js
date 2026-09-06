const express = require("express");
const policyController = require("../controllers/policyController");

const router = express.Router();

router.post("/", policyController.create);
router.get("/:id", policyController.getById);
router.get("/:id/ledger", policyController.getLedger);
router.get("/:id/summary", policyController.getSummary);

module.exports = router;
