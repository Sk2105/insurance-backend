const policyService = require("../services/policyService");
const ledgerRepository = require("../repositories/ledgerRepository");
const paymentRepository = require("../repositories/paymentRepository");
const policyTransactionRepository = require("../repositories/policyTransactionRepository");

async function create(req, res, next) {
  try {
    const policy = await policyService.createPolicy(req.body);
    res.status(201).json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const policy = await policyService.getPolicyById(req.params.id);
    const { outstanding, netPaid } = await policyService.getOutstanding(
      req.params.id,
    );
    res.json({ success: true, data: { policy, netPaid, outstanding } });
  } catch (err) {
    next(err);
  }
}

async function getLedger(req, res, next) {
  try {
    await policyService.getPolicyById(req.params.id); // 404 if missing
    const entries = await ledgerRepository.findByPolicyId(req.params.id);
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
}
async function getSummary(req, res, next) {
  try {
    const policyId = req.params.id;
    const policy = await policyService.getPolicyById(policyId);
    const { outstanding, netPaid } =
      await policyService.getOutstanding(policyId);
    const accountSummary = await ledgerRepository.summaryByPolicyId(policyId);
    const transactions =
      await policyTransactionRepository.findByPolicyId(policyId);
    const payments = await paymentRepository.findByPolicyId(policyId);

    res.json({
      success: true,
      data: {
        policy,
        netPaid,
        outstanding,
        status: outstanding <= 0 ? "PAID_IN_FULL" : "PARTIALLY_PAID",
        accountSummary,
        transactions,
        payments,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getById, getLedger, getSummary };
