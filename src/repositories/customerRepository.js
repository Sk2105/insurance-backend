const { Customer } = require("../models");

async function create({ name, email, phone }, transaction) {
  return Customer.create({ name, email, phone }, { transaction });
}

async function findById(id, transaction) {
  return Customer.findByPk(id, { transaction });
}

async function findByEmail(email, transaction) {
  return Customer.findOne({ where: { email }, transaction });
}

module.exports = { create, findById, findByEmail };
