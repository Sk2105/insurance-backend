const { Payment, sequelize } = require("../models");

async function create(
  {
    policyId,
    amount,
    method = "OTHER",
    isReversal = false,
    reversesPaymentId = null,
    notes = null,
  },
  transaction,
) {
  return Payment.create(
    { policyId, amount, method, isReversal, reversesPaymentId, notes },
    { transaction },
  );
}

async function findById(id, transaction) {
  return Payment.findByPk(id, { transaction });
}

async function findByPolicyId(policyId) {
  return Payment.findAll({
    where: { policyId },
    order: [
      ["created_at", "ASC"],
      ["id", "ASC"],
    ],
  });
}

/**
 * Net amount actually paid toward a policy = SUM(amount) across all
 * payment rows (reversals carry a negative amount, so they net out
 * automatically - no row is ever edited to "fix" this).
 */
async function sumNetPaidForPolicy(policyId, transaction) {
  const total = await Payment.sum("amount", {
    where: { policyId },
    transaction,
  });
  return Number(total) || 0;
}

module.exports = { create, findById, findByPolicyId, sumNetPaidForPolicy };
