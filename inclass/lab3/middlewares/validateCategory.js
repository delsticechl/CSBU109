const validateCategoryInput = (req, res, next) => {
  const { name } = req.body;
  
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 3)) {
    return res.status(400).json({
      success: false,
      error: 'Category name must be at least 3 characters long.'
    });
  }

  if (typeof next === 'function') {
    return next();
  }
};

module.exports = validateCategoryInput;
