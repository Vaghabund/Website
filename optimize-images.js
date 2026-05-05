#!/usr/bin/env node
// optimize-images.js
//
// For every project:
//   1. Finds source images (png/jpg, not already -small or -thumb)
//   2. Produces name.webp (full, max 1600px) and name-small.webp (max 400px)
//   3. Updates detail.md image list to reference .webp extensions
//   4. Deletes old -small.jpg, -small.webp, -thumb.jpg, -thumb.webp, and original .png/.jpg

import sharp from 'sharp';
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve, join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FULL_MAX  = 1600;
const SMALL_MAX = 400;
const SMALL_Q   = 82;
const FULL_Q    = 85;

async function processImage(srcPath, baseName, outDir) {
  const fullOut  = join(outDir, `${baseName}.webp`);
  const smallOut = join(outDir, `${baseName}-small.webp`);

  const img = sharp(srcPath);
  const meta = await img.metadata();

  // Full webp
  await sharp(srcPath)
    .resize(meta.width > FULL_MAX ? FULL_MAX : undefined)
    .webp({ quality: FULL_Q })
    .toFile(fullOut);
  console.log(`  → ${basename(fullOut)}`);

  // Small webp
  await sharp(srcPath)
    .resize(SMALL_MAX)
    .webp({ quality: SMALL_Q })
    .toFile(smallOut);
  console.log(`  → ${basename(smallOut)}`);
}

function updateDetailMd(detailPath) {
  if (!existsSync(detailPath)) return;
  let txt = readFileSync(detailPath, 'utf8');
  // Replace image extensions in the images: list
  const updated = txt.replace(/(images\/[^\s"]+)\.(png|jpg|jpeg)/g, '$1.webp');
  if (updated !== txt) {
    writeFileSync(detailPath, updated, 'utf8');
    console.log('  updated detail.md image references');
  }
}

function deleteStale(dir, baseName) {
  const stale = [
    `${baseName}-small.jpg`,
    `${baseName}-small.jpeg`,
    `${baseName}-thumb.jpg`,
    `${baseName}-thumb.jpeg`,
    `${baseName}-thumb.webp`,
  ];
  for (const f of stale) {
    const p = join(dir, f);
    if (existsSync(p)) { unlinkSync(p); console.log(`  deleted ${f}`); }
  }
}

async function processDir(imgDir, detailPath) {
  if (!existsSync(imgDir)) return;
  const files = readdirSync(imgDir);

  // Source files: png/jpg that are NOT already -small or -thumb variants
  const sources = files.filter(f => {
    const ext = extname(f).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) return false;
    const base = basename(f, ext);
    return !base.endsWith('-small') && !base.endsWith('-thumb');
  });

  for (const f of sources) {
    const baseName = basename(f, extname(f));
    console.log(`\n${f}`);
    await processImage(join(imgDir, f), baseName, imgDir);
    deleteStale(imgDir, baseName);
    // Delete the original source if a .webp full version now exists
    const webpExists = existsSync(join(imgDir, `${baseName}.webp`));
    if (webpExists && extname(f).toLowerCase() !== '.webp') {
      unlinkSync(join(imgDir, f));
      console.log(`  deleted ${f}`);
    }
  }

  if (detailPath) updateDetailMd(detailPath);
}

// --- projects ---
const projectsDir = resolve(__dirname, 'media/projects');
for (const id of readdirSync(projectsDir)) {
  const imgDir    = join(projectsDir, id, 'images');
  const detailMd  = join(projectsDir, id, 'detail.md');
  if (!existsSync(imgDir)) continue;
  console.log(`\n=== ${id} ===`);
  await processDir(imgDir, detailMd);
}

console.log('\nDone.');
