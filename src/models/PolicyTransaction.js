const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const PolicyTransaction = sequelize.define(
  "PolicyTransaction",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    policyId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        "POLICY_ISSUED",
        "PAYMENT_RECEIVED",
        "PAYMENT_REVERSED",
      ),
      allowNull: false,
    },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    referenceId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    notes: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "policy_transactions",
    updatedAt: false,
  },
);

module.exports = PolicyTransaction;
