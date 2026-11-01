const AppError = require('../utils/AppError');
const { ORDER_STATUSES, isPositiveInt } = require('../utils/validators');

// POST /orders: customerId must be valid, items a non-empty array, every quantity a positive integer.
// Duplicate productIds are merged so each product is checked/locked/updated only once.
exports.validateCreateOrder = (req, res, next) => {
  const { customerId, items } = req.body || {};

  if (!isPositiveInt(customerId)) {
    return next(new AppError(400, 'customerId must be a positive integer'));
  }
  if (!Array.isArray(items) || items.length === 0) {
    return next(new AppError(400, 'items must be a non-empty array'));
  }

  const merged = new Map();
  for (const [index, item] of items.entries()) {
    if (!item || !isPositiveInt(item.productId)) {
      return next(new AppError(400, `items[${index}].productId must be a positive integer`));
    }
    if (!isPositiveInt(item.quantity)) {
      return next(new AppError(400, `items[${index}].quantity must be a positive integer`));
    }
    merged.set(item.productId, (merged.get(item.productId) || 0) + item.quantity);
  }

  req.body = {
    customerId,
    items: [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }))
  };
  next();
};

// PATCH /orders/:id/status: status must belong to the ENUM
exports.validateStatus = (req, res, next) => {
  const { status } = req.body || {};
  if (!ORDER_STATUSES.includes(status)) {
    return next(new AppError(400, `status must be one of: ${ORDER_STATUSES.join(', ')}`));
  }
  next();
};
