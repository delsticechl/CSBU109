// Business logic for orders. Independent of Express (no req/res here).
const pool = require('../config/db');
const AppError = require('../utils/AppError');

const toCents = (amount) => Math.round(Number(amount) * 100);

// Runs `work(conn)` inside one atomic transaction: commit on success, rollback on any error
async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try { await conn.rollback(); } catch (_) { /* keep the original error */ }
    throw err;
  } finally {
    conn.release();
  }
}

// Adds back the stock of every item of an order (used by cancel + delete)
async function restoreStock(conn, orderId) {
  const [items] = await conn.query(
    'SELECT product_id, quantity FROM order_items WHERE order_id = ? ORDER BY product_id',
    [orderId]
  );
  for (const item of items) {
    await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
  }
}

// ---------------------------------------------------------------------
// GET /orders/:id  - nested JSON: customer + items
// ---------------------------------------------------------------------
async function getOrderById(orderId, db = pool) {
  const [orders] = await db.query(
    `SELECT o.id, o.status, o.total_amount, o.created_at,
            c.id AS customer_id, c.full_name, c.email, c.phone
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
      WHERE o.id = ?`,
    [orderId]
  );
  if (orders.length === 0) throw new AppError(404, `Order ${orderId} not found`);
  const o = orders[0];

  const [items] = await db.query(
    `SELECT oi.product_id, p.product_name, oi.quantity, oi.unit_price,
            (oi.quantity * oi.unit_price) AS subtotal
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.id`,
    [orderId]
  );

  return {
    id: o.id,
    status: o.status,
    total_amount: Number(o.total_amount),
    created_at: o.created_at,
    customer: { id: o.customer_id, full_name: o.full_name, email: o.email, phone: o.phone },
    items: items.map((i) => ({
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      subtotal: Number(i.subtotal)
    }))
  };
}

// ---------------------------------------------------------------------
// POST /orders  - SQL transaction
// ---------------------------------------------------------------------
async function createOrder({ customerId, items }) {
  const orderId = await withTransaction(async (conn) => {
    // 1. customer must exist
    const [customers] = await conn.query('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (customers.length === 0) throw new AppError(404, `Customer ${customerId} not found`);

    // 2. lock the product rows (ascending id order avoids deadlocks between concurrent orders)
    const productIds = items.map((i) => i.productId).sort((a, b) => a - b);
    const [products] = await conn.query(
      'SELECT id, product_name, price, stock FROM products WHERE id IN (?) ORDER BY id FOR UPDATE',
      [productIds]
    );
    const productMap = new Map(products.map((p) => [p.id, p]));

    // 3a. every product must exist
    for (const item of items) {
      if (!productMap.has(item.productId)) throw new AppError(404, `Product ${item.productId} not found`);
    }
    // 3b. every product must have enough stock
    for (const item of items) {
      const p = productMap.get(item.productId);
      if (p.stock < item.quantity) {
        throw new AppError(
          400,
          `Product ${p.product_name} is out of stock (requested ${item.quantity}, available ${p.stock})`
        );
      }
    }

    // 4. total from CURRENT database prices (integer cents avoid floating-point errors)
    const totalCents = items.reduce(
      (sum, i) => sum + toCents(productMap.get(i.productId).price) * i.quantity,
      0
    );

    // 5. insert order + items
    const [orderResult] = await conn.query(
      "INSERT INTO orders (customer_id, status, total_amount) VALUES (?, 'pending', ?)",
      [customerId, totalCents / 100]
    );
    const newOrderId = orderResult.insertId;

    const itemRows = items.map((i) => [newOrderId, i.productId, i.quantity, productMap.get(i.productId).price]);
    await conn.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ?', [itemRows]);

    // 6. deduct stock
    for (const item of [...items].sort((a, b) => a.productId - b.productId)) {
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.productId]);
    }

    return newOrderId;
  });

  return getOrderById(orderId);
}

// ---------------------------------------------------------------------
// GET /orders  - filtering + pagination + JOIN/aggregate
// ---------------------------------------------------------------------
async function listOrders({ status, customerId, page, limit }) {
  const conditions = [];
  const params = [];
  if (status) { conditions.push('o.status = ?'); params.push(status); }
  if (customerId) { conditions.push('o.customer_id = ?'); params.push(customerId); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM orders o ${where}`, params);

  const [rows] = await pool.query(
    `SELECT o.id AS order_id,
            c.full_name AS customer_name,
            c.email,
            o.status,
            o.total_amount,
            COALESCE(SUM(oi.quantity), 0) AS total_items_count,
            o.created_at
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
      GROUP BY o.id, c.full_name, c.email, o.status, o.total_amount, o.created_at
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  return {
    count: rows.length,
    pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalOrders: total },
    data: rows.map((r) => ({
      order_id: r.order_id,
      customer_name: r.customer_name,
      email: r.email,
      status: r.status,
      total_amount: Number(r.total_amount),
      total_items_count: Number(r.total_items_count),
      created_at: r.created_at
    }))
  };
}

// ---------------------------------------------------------------------
// PATCH /orders/:id/status  - restores stock when cancelling
// ---------------------------------------------------------------------
async function updateOrderStatus(orderId, newStatus) {
  await withTransaction(async (conn) => {
    const [orders] = await conn.query('SELECT id, status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (orders.length === 0) throw new AppError(404, `Order ${orderId} not found`);
    const current = orders[0].status;

    if (current === 'cancelled') {
      throw new AppError(400, 'A cancelled order cannot change status again');
    }
    if (current === newStatus) return; // nothing to change

    if (newStatus === 'cancelled') await restoreStock(conn, orderId);
    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [newStatus, orderId]);
  });

  return getOrderById(orderId);
}

// ---------------------------------------------------------------------
// DELETE /orders/:id  - order_items removed by ON DELETE CASCADE
// ---------------------------------------------------------------------
async function deleteOrder(orderId) {
  await withTransaction(async (conn) => {
    const [orders] = await conn.query('SELECT id, status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (orders.length === 0) throw new AppError(404, `Order ${orderId} not found`);

    // a cancelled order already gave its stock back
    if (orders[0].status !== 'cancelled') await restoreStock(conn, orderId);
    await conn.query('DELETE FROM orders WHERE id = ?', [orderId]);
  });
}

// ---------------------------------------------------------------------
// GET /orders/analytics/sales-summary  - SQL aggregation
// ---------------------------------------------------------------------
async function getSalesSummary() {
  const [[summary]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue,
            COUNT(*)                       AS completedOrdersCount,
            COALESCE(AVG(total_amount), 0) AS averageOrderValue
       FROM orders
      WHERE status = 'completed'`
  );

  const [top] = await pool.query(
    `SELECT p.id AS product_id, p.product_name, SUM(oi.quantity) AS total_quantity_sold
       FROM order_items oi
       JOIN orders o   ON o.id = oi.order_id AND o.status = 'completed'
       JOIN products p ON p.id = oi.product_id
      GROUP BY p.id, p.product_name
      ORDER BY total_quantity_sold DESC, p.id ASC
      LIMIT 3`
  );

  return {
    totalRevenue: Number(summary.totalRevenue),
    completedOrdersCount: Number(summary.completedOrdersCount),
    averageOrderValue: Math.round(Number(summary.averageOrderValue) * 100) / 100,
    topSellingProducts: top.map((t) => ({
      product_id: t.product_id,
      product_name: t.product_name,
      total_quantity_sold: Number(t.total_quantity_sold)
    }))
  };
}

module.exports = { createOrder, listOrders, getOrderById, updateOrderStatus, deleteOrder, getSalesSummary };
