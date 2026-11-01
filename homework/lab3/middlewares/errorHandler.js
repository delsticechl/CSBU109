// 404 for unknown routes (register after all routes)
exports.notFound = (req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Global error handler (register last, 4 parameters)
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON body'; }
  if (err.code === 'ER_DUP_ENTRY') status = 409;

  if (status >= 500) console.error('Server Error:', err);
  res.status(status).json({ success: false, error: message });
};
