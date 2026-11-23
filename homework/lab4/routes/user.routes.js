const router = require('express').Router();
const { updateMe, uploadAvatar } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.put('/me', protect, updateMe);
// protect runs BEFORE multer, so unauthenticated requests never write a file
router.post('/me/avatar', protect, upload.uploadAvatar, uploadAvatar);

module.exports = router;
