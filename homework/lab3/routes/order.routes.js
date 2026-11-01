const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { validateCreateOrder, validateStatus } = require('../middlewares/validateOrder');

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Create, list, update and delete orders
 *   - name: Analytics
 *     description: Sales statistics
 *   - name: Customers
 *     description: Customer endpoints
 *
 * components:
 *   schemas:
 *     OrderItemInput:
 *       type: object
 *       required: [productId, quantity]
 *       properties:
 *         productId:
 *           type: integer
 *           example: 1
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     CreateOrderRequest:
 *       type: object
 *       required: [customerId, items]
 *       properties:
 *         customerId:
 *           type: integer
 *           example: 1
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/OrderItemInput'
 *           example:
 *             - productId: 1
 *               quantity: 1
 *             - productId: 2
 *               quantity: 2
 *     UpdateStatusRequest:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           example: cancelled
 *     OrderSummary:
 *       type: object
 *       properties:
 *         order_id:
 *           type: integer
 *           example: 1
 *         customer_name:
 *           type: string
 *           example: Nguyen Van An
 *         email:
 *           type: string
 *           example: an.nguyen@example.com
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         total_amount:
 *           type: number
 *           example: 36300000
 *         total_items_count:
 *           type: integer
 *           example: 3
 *         created_at:
 *           type: string
 *           format: date-time
 *     OrderDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         total_amount:
 *           type: number
 *           example: 36300000
 *         created_at:
 *           type: string
 *           format: date-time
 *         customer:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             full_name:
 *               type: string
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               product_name:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               unit_price:
 *                 type: number
 *               subtotal:
 *                 type: number
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create an order (atomic SQL transaction)
 *     description: >
 *       Validates the payload, checks the customer and every product (existence and stock),
 *       computes total_amount from current database prices, inserts the order and its items,
 *       and deducts the stock. Everything is rolled back if any step fails.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order created successfully
 *                 data:
 *                   $ref: '#/components/schemas/OrderDetail'
 *       400:
 *         description: Invalid payload (empty items, non-positive quantity) or product out of stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer or product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: List orders (filtering, pagination, JOIN with customers)
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter by customer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Current page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalOrders:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderSummary'
 *       400:
 *         description: Invalid status or customerId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validateCreateOrder, orderController.createOrder);
router.get('/', orderController.getOrders);

/**
 * @swagger
 * /orders/analytics/sales-summary:
 *   get:
 *     summary: Sales revenue analytics (completed orders only)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Sales summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       example: 58750000
 *                     completedOrdersCount:
 *                       type: integer
 *                       example: 3
 *                     averageOrderValue:
 *                       type: number
 *                       example: 19583333.33
 *                     topSellingProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product_id:
 *                             type: integer
 *                           product_name:
 *                             type: string
 *                           total_quantity_sold:
 *                             type: integer
 */
router.get('/analytics/sales-summary', orderController.getSalesSummary);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order details (customer + items)
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/id'
 *     responses:
 *       200:
 *         description: Order found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/OrderDetail'
 *       400:
 *         description: Malformed ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete an order (restores stock first if it is not cancelled)
 *     description: order_items are removed automatically by ON DELETE CASCADE.
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/id'
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       400:
 *         description: Malformed ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', orderController.getOrderById);
router.delete('/:id', orderController.deleteOrder);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status (restores stock when cancelling)
 *     description: >
 *       Changing the status to 'cancelled' restores the stock of every item in the same
 *       transaction. An order that is already cancelled cannot change status again.
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/id'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatusRequest'
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order status updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/OrderDetail'
 *       400:
 *         description: Status outside the ENUM, malformed ID, or order already cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/status', validateStatus, orderController.updateOrderStatus);

module.exports = router;
