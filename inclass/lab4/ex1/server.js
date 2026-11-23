const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5001;

// CORS: allow a Web UI on another origin to call this API
app.use(cors({
    origin: '*', // in production, list the exact origins, e.g. 'http://localhost:3000'
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Simulated in-memory database
let products = [
    { id: 1, name: 'Laptop Dell XPS 15', price: 35000000, category: 'Electronics' },
    { id: 2, name: 'Logitech MX Master 3S Mouse', price: 2400000, category: 'Accessories' }
];

// GET - list products, optionally filtered: /api/v1/products?category=Electronics
app.get('/api/v1/products', (req, res) => {
    const { category } = req.query;
    let result = products;
    if (category) {
        result = products.filter(
            p => p.category.toLowerCase() === String(category).toLowerCase()
        );
    }
    res.json({ success: true, count: result.length, data: result });
});

// GET - distinct categories (used to fill the filter dropdown)
app.get('/api/v1/products/categories', (req, res) => {
    const categories = [...new Set(products.map(p => p.category))].sort();
    res.json({ success: true, count: categories.length, data: categories });
});

// POST - create a product
app.post('/api/v1/products', (req, res) => {
    const { name, price, category } = req.body;
    if (!name || !price) {
        return res.status(400).json({ success: false, message: 'Product name and price are required!' });
    }
    const newProduct = { id: Date.now(), name, price: Number(price), category: category || 'General' };
    products.push(newProduct);
    res.status(201).json({ success: true, message: 'Product added successfully', data: newProduct });
});

// PUT - update a product by id (400 invalid data, 404 not found)
app.put('/api/v1/products/:id', (req, res) => {
    const productId = Number(req.params.id);
    const { name, price, category } = req.body;

    const product = products.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({ success: false, message: `Product ID ${productId} not found` });
    }

    const numericPrice = Number(price);
    if (!name || !String(name).trim() || !price || !Number.isFinite(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Product name and a valid price greater than 0 are required!'
        });
    }

    product.name = String(name).trim();
    product.price = numericPrice;
    if (category && String(category).trim()) product.category = String(category).trim();

    res.json({ success: true, message: 'Product updated successfully', data: product });
});

// DELETE - remove a product by id
app.delete('/api/v1/products/:id', (req, res) => {
    const productId = Number(req.params.id);
    const exists = products.some(p => p.id === productId);
    if (!exists) {
        return res.status(404).json({ success: false, message: `Product ID ${productId} not found` });
    }
    products = products.filter(p => p.id !== productId);
    res.json({ success: true, message: `Deleted product ID ${productId}` });
});

app.listen(PORT, () => {
    console.log(`Backend API running at: http://localhost:${PORT}`);
});
