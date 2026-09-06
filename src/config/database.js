require("dotenv").config();
const { Sequelize } = require("sequelize");

const dbUrl = process.env.DB_URL;

const sequelize = new Sequelize(dbUrl, {
  dialect: "mysql",
  logging: console.log,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
  pool: { max: 10, min: 0, idle: 10000 },
});

module.exports = sequelize;
