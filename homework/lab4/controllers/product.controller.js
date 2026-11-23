const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

const validId = (id) => mongoose.isValidObjectId(id);

// Shared validation for create/update. Returns an error string or null.
async function validate(body, { partial }) {
  const { name, quantity, price, categoryId } = body;
  if (!partial || name !== undefined) {
    if (!name || !String(name).trim()) return 'Product name is required';
  }
  if (!partial || price !== undefined) {
    if (price === undefined || price === '' || isNaN(Number(price)) || Number(price) < 0)
      return 'Price must be a number >= 0';
  }
  if (!partial || quantity !== undefined) {
    if (quantity === undefined || quantity === '' || !Number.isInteger(Number(quantity)) || Number(quantity) < 0)
      return 'Quantity must be an integer >= 0';
  }
  if (!partial || categoryId !== undefined) {
    if (!categoryId || !validId(categoryId)) return 'A valid categoryId is required';
    if (!(await Category.exists({ _id: categoryId }))) return 'Category does not exist';
  }
  return null;
}

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.categoryId) {
      if (!validId(req.query.categoryId))
        return res.status(400).json({ success: false, message: 'Invalid categoryId' });
      filter.categoryId = req.query.categoryId;
    }
    const products = await Product.find(filter).populate('categoryId', 'name').sort({ createdAt: 1, _id: 1 });
    res.json({ success: true, count: products.length, data: products.map((p) => p.toClient()) });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const error = await validate(req.body, { partial: false });
    if (error) return res.status(400).json({ success: false, message: error });

    const { name, quantity, price, categoryId } = req.body;
    const product = await Product.create({
      name: String(name).trim(),
      quantity: Number(quantity),
      price: Number(price),
      categoryId
    });
    await product.populate('categoryId', 'name');
    res.status(201).json({ success: true, message: 'Product created', data: product.toClient() });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const error = await validate(req.body, { partial: true });
    if (error) return res.status(400).json({ success: false, message: error });

    const update = {};
    ['name', 'quantity', 'price', 'categoryId'].forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });
    if (update.name) update.name = String(update.name).trim();
    if (update.quantity !== undefined) update.quantity = Number(update.quantity);
    if (update.price !== undefined) update.price = Number(update.price);

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('categoryId', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product updated', data: product.toClient() });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};
