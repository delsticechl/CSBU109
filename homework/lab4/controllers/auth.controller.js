const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = async (req, res, next) => {
  try {
    const { fullName, age, gender, email, password, type } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'fullName, email and password are required' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const accountType = type || 'normal';
    if (!['normal', 'admin'].includes(accountType)) {
      return res.status(400).json({ success: false, message: "type must be 'normal' or 'admin'" });
    }
    if (age !== undefined && age !== '' && (isNaN(Number(age)) || Number(age) < 0)) {
      return res.status(400).json({ success: false, message: 'age must be a positive number' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      age: age === '' ? undefined : age,
      gender,
      email: normalizedEmail,
      passwordHash,
      type: accountType
    });

    res.status(201).json({ success: true, message: 'Account created', data: user });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');
    // Same message for "no such user" and "wrong password" -> no account enumeration
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, type: user.type }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });

    const safeUser = user.toJSON(); // passwordHash stripped by the schema transform
    res.json({
      success: true,
      message: 'Logged in',
      token,
      user: safeUser,
      data: { token, user: safeUser } // both shapes, so the UI can read either
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });
    res.json({ success: true, data: user, user });
  } catch (err) {
    next(err);
  }
};
