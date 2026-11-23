const multer = require('multer');

exports.notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'The file is too large (max 2 MB)!' : err.message;
    return res.status(400).json({ success: false, message });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return res.status(409).json({ success: false, message: `This ${field} already exists` });
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ success: false, message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid id format' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message: status === 500 ? 'Internal server error' : err.message });
};
