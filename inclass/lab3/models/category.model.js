const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name cannot be empty'],
    trim: true,
    minlength: [3, 'Category name must be at least 3 characters long'],
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Auto-generate slug from name in a pre-save hook (e.g., "Home & Living" -> "home-living")
categorySchema.pre('save', async function () {
  if (this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')    // Remove non-word characters
      .replace(/[\s_-]+/g, '-')     // Replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, '');     // Trim hyphens
  }
});

module.exports = mongoose.model('Category', categorySchema);
