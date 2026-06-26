const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Intercept / and /index.html to inject dynamic Open Graph tags for shop WeChat share card support
const handleIndexShare = (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, htmlContent) => {
    if (err) {
      console.error('Error reading index.html', err);
      return res.status(500).send('Error loading page');
    }

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const absoluteImage = `${protocol}://${host}/images/ai/hero_banner_1774671789363.webp`;
    const absoluteUrl = `${protocol}://${host}/index.html`;

    // Inject standard Open Graph tags (Optimized for WeChat Share Card representation of the shop)
    const ogMetaTags = `
  <!-- WeChat Share Card metadata for shop -->
  <meta property="og:title" content="🌿 Aussie Naturals | 澳洲大自然纯净食品商城" />
  <meta property="og:description" content="🍀 100% 澳洲直采天然有机食材，生态友好采收！全场满 $49 包邮，进入选购！" />
  <meta property="og:image" content="${absoluteImage}" />
  <meta property="og:url" content="${absoluteUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
    `;

    let modifiedHtml = htmlContent;
    modifiedHtml = modifiedHtml.replace('</head>', `${ogMetaTags}\n</head>`);
    res.send(modifiedHtml);
  });
};

app.get('/', handleIndexShare);
app.get('/index.html', handleIndexShare);

// Intercept product.html to inject dynamic Open Graph tags for WeChat share card support
app.get('/product.html', (req, res) => {
  const productId = req.query.id;
  const filePath = path.join(__dirname, 'product.html');

  fs.readFile(filePath, 'utf8', (err, htmlContent) => {
    if (err) {
      console.error('Error reading product.html', err);
      return res.status(500).send('Error loading page');
    }

    if (!productId) {
      return res.send(htmlContent);
    }

    db.get("SELECT * FROM products WHERE id = ?", [productId], (dbErr, product) => {
      if (dbErr || !product) {
        return res.send(htmlContent);
      }

      const name = product.name_zh || product.name;
      const category = product.category_zh || product.category;
      const priceFormatted = product.price.toFixed(2);
      const desc = product.description_zh || product.description;
      const imageRelative = product.image;

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const absoluteImage = `${protocol}://${host}${imageRelative}`;
      const absoluteUrl = `${protocol}://${host}/product.html?id=${productId}`;

      let modifiedHtml = htmlContent;

      // Replace title dynamically
      modifiedHtml = modifiedHtml.replace(
        /<title[^>]*>([\s\S]*?)<\/title>/i,
        `<title>${name} | Aussie Naturals</title>`
      );

      // Inject standard Open Graph tags (Optimized for WeChat Share Card representation)
      const ogMetaTags = `
  <!-- WeChat Share Card metadata -->
  <meta property="og:title" content="🌿 Aussie Naturals | 【纯净甄选】${name}" />
  <meta property="og:description" content="💰 仅售 $${priceFormatted} | 🍀 品类: ${category} | ✨ 100% 澳洲直采，纯天然有机无添加，点击查看！" />
  <meta property="og:image" content="${absoluteImage}" />
  <meta property="og:url" content="${absoluteUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
      `;

      modifiedHtml = modifiedHtml.replace('</head>', `${ogMetaTags}\n</head>`);
      res.send(modifiedHtml);
    });
  });
});

app.use(express.static(path.join(__dirname)));

// Dynamic local fallback URL mixed with spoonacular CDN to completely bypass network blocking walls
const getSpoon = (name) => `https://spoonacular.com/cdn/ingredients_500x500/${name}`;
const getLocalAI = (name) => `/images/ai/${name}`;

const INITIAL_PRODUCTS = [
  // native
  { id: 'n1', name: 'Premium Australian Macadamia Nuts', name_zh: '澳洲特级夏威夷果', price: 24.50, description: 'Golden roasted premium macadamias. Creamy, crunchy and perfectly salted for a luxurious snack.', description_zh: '金黄烘焙的高端夏威夷果，口感奶油般细腻酥脆，辅以恰到好处的海盐。', category: 'native', category_zh: '原生食材', image: getLocalAI('macadamia_nuts_1774671752375.webp') },
  { id: 'n2', name: 'Raw Manuka Honey (MGO 830+)', name_zh: '未过滤生麦卢卡蜂蜜', price: 89.99, description: 'Sourced from the pristine forests of Australia, rich flavor and natural health benefits.', description_zh: '严选自澳洲原始森林，这款麦卢卡蜂蜜以其醇厚的口感和天然的健康功效而闻名。', category: 'native', category_zh: '原生食材', image: getLocalAI('prod_n2_1774844832480.webp') },
  { id: 'n3', name: 'Organic Bush Tomato', name_zh: '纯野生丛林番茄', price: 18.20, description: 'Sun-dried native bush tomatoes with a rich, caramel-like flavor.', description_zh: '日晒原生丛林小番茄，带有一丝醇厚的焦糖风味，极其适合作为香料点缀。', category: 'native', category_zh: '原生食材', image: getLocalAI('prod_n3_1774844854385.webp') },
  { id: 'n4', name: 'Wattleseed Roast', name_zh: '金合欢籽烘焙原粒', price: 22.00, description: 'A coffee-like aromatic seed with hints of chocolate and hazelnut.', description_zh: '拥有类似咖啡的浓郁香气，并隐约带出巧克力与榛子的醇厚。', category: 'native', category_zh: '原生食材', image: getLocalAI('prod_n4_1774844872511.webp') },
  { id: 'n5', name: 'Finger Lime Pearls', name_zh: '野生手指指橙鱼子酱', price: 35.50, description: 'Citrus caviar native to the rainforest, offering a burst of zesty flavor.', description_zh: '被誉为“雨林柑橘鱼子酱”，能在口腔中瞬间爆发出酸爽诱人的天然果香。', category: 'native', category_zh: '原生食材', image: getLocalAI('prod_n5_1774844889390.webp') },
  { id: 'n6', name: 'Lemon Myrtle Leaves', name_zh: '原生柠檬香桃木叶', price: 15.99, description: 'The purest, most concentrated lemon flavor produced by any plant.', description_zh: '这是所有已知植物中纯度最高、最浓缩的天然柠檬清香，可用于泡茶及烹饪。', category: 'native', category_zh: '原生食材', image: getLocalAI('prod_n6_1774844905044.webp') },

  // mushroom
  { id: 'm1', name: 'Tasmanian Black Truffle', name_zh: '塔斯马尼亚黑松露', price: 120.00, description: 'Earthy, aromatic truffles grown in the cool climate of Tasmania.', description_zh: '在塔斯马尼亚极寒气候中孕育的顶级黑松露，泥土气息与菌菇芳香浓郁醇厚。', category: 'mushroom', category_zh: '珍稀菌类', image: getLocalAI('cat_mushroom_1774842936406.webp') },
  { id: 'm2', name: 'Wild Pine Mushrooms', name_zh: '野生高山松茸', price: 45.00, description: 'Foraged from pristine pine forests, perfect for rich, savory dishes.', description_zh: '采摘自原封未动的松林深处，最适合用于炖煮需要浓郁鲜香的高级菜肴。', category: 'mushroom', category_zh: '珍稀菌类', image: getLocalAI('prod_m2_1774844923000.webp') },
  { id: 'm3', name: 'Native Lion’s Mane', name_zh: '原生猴头菇提取精华', price: 55.00, description: 'Cognition-enhancing mushroom powder sourced locally.', description_zh: '由极其罕见的纯天然野生猴头菇制成的高浓度提取粉末，对神经有极佳益处。', category: 'mushroom', category_zh: '珍稀菌类', image: getLocalAI('prod_m3_1774844938973.webp') },
  { id: 'm4', name: 'Golden Enoki Cluster', name_zh: '金针菇皇束', price: 12.50, description: 'Crunchy and sweet, organically grown in controlled environments.', description_zh: '在严密温度控制下养育的金色菌束，带着甜脆的高级口感。', category: 'mushroom', category_zh: '珍稀菌类', image: getLocalAI('prod_m4_1774844954355.webp') },
  { id: 'm5', name: 'Earthy Shiitake Log', name_zh: '段木香菇 (带木盒)', price: 38.00, description: 'Grow your own thick, meaty shiitake mushrooms at home.', description_zh: '完整的自培木段，让您在厨房里亲手摘下散发着浓烈原木鲜香的肥厚香菇。', category: 'mushroom', category_zh: '珍稀菌类', image: getLocalAI('prod_m5_1774844973333.webp') },
  { id: 'm6', name: 'Ghost Fungi Powder', name_zh: '极光幽灵菇鲜味粉', price: 28.99, description: 'A secret chef ingredient that brings unparalleled umami depth.', description_zh: '名厨们压箱底的秘密调料，为任何高汤瞬间注入无与伦比的深邃鲜味。', category: 'mushroom', category_zh: '珍稀菌类', image: getLocalAI('prod_m6_1774844988132.webp') },

  // seafood
  { id: 's1', name: 'Wild Caught Barramundi', name_zh: '野生捕捞澳洲盲槽鱼', price: 34.00, description: 'Sustainably caught in northern waters, prized for its buttery texture.', description_zh: '在北部海域可持续捕捞的顶级盲槽，以其奶油般的丝滑鱼肉而备受推崇。', category: 'seafood', category_zh: '顶级海鲜', image: getLocalAI('cat_seafood_1774842956640.webp') },
  { id: 's2', name: 'Southern Rock Lobster', name_zh: '南澳岩龙虾', price: 150.00, description: 'Premium red lobster known for sweet, firm, and succulent meat.', description_zh: '著名的红色高级龙虾，肉质紧实多汁且带着天然的深海甜味。', category: 'seafood', category_zh: '顶级海鲜', image: getLocalAI('prod_s2_1774845003367.webp') },
  { id: 's3', name: 'Coffin Bay Oysters', name_zh: '柯芬湾鲜活生蚝', price: 25.00, description: 'Freshly shucked, plump oysters with a clean, briny finish.', description_zh: '刚刚从纯净水域打捞开壳的丰满生蚝，带着干净凛冽的海洋咸鲜。', category: 'seafood', category_zh: '顶级海鲜', image: getLocalAI('prod_s3_1774845021396.webp') },
  { id: 's4', name: 'Spencer Gulf King Prawns', name_zh: '斯宾塞湾国王明虾', price: 42.00, description: 'Wild caught prawns with an incredibly sweet profile.', description_zh: '完全野生的国王明虾，个头硕大，令人惊艳的清甜口感是它的标志。', category: 'seafood', category_zh: '顶级海鲜', image: getLocalAI('shrimp.webp') },
  { id: 's5', name: 'Blue Swimmer Crab Meat', name_zh: '纯蓝花蟹肉罐', price: 65.00, description: 'Hand-picked, pasteurized sweet crab meat.', description_zh: '经过繁琐手工拆解并巴氏杀菌密封的纯甘蓝花蟹肉，一丝不苟的高端海味。', category: 'seafood', category_zh: '顶级海鲜', image: getLocalAI('crabmeat.webp') },
  { id: 's6', name: 'Balaric Sea Urchin Roe', name_zh: '顶级海胆黄 (Uni)', price: 110.00, description: 'Creamy, rich sea urchin roe that melts instantly in your mouth.', description_zh: '入口即化的奶油质地，带着深海的丰沛层次，是刺身界的黄金。', category: 'seafood', category_zh: '顶级海鲜', image: getLocalAI('sea_urchin_uni.webp') },

  // meat
  { id: 'mt1', name: 'Wagyu Ribeye (MBS 9+)', name_zh: 'M9+ 和牛肋眼牛排', price: 180.00, description: 'Incredibly marbled beef that promises a melt-in-your-mouth experience.', description_zh: '拥有完美大理石纹理的顶级和牛，为您带来无可阻挡的脂肪融化体验。', category: 'meat', category_zh: '优质肉类', image: getLocalAI('cat_meat_1774842974742.webp') },
  { id: 'mt2', name: 'Free Range Kangaroo Loin', name_zh: '野生散养袋鼠里脊', price: 26.50, description: 'Lean, healthy, and highly sustainable premium game meat.', description_zh: '极低脂、高蛋白且绝对绿色的高级野味，肉质紧实却不失细腻。', category: 'meat', category_zh: '优质肉类', image: getLocalAI('cat_native_1774842919921.webp') },
  { id: 'mt3', name: 'Organic Grass-Fed Lamb Rack', name_zh: '有机草饲羊排', price: 48.00, description: 'Tender and juicy lamb rack raised on natural Australian pastures.', description_zh: '在天然牧场自由散养的草饲小羊羔，烤制后外焦里嫩，汁水四溢。', category: 'meat', category_zh: '优质肉类', image: getLocalAI('organic_oats_1774671769670.webp') },
  { id: 'mt4', name: 'Slow-Smoked Brisket', name_zh: '烟熏慢烤牛腩肉', price: 35.00, description: 'Smoked for 14 hours over ironbark wood for maximum flavor.', description_zh: '在铁皮树木柴上缓慢熏制 14 个小时，每一簇肌肉纤维都浸透了浓郁风味。', category: 'meat', category_zh: '优质肉类', image: getLocalAI('beef-brisket.webp') },
  { id: 'mt5', name: 'Heritage Berkshire Pork Cutlet', name_zh: '巴克夏黑猪排', price: 29.00, description: 'Succulent pork with excellent fat distribution and a clean finish.', description_zh: '传承纯血脉的巴克夏黑猪，脂肪雪花分布极佳，油脂清亮而不腻。', category: 'meat', category_zh: '优质肉类', image: getLocalAI('pork-chops.webp') },
  { id: 'mt6', name: 'Emu Filet Mignon', name_zh: '野生鸸鹋菲力', price: 45.00, description: 'A delicate, beef-like red meat that is remarkably low in cholesterol.', description_zh: '一种极其柔嫩、口感极似高级牛肉但几乎不含胆固醇的新晋红肉翘楚。', category: 'meat', category_zh: '优质肉类', image: getLocalAI('filet-mignon.webp') },

  // oil
  { id: 'o1', name: 'Cold Pressed Macadamia Oil', name_zh: '冷榨优质夏威夷果油', price: 18.50, description: 'A buttery oil ideal for high heat cooking or exotic salad dressings.', description_zh: '带有淡淡奶油坚果香的健康食用油，无论是高温煎烤还是冷拌沙拉都是绝佳选择。', category: 'oil', category_zh: '天然油脂', image: getLocalAI('cat_oil_1774842992900.webp') },
  { id: 'o2', name: 'Extra Virgin Olive Oil', name_zh: '特级初榨橄榄油', price: 32.00, description: 'Award-winning robust EVOO with peppery undertones.', description_zh: '屡获殊荣的极品初榨橄榄油，微微带着具有高级感的辛波辣余味。', category: 'oil', category_zh: '天然油脂', image: getLocalAI('olive-oil.webp') },
  { id: 'o3', name: 'Pure Emu Oil', name_zh: '提纯鸸鹋油', price: 40.00, description: 'Traditional Aboriginal remedy, highly moisturizing and anti-inflammatory.', description_zh: '原住民传统的护肤圣品，具备极强的深度滋润和抗炎功效，天然提取不添加。', category: 'oil', category_zh: '天然油脂', image: getLocalAI('manuka_honey_1774671733446.webp') },
  { id: 'o4', name: 'Avocado Cold Pressed Oil', name_zh: '原汁冷榨牛油果油', price: 21.00, description: 'Bright emerald green oil packed with natural vitamins.', description_zh: '呈现宛若祖母绿般璀璨颜色的油体，将整颗完整牛油果的全部精华压榨保留。', category: 'oil', category_zh: '天然油脂', image: getLocalAI('avocado-oil.webp') },
  { id: 'o5', name: 'Organic Coconut Oil', name_zh: '生榨有机椰子油', price: 16.50, description: 'Unrefined coconut oil perfect for baking, cooking, or skin care.', description_zh: '未经任何化学精炼处理的纯椰子油，保留了原切椰蓉般的浓郁香气。', category: 'oil', category_zh: '天然油脂', image: getLocalAI('coconut-oil.webp') },
  { id: 'o6', name: 'Truffle Infused Olive Oil', name_zh: '黑松露浸泡橄榄油', price: 45.00, description: 'Premium olive oil deeply infused with the aroma of Black Truffles.', description_zh: '长时间泡制顶级黑松露碎屑，只需几滴就能唤醒一整盘意面或烩饭的奢华感。', category: 'oil', category_zh: '天然油脂', image: getLocalAI('sesame-oil.webp') }
];


// Initialize SQLite database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    db.run(`DROP TABLE IF EXISTS products`, () => {
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
          console.log('Seeding initial bilingual products...');
          const stmt = db.prepare("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
          INITIAL_PRODUCTS.forEach(p => stmt.run(p.id, p.name, p.name_zh, p.price, p.image, p.description, p.description_zh, p.category, p.category_zh));
          stmt.finalize();
        }
      });
    });

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
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/products/:id', (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(row);
  });
});

app.post('/api/orders', (req, res) => {
  const { name, email, address, city, zip, cart, total } = req.body;
  if (!name || !email || !cart || cart.length === 0) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  const itemsJson = JSON.stringify(cart);
  db.run(
    `INSERT INTO orders (customer_name, customer_email, shipping_address, city, zip, total_price, items) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, address, city, zip, total, itemsJson],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ message: 'Order created successfully', orderId: this.lastID });
    }
  );
});

app.get('/api/orders', (req, res) => {
  const email = req.query.email;
  let query = "SELECT * FROM orders ORDER BY created_at DESC";
  let params = [];

  if (email) {
    query = "SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC";
    params = [email];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const parsedRows = rows.map(r => ({
      ...r,
      items: r.items ? JSON.parse(r.items) : []
    }));
    res.json(parsedRows);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
