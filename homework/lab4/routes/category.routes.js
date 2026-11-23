const router = require('express').Router();
const c = require('../controllers/category.controller');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, c.list);
router.post('/', protect, adminOnly, c.create);
router.put('/:id', protect, adminOnly, c.update);
router.delete('/:id', protect, adminOnly, c.remove);

module.exports = router;
