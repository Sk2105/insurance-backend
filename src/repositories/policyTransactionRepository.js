const { PolicyTransaction } = require("../models");

async function create(
  { policyId, type, amount, referenceId = null, notes = null },
  transaction,
) {
  return PolicyTransaction.create(
    { policyId, type, amount, referenceId, notes },
    { transaction },
  );
}

async function findByPolicyId(policyId) {
  return PolicyTransaction.findAll({
    where: { policyId },
    order: [
      ["created_at", "ASC"],
      ["id", "ASC"],
    ],
  });
}

module.exports = { create, findByPolicyId };
