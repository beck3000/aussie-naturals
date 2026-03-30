const https = require('https');
const fs = require('fs');

const products = [
  { id: 'n1', query: '特级夏威夷果 高清' },
  { id: 'n2', query: '麦卢卡蜂蜜 罐装 高清' },
  { id: 'n3', query: '纯野生小番茄 红色 高清 美食' },
  { id: 'n4', query: '咖啡豆 烘焙 高清' },
  { id: 'n5', query: '手指柠檬 指橙 极品 高清' },
  { id: 'n6', query: '香桃木叶 泡茶 高清' },   
  { id: 'm1', query: '黑松露 顶级 食材 高清' },
  { id: 'm2', query: '野生松茸 高山 新鲜 高清' },
  { id: 'm3', query: '野生猴头菇 新鲜 高清' },
  { id: 'm4', query: '金针菇 金色 菇束 高清' },
  { id: 'm5', query: '香菇 段木 盒装 高清' },
  { id: 'm6', query: '极品调料粉 末 高清' },
  { id: 's1', query: '盲槽鱼 生鲜 鱼肉 高清' },
  { id: 's2', query: '澳洲红龙虾 活体 高清' },
  { id: 's3', query: '鲜活生蚝 冰镇 顶级 高清' },
  { id: 's4', query: '国王明虾 极大 新鲜 高清' },
  { id: 's5', query: '蓝花蟹肉 罐装 高清' },
  { id: 's6', query: '海胆黄 Uni 日本 刺身 高清' },
  { id: 'mt1', query: 'M9 和牛 肋眼 生肉 高清' },
  { id: 'mt2', query: '里脊肉 生肉 高清 新鲜' },
  { id: 'mt3', query: '有机小羊排 草饲 高清' },
  { id: 'mt4', query: '烟熏慢火烤牛腩 极品 高清' },
  { id: 'mt5', query: '巴克夏黑猪 高端 猪排切片 高清' },
  { id: 'mt6', query: '菲力牛排 超厚 生肉 高清' },
  { id: 'o1', query: '植物食用油 瓶装 高清' },
  { id: 'o2', query: '特级初榨橄榄油 细长玻璃瓶 高清' },
  { id: 'o3', query: '美容保湿精油 小罐装 高清' },
  { id: 'o4', query: '牛油果油 绿色玻璃瓶 高清' },
  { id: 'o5', query: '有机生榨椰子油 广口瓶 高清' },
  { id: 'o6', query: '黑松露橄榄油 顶级 玻璃瓶 高清' }
];

async function fetchImage(query) {
  return new Promise((resolve) => {
    https.get({
      hostname: 'image.baidu.com',
      path: '/search/index?tn=baiduimage&word=' + encodeURIComponent(query),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/"thumbURL":"(https:\/\/[^"]+)"/);
        if (match) {
           resolve(match[1]);
        } else {
           resolve('assets/macadamia_nuts.png'); // Fallback immediately
        }
      });
    }).on('error', () => resolve('assets/organic_oats.png'));
  });
}

async function run() {
  const results = {};
  for (const p of products) {
    const url = await fetchImage(p.query);
    results[p.id] = url;
  }
  fs.writeFileSync('images_map.json', JSON.stringify(results, null, 2));
  console.log('SUCCESS');
}
run();
