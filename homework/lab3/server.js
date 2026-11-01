// Main server entry point
const express = require('express');
const pool = require('./config/db');
const setupSwagger = require('./config/swagger');
const orderRoutes = require('./routes/order.routes');
const customerRoutes = require('./routes/customer.routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API routes
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/customers', customerRoutes);

// Swagger UI at /api-docs
setupSwagger(app);

// Must be registered AFTER the routes
app.use(notFound);
app.use(errorHandler);

// Start only when MySQL is reachable
pool.query('SELECT 1')
  .then(() => {
    app.listen(PORT, () => console.log('Server API is running at: http://localhost:' + PORT));
  })
  .catch((err) => console.error('MySQL connection failed:', err.message));

module.exports = app;
