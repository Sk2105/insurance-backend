const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Policy = sequelize.define(
  "Policy",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    policyNumber: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
    },
    customerId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    premiumAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    gstRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 18.0,
    },
    gstAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    totalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM("ACTIVE", "CANCELLED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "policies",
    updatedAt: false,
  },
);

module.exports = Policy;
