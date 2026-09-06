const customerRepository = require("../repositories/customerRepository");
const AppError = require("../utils/AppError");
const { assertNonEmptyString, assertEmail } = require("../utils/validators");

async function createCustomer({ name, email, phone }) {
  name = assertNonEmptyString(name, "name");
  email = assertEmail(email);
  phone = assertNonEmptyString(phone, "phone");

  const existing = await customerRepository.findByEmail(email);
  if (existing)
    throw new AppError(`Customer with email '${email}' already exists`, 409);

  return customerRepository.create({ name, email, phone });
}

module.exports = { createCustomer };
