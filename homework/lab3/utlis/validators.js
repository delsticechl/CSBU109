const AppError = require('./AppError');

const ORDER_STATUSES = ['pending', 'completed', 'cancelled'];

const isPositiveInt = (value) => Number.isInteger(value) && value > 0;

// Parses a positive integer coming from req.params / req.query (always strings)
const parsePositiveInt = (value, fieldName) => {
  const n = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  if (!isPositiveInt(n)) {
    throw new AppError(400, `${fieldName} must be a positive integer`);
  }
  return n;
};

// Pagination: page >= 1, 1 <= limit <= 100, with safe defaults
const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 5, 1), 100);
  return { page: Math.floor(page), limit: Math.floor(limit) };
};

module.exports = { ORDER_STATUSES, isPositiveInt, parsePositiveInt, parsePagination };
