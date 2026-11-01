const customerService = require('../services/customer.service');
const { parsePositiveInt } = require('../utils/validators');

exports.getOrderHistory = async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id, 'id');
    const history = await customerService.getOrderHistory(id);
    res.status(200).json({ success: true, data: history });
  } catch (err) { next(err); }
};
