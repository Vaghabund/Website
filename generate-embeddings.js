#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// generate-embeddings.js
//
// Reads media/projects/<id>/embedding.md for each project and embeds it.
// Falls back to the project title if no embedding.md exists.
//
// Usage:  node generate-embeddings.js
// Run whenever you add a project or edit an embedding.md.
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

function loadEmbedding(projectId) {
  const p = resolve(__dirname, `media/projects/${projectId}/embedding.md`);
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8').trim();
}

console.log('Loading model…');
const embedder = await pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2', { dtype: 'fp32' });

const output = {};

for (const project of PROJECTS) {
  const text   = loadEmbedding(project.id) ?? project.title;
  const source = loadEmbedding(project.id) ? 'embedding.md' : 'title fallback';
  process.stdout.write(`  Embedding "${project.title}" (${source})… `);
  const result = await embedder(text, { pooling: 'mean', normalize: true });
  const vec    = result.data ?? result.tolist?.() ?? Array.from(result);
  output[project.id] = Array.from(vec);
  console.log('done');
}

writeFileSync(EMBEDDINGS_PATH, JSON.stringify(output, null, 2));
console.log(`\nWrote ${Object.keys(output).length} embeddings → embeddings.json`);
