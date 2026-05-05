#!/usr/bin/env node
// Quick test: run queries against embeddings.json and print ranked scores.
// Usage: node test-search.js

import { pipeline, env } from '@xenova/transformers';
import { readFileSync }  from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
env.cacheDir          = resolve(__dirname, '.model-cache');
env.allowRemoteModels = true;

const embeddings = JSON.parse(readFileSync(resolve(__dirname, 'embeddings.json'), 'utf8'));

function cosSim(a, b) {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return na && nb ? d / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

const QUERIES = [
  'master thesis',
  'thesis',
  'TouchDesigner',
  'surveillance',
  'sculpture',
  'installation',
  'structure',
  'who is joel',
  'bio',
  'AI writing',
  'point cloud',
  '3D printing',
];

console.log('Loading model…');
const embedder = await pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5', { dtype: 'fp32' });

for (const query of QUERIES) {
  const out = await embedder(query, { pooling: 'mean', normalize: true });
  const vec = Array.from(out.data ?? out);

  const scores = Object.entries(embeddings).map(([key, emb]) => ({
    key: key.replace('::project', ''),
    score: cosSim(vec, emb),
  })).sort((a, b) => b.score - a.score);

  const winner = scores[0];
  const pad = (s, n) => s.padEnd(n);
  console.log(`\n"${query}"`);
  scores.forEach(({ key, score }) => {
    const bar = '█'.repeat(Math.round(score * 40));
    const flag = key === winner.key ? ' ◀ best' : '';
    console.log(`  ${pad(key, 45)} ${score.toFixed(4)}  ${bar}${flag}`);
  });
}
