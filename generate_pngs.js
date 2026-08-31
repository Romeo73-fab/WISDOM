const sharp = require('sharp');
const fs = require('fs');

async function buildImages() {
  const iconSvg = fs.readFileSync('public/icon.svg');
  const logoSvg = fs.readFileSync('public/logo-horizontal.svg');

  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');

  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');

  await sharp(iconSvg)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');

  await sharp(iconSvg)
    .resize(64, 64)
    .png()
    .toFile('public/favicon.png');

  await sharp(logoSvg)
    .resize(600, 150)
    .png()
    .toFile('public/logo-wisdom.png');

  fs.copyFileSync('public/logo-wisdom.png', 'src/assets/images/logo-wisdom.png');

  console.log('All PNG icons generated cleanly with sharp!');
}

buildImages().catch(err => {
  console.error(err);
  process.exit(1);
});
