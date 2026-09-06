const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LedgerEntry = sequelize.define(
  "LedgerEntry",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    accountId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    policyId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    debit: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    credit: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    referenceType: {
      type: DataTypes.ENUM("POLICY", "PAYMENT", "PAYMENT_REVERSAL"),
      allowNull: false,
    },
    referenceId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "ledger_entries",
    updatedAt: false,
    validate: {
      exactlyOneSide() {
        const debit = Number(this.debit);
        const credit = Number(this.credit);
        const debitSet = debit > 0;
        const creditSet = credit > 0;
        if (debitSet === creditSet) {
          throw new Error(
            "ledger_entries row must have exactly one of debit/credit > 0",
          );
        }
      },
    },
  },
);

module.exports = LedgerEntry;
