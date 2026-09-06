const paymentRepository = require("../repositories/paymentRepository");
const policyTransactionRepository = require("../repositories/policyTransactionRepository");
const accountRepository = require("../repositories/accountRepository");
const ledgerService = require("./ledgerService");
const policyService = require("./policyService");
const AppError = require("../utils/AppError");
const { round2 } = require("../utils/money");
const { assertPositiveAmount } = require("../utils/validators");

const VALID_METHODS = ["CASH", "CARD", "UPI", "NETBANKING", "OTHER"];

async function recordPayment({ policyId, amount, method = "OTHER" }) {
  const amt = assertPositiveAmount(amount, "amount");
  if (!policyId) throw new AppError("policyId is required", 422);
  const normalizedMethod = VALID_METHODS.includes(method) ? method : "OTHER";

  return ledgerService.runInTransaction(async (conn) => {
    const { policy, outstanding } = await policyService.getOutstanding(
      policyId,
      conn,
    );

    if (policy.status !== "ACTIVE") {
      throw new AppError(`Policy ${policyId} is not active`, 422);
    }
    if (amt > outstanding) {
      throw new AppError(
        `Payment amount ${amt} exceeds outstanding balance ${outstanding} for policy ${policyId}`,
        422,
      );
    }

    const payment = await paymentRepository.create(
      { policyId, amount: amt, method: normalizedMethod },
      conn,
    );

    await policyTransactionRepository.create(
      {
        policyId,
        type: "PAYMENT_RECEIVED",
        amount: amt,
        referenceId: payment.id,
        notes: `Payment via ${normalizedMethod}`,
      },
      conn,
    );

    await postPaymentLedger({
      policyId,
      amount: amt,
      paymentId: payment.id,
      conn,
      note: "Payment received",
    });

    const newOutstanding = round2(outstanding - amt);
    return { payment, outstanding: newOutstanding };
  });
}

async function reversePayment({ paymentId, reason }) {
  return ledgerService.runInTransaction(async (conn) => {
    const original = await paymentRepository.findById(paymentId, conn);
    if (!original) throw new AppError(`Payment ${paymentId} not found`, 404);
    if (original.isReversal) {
      throw new AppError(
        `Payment ${paymentId} is itself a reversal and cannot be reversed`,
        422,
      );
    }

    const reversal = await paymentRepository.create(
      {
        policyId: original.policyId,
        amount: -Math.abs(Number(original.amount)),
        method: original.method,
        isReversal: true,
        reversesPaymentId: original.id,
        notes: reason || `Reversal of payment ${original.id}`,
      },
      conn,
    );

    await policyTransactionRepository.create(
      {
        policyId: original.policyId,
        type: "PAYMENT_REVERSED",
        amount: Math.abs(Number(original.amount)),
        referenceId: reversal.id,
        notes: reason || `Reversal of payment ${original.id}`,
      },
      conn,
    );

    await postPaymentLedger({
      policyId: original.policyId,
      amount: Math.abs(Number(original.amount)),
      paymentId: reversal.id,
      conn,
      note: `Reversal of payment ${original.id}`,
      reversed: true,
    });

    return reversal;
  });
}

async function postPaymentLedger({
  policyId,
  amount,
  paymentId,
  conn,
  note,
  reversed = false,
}) {
  const cash = await accountRepository.findByCode("1001", conn);
  const receivable = await accountRepository.findByCode("1002", conn);
  if (!cash || !receivable) {
    throw new AppError(
      "Chart of accounts is not seeded - run npm run db:seed",
      500,
    );
  }

  const entries = reversed
    ? [
        {
          accountId: receivable.id,
          debit: amount,
          credit: 0,
          description: note,
        },
        { accountId: cash.id, debit: 0, credit: amount, description: note },
      ]
    : [
        { accountId: cash.id, debit: amount, credit: 0, description: note },
        {
          accountId: receivable.id,
          debit: 0,
          credit: amount,
          description: note,
        },
      ];

  await ledgerService.postEntries(
    entries.map((e) => ({
      ...e,
      policyId,
      referenceType: reversed ? "PAYMENT_REVERSAL" : "PAYMENT",
      referenceId: paymentId,
    })),
    conn,
  );
}

module.exports = { recordPayment, reversePayment };
