const { sequelize } = require("../models");
const ledgerRepository = require("../repositories/ledgerRepository");
const AppError = require("../utils/AppError");
const { round2 } = require("../utils/money");

async function runInTransaction(work) {
  return sequelize.transaction(async (t) => work(t));
}

function assertBalanced(entries) {
  const totalDebit = round2(
    entries.reduce((sum, e) => sum + Number(e.debit || 0), 0),
  );
  const totalCredit = round2(
    entries.reduce((sum, e) => sum + Number(e.credit || 0), 0),
  );
  if (totalDebit !== totalCredit) {
    throw new AppError(
      `Unbalanced ledger entries: total debit ${totalDebit} != total credit ${totalCredit}`,
      500,
    );
  }
}

async function postEntries(entries, transaction) {
  assertBalanced(entries);
  return ledgerRepository.insertMany(entries, transaction);
}

module.exports = { runInTransaction, assertBalanced, postEntries };
