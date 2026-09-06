const { Policy, Customer } = require("../models");

async function create(
  { policyNumber, customerId, premiumAmount, gstRate, gstAmount, totalAmount },
  transaction,
) {
  return Policy.create(
    {
      policyNumber,
      customerId,
      premiumAmount,
      gstRate,
      gstAmount,
      totalAmount,
    },
    { transaction },
  );
}

async function findById(id, transaction) {
  return Policy.findByPk(id, {
    include: [{ model: Customer, attributes: ["id", "name", "email"] }],
    transaction,
  });
}

async function findByPolicyNumber(policyNumber, transaction) {
  return Policy.findOne({ where: { policyNumber }, transaction });
}

async function findByIdForUpdate(id, transaction) {
  return Policy.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
}

module.exports = { create, findById, findByPolicyNumber, findByIdForUpdate };
