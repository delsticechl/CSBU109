const jwt = require('jsonwebtoken');

// 401 = "who are you?" -> no / invalid / expired token
exports.protect = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Please log in first' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, type, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// 403 = "I know you, but you may not do this"
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.type !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: only admin users can perform this action.' });
  }
  next();
};
