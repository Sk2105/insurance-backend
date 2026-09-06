const { Account } = require('../models');

async function findByCode(code, transaction) {
  return Account.findOne({ where: { code }, transaction });
}

async function findAll() {
  return Account.findAll({ order: [['code', 'ASC']] });
}

module.exports = { findByCode, findAll };
