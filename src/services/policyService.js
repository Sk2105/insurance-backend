const policyRepository = require("../repositories/policyRepository");
const customerRepository = require("../repositories/customerRepository");
const accountRepository = require("../repositories/accountRepository");
const policyTransactionRepository = require("../repositories/policyTransactionRepository");
const ledgerService = require("./ledgerService");
const paymentRepository = require("../repositories/paymentRepository");
const AppError = require("../utils/AppError");
const { round2 } = require("../utils/money");
const {
  assertPositiveAmount,
  assertNonEmptyString,
} = require("../utils/validators");

const DEFAULT_GST_RATE = 18.0;

function calculatePremiumBreakdown(premiumAmount, gstRate = DEFAULT_GST_RATE) {
  const premium = round2(premiumAmount);
  const gstAmount = round2((premium * gstRate) / 100);
  const totalAmount = round2(premium + gstAmount);
  return { premiumAmount: premium, gstRate, gstAmount, totalAmount };
}

async function createPolicy({
  policyNumber,
  customerId,
  premiumAmount,
  gstRate,
}) {
  policyNumber = assertNonEmptyString(policyNumber, "policyNumber");
  assertPositiveAmount(premiumAmount, "premiumAmount");
  if (!customerId) throw new AppError("customerId is required", 422);

  const rate = gstRate !== undefined ? Number(gstRate) : DEFAULT_GST_RATE;
  if (!Number.isFinite(rate) || rate < 0) {
    throw new AppError("gstRate must be a non-negative number", 422);
  }

  return ledgerService.runInTransaction(async (conn) => {
    const customer = await customerRepository.findById(customerId, conn);
    if (!customer)
      throw new AppError(`Customer ${customerId} does not exist`, 404);

    const existing = await policyRepository.findByPolicyNumber(
      policyNumber,
      conn,
    );
    if (existing)
      throw new AppError(`Policy number '${policyNumber}' already exists`, 409);

    const breakdown = calculatePremiumBreakdown(premiumAmount, rate);

    const policy = await policyRepository.create(
      { policyNumber, customerId, ...breakdown },
      conn,
    );

    await policyTransactionRepository.create(
      {
        policyId: policy.id,
        type: "POLICY_ISSUED",
        amount: breakdown.totalAmount,
        notes: `Policy ${policyNumber} issued`,
      },
      conn,
    );

    const receivable = await accountRepository.findByCode("1002", conn);
    const premiumIncome = await accountRepository.findByCode("4001", conn);
    const gstPayable = await accountRepository.findByCode("2001", conn);
    if (!receivable || !premiumIncome || !gstPayable) {
      throw new AppError(
        "Chart of accounts is not seeded - run npm run db:seed",
        500,
      );
    }

    await ledgerService.postEntries(
      [
        {
          accountId: receivable.id,
          policyId: policy.id,
          debit: breakdown.totalAmount,
          credit: 0,
          referenceType: "POLICY",
          referenceId: policy.id,
          description: `Receivable for policy ${policyNumber}`,
        },
        {
          accountId: premiumIncome.id,
          policyId: policy.id,
          debit: 0,
          credit: breakdown.premiumAmount,
          referenceType: "POLICY",
          referenceId: policy.id,
          description: `Premium income for policy ${policyNumber}`,
        },
        {
          accountId: gstPayable.id,
          policyId: policy.id,
          debit: 0,
          credit: breakdown.gstAmount,
          referenceType: "POLICY",
          referenceId: policy.id,
          description: `GST payable for policy ${policyNumber}`,
        },
      ],
      conn,
    );

    return policy;
  });
}

async function getPolicyById(id) {
  const policy = await policyRepository.findById(id);
  if (!policy) throw new AppError(`Policy ${id} not found`, 404);
  return policy;
}

async function getOutstanding(policyId, conn) {
  const policy = conn
    ? await policyRepository.findByIdForUpdate(policyId, conn)
    : await policyRepository.findById(policyId);
  if (!policy) throw new AppError(`Policy ${policyId} not found`, 404);

  const netPaid = await paymentRepository.sumNetPaidForPolicy(policyId, conn);
  const outstanding = round2(Number(policy.totalAmount) - netPaid);
  return { policy, netPaid: round2(netPaid), outstanding };
}

module.exports = {
  DEFAULT_GST_RATE,
  calculatePremiumBreakdown,
  createPolicy,
  getPolicyById,
  getOutstanding,
};
