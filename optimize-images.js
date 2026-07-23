#!/usr/bin/env node
// optimize-images.js
//
// Drop raw .png/.jpg/.jpeg files straight into media/projects/<id>/images/
// and run this. For each raw source it:
//   1. Cleans up the filename (lowercase, spaces/odd chars -> hyphens; generic
//      camera/screenshot names like "Screenshot 2026-03-24 110813 1" become
//      "<project-id>-01", "<project-id>-02", ... instead of leaking through)
//   2. Produces <slug>.webp (full, max 1600px) and <slug>-small.webp (max 400px,
//      used for canvas node thumbnails)
//   3. Updates detail.md: fixes any images/ references that used the old
//      filename, and appends newly-seen images to the images: list
//   4. Deletes the raw source and any stale -thumb variants from the old pipeline
//
// Usage:
//   node optimize-images.js            process every project
//   node optimize-images.js c4d2gs     process a single project

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
const SOURCE_EXTS = ['.png', '.jpg', '.jpeg'];

// Generic capture/export names that carry no meaning of their own — these get
// renumbered as "<project-id>-01" etc. instead of just having their spaces/case
// cleaned up.
const GENERIC_NAME_RE = /^(screenshot|bildschirmfoto|img|image|photo|dsc|scan|shot|snip|unbenannt|untitled)([\s_-]|\d)/i;

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(name) {
  return name
    .normalize('NFKD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Existing "<project-id>-NN.webp" files, so new generic-named sources continue
// the sequence instead of colliding with it.
function nextSequential(imgDir, projectId) {
  const re = new RegExp(`^${escapeRe(projectId)}-(\\d+)\\.webp$`, 'i');
  let max = 0;
  for (const f of readdirSync(imgDir)) {
    const m = f.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

// Basenames (no extension, no -small suffix) already used by processed webp
// output in this folder, so a freshly slugified name can't collide with one.
function existingSlugs(imgDir) {
  const slugs = new Set();
  for (const f of readdirSync(imgDir)) {
    if (extname(f).toLowerCase() !== '.webp') continue;
    let base = basename(f, '.webp');
    if (base.endsWith('-small')) base = base.slice(0, -'-small'.length);
    slugs.add(base);
  }
  return slugs;
}

function uniqueSlug(candidate, taken) {
  if (!taken.has(candidate)) return candidate;
  let n = 2;
  while (taken.has(`${candidate}-${n}`)) n++;
  return `${candidate}-${n}`;
}

async function processImage(srcPath, slug, outDir) {
  const fullOut  = join(outDir, `${slug}.webp`);
  const smallOut = join(outDir, `${slug}-small.webp`);

  const img  = sharp(srcPath);
  const meta = await img.metadata();

  await sharp(srcPath)
    .resize(meta.width > FULL_MAX ? FULL_MAX : undefined)
    .webp({ quality: FULL_Q })
    .toFile(fullOut);
  console.log(`  -> ${basename(fullOut)}`);

  await sharp(srcPath)
    .resize(SMALL_MAX)
    .webp({ quality: SMALL_Q })
    .toFile(smallOut);
  console.log(`  -> ${basename(smallOut)}`);
}

function deleteStale(dir, slug) {
  const stale = [`${slug}-thumb.jpg`, `${slug}-thumb.jpeg`, `${slug}-thumb.webp`];
  for (const f of stale) {
    const p = join(dir, f);
    if (existsSync(p)) { unlinkSync(p); console.log(`  deleted stale ${f}`); }
  }
}

// Swap any images/<old name>.<ext> reference in detail.md for the new slug,
// covering both the renamed sources and plain extension mismatches left over
// from hand-written frontmatter.
function updateDetailRenames(detailPath, renameMap) {
  if (!existsSync(detailPath)) return;
  let txt = readFileSync(detailPath, 'utf8');
  const before = txt;
  for (const [oldName, newPath] of renameMap) {
    txt = txt.split(`images/${oldName}`).join(newPath);
  }
  txt = txt.replace(/(images\/[^\s"]+)\.(png|jpg|jpeg)/g, '$1.webp');
  if (txt !== before) {
    writeFileSync(detailPath, txt, 'utf8');
    console.log('  detail.md: updated image references');
  }
}

// Append slugs that were just generated but aren't referenced anywhere in
// detail.md's images: list yet. Bails out (with instructions) rather than
// guessing if there's no images: list to append to.
function appendNewImages(detailPath, slugs) {
  if (!existsSync(detailPath) || !slugs.length) return;
  const txt = readFileSync(detailPath, 'utf8');
  const listed = new Set([...txt.matchAll(/images\/([^\s"]+)\.webp/g)].map(m => m[1]));
  const toAdd = slugs.filter(s => !listed.has(s));
  if (!toAdd.length) return;

  const updated = txt.replace(/(\nimages:\n(?:  - .*\n)*)/, match => {
    const lines = toAdd.map(s => `  - images/${s}.webp\n`).join('');
    return `${match}${lines}`;
  });

  if (updated === txt) {
    console.log('  no "images:" list found in detail.md — add these manually:');
    toAdd.forEach(s => console.log(`      - images/${s}.webp`));
    return;
  }
  writeFileSync(detailPath, updated, 'utf8');
  console.log(`  detail.md: registered ${toAdd.length} new image(s) in images:`);
}

async function processDir(imgDir, detailPath, projectId) {
  if (!existsSync(imgDir)) return;

  const sources = readdirSync(imgDir).filter(f => SOURCE_EXTS.includes(extname(f).toLowerCase()));
  if (!sources.length) return;

  console.log(`\n=== ${projectId} ===`);

  const taken = existingSlugs(imgDir);
  let seq = nextSequential(imgDir, projectId);
  const renameMap = new Map(); // original filename (with ext) -> "images/<slug>.webp"
  const newSlugs  = [];

  for (const f of sources) {
    const ext  = extname(f);
    const base = basename(f, ext);

    let slug = GENERIC_NAME_RE.test(base)
      ? `${projectId}-${String(++seq).padStart(2, '0')}`
      : uniqueSlug(slugify(base), taken);
    taken.add(slug);

    console.log(`\n${f} -> ${slug}.webp`);
    await processImage(join(imgDir, f), slug, imgDir);
    deleteStale(imgDir, slug);
    unlinkSync(join(imgDir, f));

    if (f !== `${slug}${ext}`) renameMap.set(f, `images/${slug}.webp`);
    newSlugs.push(slug);
  }

  updateDetailRenames(detailPath, renameMap);
  appendNewImages(detailPath, newSlugs);
}

const projectsDir = resolve(__dirname, 'media/projects');
const filterId = process.argv[2];

for (const id of readdirSync(projectsDir)) {
  if (filterId && id !== filterId) continue;
  const imgDir   = join(projectsDir, id, 'images');
  const detailMd = join(projectsDir, id, 'detail.md');
  await processDir(imgDir, detailMd, id);
}

console.log('\nDone.');
