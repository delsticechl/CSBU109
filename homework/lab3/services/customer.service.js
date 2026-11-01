const pool = require('../config/db');
const AppError = require('../utils/AppError');

// GET /customers/:id/order-history
async function getOrderHistory(customerId) {
  const [customers] = await pool.query(
    'SELECT id, full_name, email, phone FROM customers WHERE id = ?',
    [customerId]
  );
  if (customers.length === 0) throw new AppError(404, `Customer ${customerId} not found`);

  const [orders] = await pool.query(
    `SELECT o.id AS order_id, o.status, o.total_amount,
            COALESCE(SUM(oi.quantity), 0) AS total_items_count,
            o.created_at
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.customer_id = ?
      GROUP BY o.id, o.status, o.total_amount, o.created_at
      ORDER BY o.created_at DESC, o.id DESC`,
    [customerId]
  );

  const [[spent]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS totalLifetimeSpent
       FROM orders
      WHERE customer_id = ? AND status = 'completed'`,
    [customerId]
  );

  return {
    customer: customers[0],
    totalLifetimeSpent: Number(spent.totalLifetimeSpent),
    orders: orders.map((o) => ({
      order_id: o.order_id,
      status: o.status,
      total_amount: Number(o.total_amount),
      total_items_count: Number(o.total_items_count),
      created_at: o.created_at
    }))
  };
}

module.exports = { getOrderHistory };
