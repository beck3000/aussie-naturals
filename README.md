# Aussie Naturals - 澳洲纯净食品商城项目文档

本项目是一个专为移动端和小屏设备深度响应式设计、支持中英双语切换的澳洲有机纯净食品电商单页/详情页商城。针对微信内置浏览器（WeChat UI）和社交分享场景进行了专门的微信原生卡片与网页端实体海报双重技术优化。

---

## 一、 技术栈与架构

项目采用前后端分离的轻量级极速架构：

### 1. 前端技术 (Frontend)
*   **核心结构**：原生语义化 HTML5 与现代 CSS3 自适应样式布局。
*   **设计系统**：Vanilla CSS 架构。采用极具澳洲自然风情的桉树绿与奶油白渐变色系（Emerald & Gold Theme），针对详情页与首页海报提供尊贵高对比度衬线排版。
*   **动态交互**：原生 JavaScript (ES6+)。实现移动端汉堡导航菜单抽屉式拉出、无缝购物车本底存储（LocalStorage 联动）以及全站平滑过渡微动效。
*   **多语言系统**：自研 `i18n.js` 本地字典，支持中英双语无刷新一键重绘翻译。

### 2. 后端技术 (Backend)
*   **运行环境**：Node.js & Express 框架。
*   **数据库**：SQLite 3。用于持久化存储中英双语对照的商品品类、图片路径、价格与多语言描述。
*   **拦截路由代理**：在静态文件托管上游配置特定 HTML 请求拦截器，在服务端完成微信抓取 Meta 标签的重构。

---

## 二、 本地与服务器端部署

### 1. 环境准备
项目运行需要本地或服务器已安装：
*   [Node.js](https://nodejs.org/) (推荐 v16.x 或更高版本)
*   [npm](https://www.npmjs.com/) (Node 包管理器)

### 2. 依赖安装
在项目根目录（包含 `package.json` 的路径）下打开终端，执行以下命令安装 Node 项目依赖项（如 `express`, `sqlite3`, `cors` 等）：
```bash
npm install
```

### 3. 本地启动服务
运行以下命令启动本地后端 Express 服务：
```bash
node server.js
```
启动成功后，控制台会输出：
```text
Server is running at http://localhost:3000
Connected to the SQLite database.
Seeding initial bilingual products...
```
此时可在浏览器中访问：
*   首页：`http://localhost:3000/` 或 `http://localhost:3000/index.html`
*   单品详情页：`http://localhost:3000/product.html?id=n1` (可传参 `n1` 至 `s3`)

### 4. 服务器端部署 (PM2 守护)
若要在 Linux/Windows 云服务器上持久运行，推荐使用 `pm2` 进行进程守护：
```bash
# 全局安装 pm2
npm install pm2 -g

# 启动并命名服务
pm2 start server.js --name "aussie-naturals"

# 查看运行状态
pm2 status

# 设置开机自启
pm2 save
pm2 startup
```

---

## 三、 微信分享卡片与海报技术实现

为了突破微信环境下无法直接自定义聊天对话框转发气泡样式的限制，本项目采取了 **“后端动态 Meta 标签注入”** + **“网页前端实体高感官海报卡片”** 的双重社交分享解决方案。

### 1. 微信原生右上角“...”转发小卡片技术实现
当微信用户在微信内置浏览器中点击右上角 `...` 分享/转发给好友或群聊时，微信客户端会抓取当前网页 HTML 的 Open Graph (OG) Meta 标签来渲染气泡卡片。

#### (1) 后端拦截原理
在 [server.js](file:///d:/Lessons/aussie-naturals/server.js) 中，我们不再直接把静态的 `index.html` 或 `product.html` 交给托管，而是在请求到达时进行拦截解析：
```javascript
// 以详情页 product.html 为例
app.get('/product.html', (req, res) => {
  const productId = req.query.id;
  const filePath = path.join(__dirname, 'product.html');

  fs.readFile(filePath, 'utf8', (err, htmlContent) => {
    // 1. 若无商品 ID，直通返回
    if (!productId) return res.send(htmlContent);

    // 2. 异步查询 SQLite 数据库，读取当前单品的中英文名、分类、售价、图片路径
    db.get("SELECT * FROM products WHERE id = ?", [productId], (dbErr, product) => {
      if (dbErr || !product) return res.send(htmlContent);

      const name = product.name_zh || product.name;
      const category = product.category_zh || product.category;
      const priceFormatted = product.price.toFixed(2);
      
      // 3. 构建全路径绝对 URL (微信卡片必须使用带有协议主机的绝对路径图片和网址)
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const absoluteImage = `${protocol}://${host}${product.image}`;
      const absoluteUrl = `${protocol}://${host}/product.html?id=${productId}`;

      // 4. 重塑并注入 Open Graph 协议 Meta 标签，定制微信卡片的图文
      const ogMetaTags = `
  <!-- WeChat Share Card metadata -->
  <meta property="og:title" content="🌿 Aussie Naturals | 【纯净甄选】${name}" />
  <meta property="og:description" content="💰 仅售 $${priceFormatted} | 🍀 品类: ${category} | ✨ 100% 澳洲直采，纯天然有机无添加，点击查看！" />
  <meta property="og:image" content="${absoluteImage}" />
  <meta property="og:url" content="${absoluteUrl}" />
  <meta property="og:type" content="website" />
      `;

      // 5. 替换 </head> 返回给客户端
      let modifiedHtml = htmlContent.replace('</head>', `${ogMetaTags}\n</head>`);
      res.send(modifiedHtml);
    });
  });
});
```

#### (2) 拦截效果
*   **详情页小卡片**：自动生成以 `🌿 Aussie Naturals | 【纯净甄选】` 为前缀的精致大字标题，描述中自带价格 `💰`、品类 `🍀` 和直采亮点，配以高分辨率商品缩略图。
*   **首页小卡片**：同理拦截 `/` 和 `/index.html`，展示店铺全景野餐图、大标题 `🌿 Aussie Naturals | 澳洲大自然纯净食品商城` 以及全场满额包邮的促销文案。

---

### 2. 网页前端实体“分享海报卡片”技术实现
为了让用户可以在朋友圈、社群展示更有仪式感和设计美学的商品卡片，我们在页面内利用 HTML+CSS3 实现了高颜值的实体海报弹窗。

#### (1) 极致感官视觉设计
*   **详情页商品海报**：以奶油白和浅浅的桉树奶绿（Linear Gradient）为底板，将商品主图提升至大比例（300px 高度），搭配悬浮微动效（Hover 时主图平滑缩放 1.05 倍），配以深墨绿色大字标题。
*   **首页店铺海报**：使用尊贵版深色主题（Emerald & Gold Theme），采用极富大自然奢华感的高饱和度墨绿渐变作为底板；文字区域采用 `rgba(255,255,255,0.06)` 半透明磨砂玻璃内盒（`backdrop-filter: blur(10px)`），促销信息和点缀边标全部使用耀眼的黄金色彩，呈现出品牌高奢会员卡的品质。

#### (2) 动态生成 URL 二维码
海报弹窗中的二维码并非静态死图，而是通过原生 JS 获取当前访问地址，实时调用点阵编码 API 进行绘制：
```javascript
// 在 js/product-detail.js 和 js/app.js 中：
const shareQr = document.getElementById('share-card-qr'); // 或 share-shop-qr
if (shareQr) {
  // 提取 window.location.href (带有端口和查询参的当前页面完整路径)，对其进行 URL 编码
  // 调用公开的高清二维码服务，并指定前景色为配合商城主题的深墨绿 (#2e5c50 -> 2e5c50)
  shareQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=2e5c50&data=${encodeURIComponent(window.location.href)}`;
}
```

#### (3) 微信内便捷交互
*   **一键调起与锁定**：点击“分享商品”或“分享店铺”按钮时，遮罩层以 `backdrop-filter: blur(12px)` 将背景深度模糊，同时将 `document.body.style.overflow` 设为 `hidden` 锁定背景滚动。
*   **长按识别与保存**：由于海报底板上的主图和二维码全部是原生的 `<img>` 标签，当用户在微信中长按海报卡片时，能够自然触发微信的“发送给朋友”、“保存图片”或“识别图中二维码”等系统原生高频交互功能，形成完美的闭环营销链条。
