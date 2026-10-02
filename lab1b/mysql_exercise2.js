require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'store_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function setupDatabaseAndSeedData(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      item_name VARCHAR(150) NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      quantity INT DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );
  `);

  await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
  await pool.query('TRUNCATE TABLE items;');
  await pool.query('TRUNCATE TABLE categories;');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

  await pool.query(`
    INSERT INTO categories (name, description) VALUES
    ('Food', 'Daily essentials and groceries'),
    ('Electronics', 'Gadgets, phones and computers'),
    ('Clothing', 'Apparel and fashion items'),
    ('Books', 'Educational and entertainment books'),
    ('Home & Living', 'Furniture and home appliances'),
    ('Sports & Outdoors', 'Sporting goods and outdoor equipment');
  `);

  await pool.query(`
    INSERT INTO items (category_id, item_name, price, quantity) VALUES
    (1, 'Apple', 25000.00, 100),
    (1, 'Milk', 32000.00, 50),
    (1, 'Bread', 15000.00, 30),
    (2, 'Smartphone', 5500000.00, 15),
    (2, 'Wireless Mouse', 250000.00, 40),
    (3, 'T-Shirt', 120000.00, 60),
    (3, 'Jeans', 350000.00, 25),
    (4, 'Node.js Programming', 180000.00, 20),
    (5, 'Desk Lamp', 150000.00, 35),
    (5, 'Coffee Mug', 45000.00, 80);
  `);

  console.log('Database structure and sample data initialized successfully!\n');
}

// --- QUESTION 1: Filter & Sort ---
async function question1() {
  console.log('=== QUESTION 1: Products priced >= 500,000 VND and quantity > 0 (Sorted DESC) ===');
  const sql = `
    SELECT * FROM items 
    WHERE price >= ? AND quantity > ? 
    ORDER BY price DESC
  `;
  const [rows] = await pool.execute(sql, [500000, 0]);
  console.log(rows);
}

// --- QUESTION 2: Wildcard / LIKE Search ---
async function question2(keywords) {
  console.log(`=== QUESTION 2: Search products containing keywords (${keywords.join(', ')}) ===`);
  const conditions = keywords.map(() => 'item_name LIKE ?').join(' OR ');
  const sql = `SELECT * FROM items WHERE ${conditions}`;
  const params = keywords.map(kw => `%${kw}%`);
  
  const [rows] = await pool.execute(sql, params);
  console.log(rows);
}

// --- QUESTION 3: Aggregate Functions ---
async function question3() {
  console.log('=== QUESTION 3: Total stock quantity, average price, and total item count ===');
  const sql = `
    SELECT 
      SUM(quantity) AS total_stock_quantity,
      AVG(price) AS average_price,
      COUNT(*) AS total_items
    FROM items
  `;
  const [rows] = await pool.execute(sql);
  console.log(rows);
}

// --- QUESTION 4: GROUP BY & HAVING ---
async function question4() {
  console.log('=== QUESTION 4: Category statistics with total inventory value > 10,000,000 VND ===');
  const sql = `
    SELECT 
      c.id AS category_id,
      c.name AS category_name,
      COUNT(i.id) AS total_items,
      SUM(i.price * i.quantity) AS total_inventory_value
    FROM categories c
    INNER JOIN items i ON c.id = i.category_id
    GROUP BY c.id, c.name
    HAVING total_inventory_value > ?
  `;
  const [rows] = await pool.execute(sql, [10000000]);
  console.log(rows);
}

async function runExercise2() {
  try {
    await setupDatabaseAndSeedData(pool);
    await question1();
    await question2(['Gaming', 'Wireless']);
    await question3();
    await question4();
  } catch (err) {
    console.error('Exercise 2 Error:', err.message);
  } finally {
    await pool.end();
  }
}

runExercise2();
