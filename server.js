const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Initialize SQLite database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Force recreate table for sample demo to inject bilingual schema
    db.run(`DROP TABLE IF EXISTS products`, () => {
      // Create Products table
      db.run(`CREATE TABLE products (
        id TEXT PRIMARY KEY,
        name TEXT,
        name_zh TEXT,
        price REAL,
        image TEXT,
        description TEXT,
        description_zh TEXT,
        category TEXT,
        category_zh TEXT
      )`, (err) => {
        if (!err) {
          // Seed initial products if empty
          console.log('Seeding initial bilingual products...');
          const stmt = db.prepare("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
          const products = [
            { id: 'p1', name: 'Premium Australian Manuka Honey (MGO 830+)', name_zh: '特级澳洲纯净麦卢卡蜂蜜 (MGO 830+)', price: 89.99, image: 'assets/manuka_honey.png', description: 'Sourced from the pristine forests of Australia, this Manuka honey is famous for its rich flavor and natural health benefits.', description_zh: '严选自澳洲原始森林，这款麦卢卡蜂蜜以其醇厚的口感和天然的健康功效而闻名。', category: 'honey', category_zh: '纯正蜂蜜' },
            { id: 'p2', name: 'Roasted Australian Macadamia Nuts', name_zh: '原味烘焙澳洲夏威夷果', price: 24.50, image: 'assets/macadamia_nuts.png', description: 'Golden roasted premium macadamias. Creamy, crunchy and perfectly salted for a luxurious snack.', description_zh: '金黄烘焙的高端夏威夷果，口感奶油般细腻酥脆，辅以恰到好处的海盐，尽享奢华零食体验。', category: 'nuts', category_zh: '优选坚果' },
            { id: 'p3', name: 'Organic Australian Rolled Oats', name_zh: '澳洲有机燕麦片', price: 12.99, image: 'assets/organic_oats.png', description: '100% organic, whole grain rolled oats grown in the rich soils of Southern Australia. Perfect for a healthy breakfast.', description_zh: '100%有机全谷物燕麦片，产自南澳丰饶的土壤。带来完美健康的早餐选择。', category: 'pantry', category_zh: '健康粗粮' }
          ];
          products.forEach(p => stmt.run(p.id, p.name, p.name_zh, p.price, p.image, p.description, p.description_zh, p.category, p.category_zh));
          stmt.finalize();
        }
      });
    });

    // Create Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      customer_email TEXT,
      shipping_address TEXT,
      city TEXT,
      zip TEXT,
      total_price REAL,
      items JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// API Routes

// 1. Get all products
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 2. Submit an order
app.post('/api/orders', (req, res) => {
  const { name, email, address, city, zip, cart, total } = req.body;
  if (!name || !email || !cart || cart.length === 0) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  const itemsJson = JSON.stringify(cart);
  db.run(
    `INSERT INTO orders (customer_name, customer_email, shipping_address, city, zip, total_price, items) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, address, city, zip, total, itemsJson],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ message: 'Order created successfully', orderId: this.lastID });
    }
  );
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
