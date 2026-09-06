const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    policyId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    method: {
      type: DataTypes.ENUM("CASH", "CARD", "UPI", "NETBANKING", "OTHER"),
      allowNull: false,
      defaultValue: "OTHER",
    },
    isReversal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reversesPaymentId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    notes: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "payments",
    updatedAt: false,
  },
);

module.exports = Payment;
