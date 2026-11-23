const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

const validId = (id) => mongoose.isValidObjectId(id);

exports.list = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });
    const category = await Category.create({ name });
    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });
    const category = await Category.findByIdAndUpdate(req.params.id, { name }, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category updated', data: category });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const inUse = await Product.countDocuments({ categoryId: req.params.id });
    if (inUse > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete: ${inUse} product(s) still use this category`
      });
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};
