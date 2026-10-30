const Category = require('../models/category.model');

// 1. GET /api/categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 5, 1);
    const skip = (page - 1) * limit;

    const totalCategories = await Category.countDocuments();
    const categories = await Category.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: categories.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit),
        totalCategories
      },
      data: categories
    });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. GET /api/categories/:id
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'No category found with the given ID' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. POST /api/categories
exports.createCategory = async (req, res, next) => {
  try {
    const newCategory = await Category.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. PATCH /api/categories/:id
exports.updateCategory = async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    if (updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'No category found to update' });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 5. DELETE /api/categories/:id
exports.deleteCategory = async (req, res, next) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: 'No category found to delete' });
    }
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
