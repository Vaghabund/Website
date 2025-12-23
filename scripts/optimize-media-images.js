// scripts/optimize-media-images.js
// Recursively optimize images under media/
// Supports nested structure: projects/[name]/images/, videos/, models/, documents/
// Produces for each source image (.jpg/.jpeg/.png):
// - <base>.webp
// - <base>-small.jpg  (800px wide)
// - <base>-small.webp
// - <base>-thumb.jpg  (400px wide)
// - <base>-thumb.webp

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Find the nearest `media` directory by walking up from __dirname
function findMediaDir() {
  let cur = __dirname;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(cur, '..', 'media');
    if (fs.existsSync(candidate)) return path.resolve(candidate);
    cur = path.join(cur, '..');
  }
  return null;
}

const mediaDir = findMediaDir();
const supported = ['.jpg', '.jpeg', '.png'];
const skipDirs = ['node_modules', '.git', 'documents', '_template']; // Skip these directories

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(name => {
    // Skip certain directories
    if (skipDirs.includes(name)) return;

    const filePath = path.join(dir, name);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

function isGenerated(filePath) {
  const name = path.basename(filePath).toLowerCase();
  return name.endsWith('.webp') || /-small(\.|$)/.test(name) || /-thumb(\.|$)/.test(name) || name.includes('-optimized');
}

async function processImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!supported.includes(ext)) return;
  if (isGenerated(filePath)) return;

  const dir = path.dirname(filePath);
  const base = path.basename(filePath, ext);
  const relativePath = path.relative(mediaDir, filePath);

  try {
    // Check if outputs already exist to avoid re-processing
    const webpPath = path.join(dir, `${base}.webp`);
    const smallJpgPath = path.join(dir, `${base}-small.jpg`);

    if (fs.existsSync(webpPath) && fs.existsSync(smallJpgPath)) {
      console.log(`⏭️  Skipped (already optimized): ${relativePath}`);
      return;
    }

    // full webp
    await sharp(filePath).webp({ quality: 80 }).toFile(webpPath);

    // small (800px)
    await sharp(filePath).resize({ width: 800 }).jpeg({ quality: 80 }).toFile(smallJpgPath);
    await sharp(filePath).resize({ width: 800 }).webp({ quality: 80 }).toFile(path.join(dir, `${base}-small.webp`));

    // thumb (400px)
    await sharp(filePath).resize({ width: 400 }).jpeg({ quality: 72 }).toFile(path.join(dir, `${base}-thumb.jpg`));
    await sharp(filePath).resize({ width: 400 }).webp({ quality: 72 }).toFile(path.join(dir, `${base}-thumb.webp`));

    console.log(`✅ Optimized: ${relativePath}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed: ${relativePath}`, err.message || err);
  }
}

(async function main(){
  console.log('🖼️  Image Optimization Script');
  console.log('📁 Scanning:', mediaDir);
  console.log('');

  if (!mediaDir || !fs.existsSync(mediaDir)) {
    console.error('❌ media directory not found. looked up from', __dirname);
    process.exit(1);
  }

  const files = walk(mediaDir);
  const imageFiles = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return supported.includes(ext) && !isGenerated(f);
  });

  console.log(`Found ${imageFiles.length} original images to optimize`);
  console.log('');

  let processed = 0;
  for (const f of files) {
    const wasProcessed = await processImage(f);
    if (wasProcessed !== undefined) processed++;
  }

  console.log('');
  console.log(`✅ Done! Processed ${processed} images`);
  console.log('');
  console.log('Generated variants:');
  console.log('  • .webp (full quality)');
  console.log('  • -small.{jpg,webp} (800px wide)');
  console.log('  • -thumb.{jpg,webp} (400px wide)');
})();
