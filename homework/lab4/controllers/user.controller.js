const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { UPLOAD_DIR } = require('../middleware/upload');

// Only these fields may be edited. email / type / password / avatarUrl are NOT editable here.
exports.updateMe = async (req, res, next) => {
  try {
    const { fullName, age, gender } = req.body;
    const update = {};

    if (fullName !== undefined) {
      if (!String(fullName).trim()) {
        return res.status(400).json({ success: false, message: 'fullName cannot be empty' });
      }
      update.fullName = String(fullName).trim();
    }
    if (age !== undefined && age !== '') {
      if (isNaN(Number(age)) || Number(age) < 0) {
        return res.status(400).json({ success: false, message: 'age must be a positive number' });
      }
      update.age = Number(age);
    }
    if (gender !== undefined) update.gender = gender;

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Profile updated', data: user, user });
  } catch (err) {
    next(err);
  }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please choose an image file!' });
    }
    const user = await User.findById(req.user.id); // always the token's user
    if (!user) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove the previous avatar file (only if it lives in our uploads folder)
    if (user.avatarUrl) {
      const oldFile = path.join(UPLOAD_DIR, path.basename(user.avatarUrl));
      fs.unlink(oldFile, () => {});
    }

    user.avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar updated',
      avatarUrl: user.avatarUrl,
      data: user,
      user
    });
  } catch (err) {
    next(err);
  }
};
