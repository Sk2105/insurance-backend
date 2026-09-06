const AppError = require('./AppError');

function assertPositiveAmount(value, fieldName = 'amount') {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new AppError(`${fieldName} must be a positive number`, 422);
  }
  return num;
}

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${fieldName} is required`, 422);
  }
  return value.trim();
}

function assertEmail(value) {
  const email = assertNonEmptyString(value, 'email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('email is not a valid email address', 422);
  }
  return email;
}

module.exports = { assertPositiveAmount, assertNonEmptyString, assertEmail };
