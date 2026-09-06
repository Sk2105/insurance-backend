const sequelize = require("../config/database");
const Customer = require("./Customer");
const Account = require("./Account");
const Policy = require("./Policy");
const PolicyTransaction = require("./PolicyTransaction");
const Payment = require("./Payment");
const LedgerEntry = require("./LedgerEntry");

Customer.hasMany(Policy, { foreignKey: "customerId" });
Policy.belongsTo(Customer, { foreignKey: "customerId" });

Policy.hasMany(PolicyTransaction, { foreignKey: "policyId" });
PolicyTransaction.belongsTo(Policy, { foreignKey: "policyId" });

Policy.hasMany(Payment, { foreignKey: "policyId" });
Payment.belongsTo(Policy, { foreignKey: "policyId" });

Payment.belongsTo(Payment, {
  as: "reversedPayment",
  foreignKey: "reversesPaymentId",
});
Payment.hasOne(Payment, { as: "reversal", foreignKey: "reversesPaymentId" });

Policy.hasMany(LedgerEntry, { foreignKey: "policyId" });
LedgerEntry.belongsTo(Policy, { foreignKey: "policyId" });
Account.hasMany(LedgerEntry, { foreignKey: "accountId" });
LedgerEntry.belongsTo(Account, { foreignKey: "accountId" });

module.exports = {
  sequelize,
  Customer,
  Account,
  Policy,
  PolicyTransaction,
  Payment,
  LedgerEntry,
};
