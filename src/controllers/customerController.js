const customerService = require("../services/customerService");

async function create(req, res, next) {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

module.exports = { create };
