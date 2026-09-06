const { sequelize, Account, Customer } = require('../models');

const CHART_OF_ACCOUNTS = [
  { code: '1001', name: 'Cash / Bank', type: 'ASSET' },
  { code: '1002', name: 'Customer Receivable', type: 'ASSET' },
  { code: '2001', name: 'GST Payable', type: 'LIABILITY' },
  { code: '4001', name: 'Premium Income', type: 'INCOME' },
];

async function seed() {
  await sequelize.authenticate();

  for (const account of CHART_OF_ACCOUNTS) {
    await Account.findOrCreate({ where: { code: account.code }, defaults: account });
  }

  await Customer.findOrCreate({
    where: { email: 's.kumar@example.com' },
    defaults: { name: 'Sachin Kumar', email: 's.kumar@example.com', phone: '9876543210' },
  });

  console.log('Seed data inserted successfully.');
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
