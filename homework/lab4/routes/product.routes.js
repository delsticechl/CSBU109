const router = require('express').Router();
const p = require('../controllers/product.controller');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, p.list);
router.post('/', protect, adminOnly, p.create);
router.put('/:id', protect, adminOnly, p.update);
router.delete('/:id', protect, adminOnly, p.remove);

module.exports = router;
