const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const validateCategoryInput = require('../middlewares/validateCategory');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Retrieve a list of categories with pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of categories
 */
router.get('/', categoryController.getAllCategories);
router.post('/', validateCategoryInput, categoryController.createCategory);
router.get('/:id', categoryController.getCategoryById);
router.patch('/:id', validateCategoryInput, categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
