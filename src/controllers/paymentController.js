const paymentService = require('../services/paymentService');

async function create(req, res, next) {
  try {
    const { policyId, amount, method } = req.body;
    const result = await paymentService.recordPayment({ policyId, amount, method });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function reverse(req, res, next) {
  try {
    const reversal = await paymentService.reversePayment({
      paymentId: req.params.id,
      reason: req.body.reason,
    });
    res.status(201).json({ success: true, data: reversal });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, reverse };
