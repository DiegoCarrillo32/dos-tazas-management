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
  
  // Read SVG and swap fill color to cream for the espresso background
  const svgContent = fs.readFileSync(inputPath, 'utf8');
  const creamSvg = svgContent.replace(/fill:\s*#410505/g, 'fill: #fff5e1');
  const creamSvgBuffer = Buffer.from(creamSvg);

  for (const size of sizes) {
    // 1. Standard Icon (80% logo size)
    const standardSize = Math.round(size * 0.8);
    const standardLogoBuffer = await sharp(creamSvgBuffer)
      .resize(standardSize, standardSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    const standardOutputPath = path.join(iconDir, `icon-${size}x${size}.png`);
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: '#410505'
      }
    })
      .composite([{ input: standardLogoBuffer, blend: 'over' }])
      .toFile(standardOutputPath);
    console.log(`Generated standard: ${standardOutputPath}`);

    // 2. Maskable Icon (60% logo size for PWA safe zone)
    const maskableSize = Math.round(size * 0.6);
    const maskableLogoBuffer = await sharp(creamSvgBuffer)
      .resize(maskableSize, maskableSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    const maskableOutputPath = path.join(iconDir, `icon-maskable-${size}x${size}.png`);
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: '#410505'
      }
    })
      .composite([{ input: maskableLogoBuffer, blend: 'over' }])
      .toFile(maskableOutputPath);
    console.log(`Generated maskable: ${maskableOutputPath}`);
  }
}

generateIcons().catch(console.error);
