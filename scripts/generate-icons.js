const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../public/assets/LOGO-05.svg');
const iconDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(iconDir)){
    fs.mkdirSync(iconDir, { recursive: true });
}

async function generateIcons() {
  const sizes = [192, 512];
  
  for (const size of sizes) {
    const outputPath = path.join(iconDir, `icon-${size}x${size}.png`);
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }
}

generateIcons().catch(console.error);
