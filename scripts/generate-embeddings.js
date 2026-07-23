#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// generate-embeddings.js
//
// Emits one embedding per project keyed as "projectId::project".
//
// For each project:
//   - Uses embedding.md as curated primary search text when present
//   - Includes description/text files and structured metadata when available
//   - Produces exactly one combined embedding vector
//
// Usage:  node generate-embeddings.js
// Run whenever you add a project or edit any md file.
// ─────────────────────────────────────────────────────────────────────────────

import { pipeline, env } from '@xenova/transformers';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import PROJECTS from '../projects.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
env.cacheDir          = resolve(ROOT, '.model-cache');
env.allowRemoteModels = true;

const EMBEDDINGS_PATH = resolve(ROOT, 'embeddings.json');

function readFile(path) {
  return existsSync(path) ? readFileSync(path, 'utf8').trim() : null;
}

function stripMd(txt) {
  return txt
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseFrontmatter(txt) {
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const LIST_KEYS = new Set(['images', 'tools', 'links', 'texts']);
  const out = {};
  const lines = m[1].split('\n');
  let listKey = null, listObj = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const objItem = line.match(/^  - (\w+):\s*"?([^"]*)"?$/);
    if (objItem && listKey) {
      listObj = { [objItem[1]]: objItem[2].trim() };
      if (!Array.isArray(out[listKey])) out[listKey] = [];
      out[listKey].push(listObj);
      continue;
    }
    const objCont = line.match(/^    (\w+):\s*"?([^"]*)"?$/);
    if (objCont && listObj) { listObj[objCont[1]] = objCont[2].trim(); continue; }
    const listItem = line.match(/^  - (.+)$/);
    if (listItem && listKey) {
      if (!Array.isArray(out[listKey])) out[listKey] = [];
      out[listKey].push(listItem[1].replace(/^"|"$/g, '').trim());
      listObj = null; continue;
    }
    const listStart = line.match(/^(\w+):\s*(?:\[\s*\])?\s*$/);
    if (listStart && LIST_KEYS.has(listStart[1])) {
      listKey = listStart[1]; out[listKey] = []; listObj = null; continue;
    }
    const kv = line.match(/^(\w+):\s*"?([^"]*)"?$/);
    if (kv) { listKey = null; listObj = null; out[kv[1]] = kv[2].trim() || null; }
  }
  return out;
}

function projectKey(projectId) {
  return `${projectId}::project`;
}

function compact(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

console.log('Loading model…');
const embedder = await pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5', { dtype: 'fp32' });

async function embed(text) {
  const result = await embedder(text, { pooling: 'mean', normalize: true });
  const vec = result.data ?? result.tolist?.() ?? Array.from(result);
  return Array.from(vec);
}

const output = {};

for (const project of PROJECTS) {
  const base = resolve(ROOT, `media/projects/${project.id}`);

  const chunks = [];
  const curated = readFile(resolve(base, 'embedding.md'));
  if (curated) {
    // embedding.md is the sole source of truth — skip description and detail text.
    chunks.push(stripMd(curated));
  } else {
    const detailRaw = readFile(resolve(base, 'detail.md'));
    const detail    = detailRaw ? parseFrontmatter(detailRaw) : {};
    const detailBits = [
      detail.year,
      detail.role,
      detail.timeline,
      Array.isArray(detail.tools) ? detail.tools.join(', ') : '',
      Array.isArray(detail.links) ? detail.links.map(l => `${l.label || ''} ${l.url || ''}`).join(' ') : '',
    ].map(compact).filter(Boolean);
    if (detailBits.length) chunks.push(detailBits.join(' | '));

    const textDefs = Array.isArray(detail.texts) && detail.texts.length
      ? detail.texts
      : [{ file: 'description.md', label: 'overview' }];

    for (const t of textDefs) {
      const file = t.file || 'description.md';
      const raw  = readFile(resolve(base, file));
      if (!raw) continue;
      const text = stripMd(raw);
      if (!text)  continue;
      chunks.push(text);
    }
  }

  const combined = compact([project.title, ...chunks].join('\n\n')) || project.title;
  const key = projectKey(project.id);
  process.stdout.write(`  "${key}" … `);
  output[key] = await embed(combined);
  console.log('done');
}

writeFileSync(EMBEDDINGS_PATH, JSON.stringify(output, null, 2));
console.log(`\nWrote ${Object.keys(output).length} project embeddings → embeddings.json`);
