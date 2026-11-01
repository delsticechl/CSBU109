// HTTP adapters: read the request, call the service, send the JSON response
const orderService = require('../services/order.service');
const AppError = require('../utils/AppError');
const { ORDER_STATUSES, parsePositiveInt, parsePagination } = require('../utils/validators');

exports.createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (err) { next(err); }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    if (status && !ORDER_STATUSES.includes(status)) {
      throw new AppError(400, `status must be one of: ${ORDER_STATUSES.join(', ')}`);
    }
    const customerId = req.query.customerId ? parsePositiveInt(req.query.customerId, 'customerId') : undefined;
    const { page, limit } = parsePagination(req.query);

    const result = await orderService.listOrders({ status, customerId, page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id');
    const order = await orderService.getOrderById(id);
    res.status(200).json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id');
    const order = await orderService.updateOrderStatus(id, req.body.status);
    res.status(200).json({ success: true, message: 'Order status updated successfully', data: order });
  } catch (err) { next(err); }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id');
    await orderService.deleteOrder(id);
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (err) { next(err); }
};

exports.getSalesSummary = async (req, res, next) => {
  try {
    const summary = await orderService.getSalesSummary();
    res.status(200).json({ success: true, data: summary });
  } catch (err) { next(err); }
};
