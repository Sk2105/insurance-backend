const { LedgerEntry, Account, sequelize } = require("../models");

async function insertMany(entries, transaction) {
  if (!entries.length) return [];

  return LedgerEntry.bulkCreate(entries, { transaction, validate: true });
}

async function findByPolicyId(policyId) {
  return LedgerEntry.findAll({
    where: { policyId },
    include: [{ model: Account, attributes: ["code", "name", "type"] }],
    order: [
      ["created_at", "ASC"],
      ["id", "ASC"],
    ],
  });
}

async function summaryByPolicyId(policyId) {
  return LedgerEntry.findAll({
    where: { policyId },
    attributes: [
      [sequelize.col("Account.code"), "account_code"],
      [sequelize.col("Account.name"), "account_name"],
      [sequelize.col("Account.type"), "account_type"],
      [sequelize.fn("SUM", sequelize.col("LedgerEntry.debit")), "total_debit"],
      [
        sequelize.fn("SUM", sequelize.col("LedgerEntry.credit")),
        "total_credit",
      ],
      [
        sequelize.literal(
          "SUM(`LedgerEntry`.`debit`) - SUM(`LedgerEntry`.`credit`)",
        ),
        "net_balance",
      ],
    ],
    include: [{ model: Account, attributes: [] }],
    group: ["Account.id", "Account.code", "Account.name", "Account.type"],
    order: [[sequelize.col("Account.code"), "ASC"]],
    raw: true,
  });
}

module.exports = { insertMany, findByPolicyId, summaryByPolicyId };
