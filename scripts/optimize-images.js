// scripts/optimize-images.js
// Simple image optimizer for the `media/about/` folder using sharp.
// Usage:
// 1) npm install sharp
// 2) node scripts/optimize-images.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = path.join(__dirname, '..', 'media', 'about');
const files = ['profile.jpg', 'profile2.jpg'];

const ensureExists = (p) => fs.existsSync(p);

async function processImage(filename) {
  const srcPath = path.join(srcDir, filename);
  if (!ensureExists(srcPath)) {
    console.log(`Skipping ${filename} — not found in ${srcDir}`);
    return;
  }

  const baseName = path.parse(filename).name; // e.g., 'profile'

  try {
    // Full-quality WebP
    await sharp(srcPath)
      .webp({ quality: 80 })
      .toFile(path.join(srcDir, `${baseName}.webp`));

    // Small JPEG (max width 400)
    await sharp(srcPath)
      .resize({ width: 400 })
      .jpeg({ quality: 80 })
      .toFile(path.join(srcDir, `${baseName}-small.jpg`));

    // Small WebP (max width 400)
    await sharp(srcPath)
      .resize({ width: 400 })
      .webp({ quality: 80 })
      .toFile(path.join(srcDir, `${baseName}-small.webp`));

    console.log(`Processed ${filename} → ${baseName}.webp, ${baseName}-small.jpg, ${baseName}-small.webp`);
  } catch (err) {
    console.error(`Error processing ${filename}:`, err);
  }
}

(async function main() {
  console.log('Optimizing media/about images...');
  for (const f of files) {
    await processImage(f);
  }
  console.log('Done.');
})();
