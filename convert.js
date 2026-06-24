const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 需要转换的目录列表
const dirs = [
    path.join(__dirname, 'assets'),
    path.join(__dirname, 'images/ai')
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
        if (path.extname(file).toLowerCase() === '.png') {
            const pngPath = path.join(dir, file);
            const webpPath = pngPath.replace(/\.png$/i, '.webp');

            sharp(pngPath)
                .webp({ quality: 80 }) // 80% 质量，兼顾体积和清晰度
                .toFile(webpPath)
                .then(() => {
                    console.log(`Successfully converted: ${file} -> .webp`);
                    // 可选：fs.unlinkSync(pngPath); // 如果确信没问题，可以直接在此自动删除旧的 png
                })
                .catch(err => console.error(`Error converting ${file}:`, err));
        }
    });
});
