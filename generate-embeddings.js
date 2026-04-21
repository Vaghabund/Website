#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// generate-embeddings.js
//
// Emits per-node embeddings keyed as "projectId::nodeKey".
//
// For each project:
//   - Reads detail.md to find text node definitions (texts: list)
//   - Falls back to description.md if no texts list
//   - Each text node is embedded from its file content
//   - A "projectId::title" key is also emitted using embedding.md as the text
//     (used as fallback for projects with no text nodes)
//
// Usage:  node generate-embeddings.js
// Run whenever you add a project or edit any md file.
// ─────────────────────────────────────────────────────────────────────────────

import { pipeline, env } from '@xenova/transformers';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import PROJECTS from './projects.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
env.cacheDir          = resolve(__dirname, '.model-cache');
env.allowRemoteModels = true;

const EMBEDDINGS_PATH = resolve(__dirname, 'embeddings.json');

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

function nodeKey(projectId, label) {
  return `${projectId}::${label.toLowerCase().replace(/\s+/g, '-')}`;
}

console.log('Loading model…');
const embedder = await pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2', { dtype: 'fp32' });

async function embed(text) {
  const result = await embedder(text, { pooling: 'mean', normalize: true });
  const vec = result.data ?? result.tolist?.() ?? Array.from(result);
  return Array.from(vec);
}

const output = {};

for (const project of PROJECTS) {
  const base = resolve(__dirname, `media/projects/${project.id}`);

  // Always emit a title key using embedding.md (the curated search text)
  const embText = readFile(resolve(base, 'embedding.md')) ?? project.title;
  process.stdout.write(`  "${project.id}::title" … `);
  output[nodeKey(project.id, 'title')] = await embed(embText);
  console.log('done');

  // Emit per-text-node keys
  const detailRaw = readFile(resolve(base, 'detail.md'));
  const detail    = detailRaw ? parseFrontmatter(detailRaw) : {};
  const textDefs  = Array.isArray(detail.texts) && detail.texts.length
    ? detail.texts
    : [{ file: 'description.md', label: project.id === 'about' ? 'bio' : 'overview' }];

  for (const t of textDefs) {
    const file  = t.file  || 'description.md';
    const label = t.label || file.replace('.md', '');
    const raw   = readFile(resolve(base, file));
    if (!raw) continue;
    const text  = stripMd(raw);
    if (!text)  continue;
    const key   = nodeKey(project.id, label);
    process.stdout.write(`  "${key}" … `);
    output[key] = await embed(text);
    console.log('done');
  }
}

writeFileSync(EMBEDDINGS_PATH, JSON.stringify(output, null, 2));
console.log(`\nWrote ${Object.keys(output).length} node embeddings → embeddings.json`);
