const { sequelize } = require('../models');

async function migrate() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('Schema synced successfully.');
}

migrate()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
