const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Account = sequelize.define(
  "Account",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: {
      type: DataTypes.ENUM("ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"),
      allowNull: false,
    },
  },
  {
    tableName: "accounts",
    updatedAt: false,
  },
);

module.exports = Account;
