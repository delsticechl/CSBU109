const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');

/**
 * @swagger
 * /customers/{id}/order-history:
 *   get:
 *     summary: Get all orders of a customer and their lifetime spending
 *     description: totalLifetimeSpent is the sum of the customer's completed orders.
 *     tags: [Customers]
 *     parameters:
 *       - $ref: '#/components/parameters/id'
 *     responses:
 *       200:
 *         description: Customer order history
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
 *                     customer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         full_name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                     totalLifetimeSpent:
 *                       type: number
 *                       example: 41100000
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           order_id:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           total_amount:
 *                             type: number
 *                           total_items_count:
 *                             type: integer
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Malformed ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/order-history', customerController.getOrderHistory);

module.exports = router;
