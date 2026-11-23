const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

// Flat, UI-friendly shape: keeps categoryId as a string and adds the category name
productSchema.methods.toClient = function () {
  const cat = this.populated('categoryId') ? this.categoryId : null;
  return {
    id: this._id.toString(),
    name: this.name,
    quantity: this.quantity,
    price: this.price,
    categoryId: cat ? cat._id.toString() : String(this.categoryId),
    categoryName: cat ? cat.name : undefined,
    category: cat ? { id: cat._id.toString(), name: cat.name } : undefined
  };
};

module.exports = mongoose.model('Product', productSchema);
