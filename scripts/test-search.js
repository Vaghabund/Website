#!/usr/bin/env node
// Quick test: run queries against embeddings.json and print ranked scores.
// Usage: node scripts/test-search.js

import { pipeline, env } from '@xenova/transformers';
import { readFileSync }  from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
env.cacheDir          = resolve(ROOT, '.model-cache');
env.allowRemoteModels = true;

const embeddings = JSON.parse(readFileSync(resolve(ROOT, 'embeddings.json'), 'utf8'));

function cosSim(a, b) {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return na && nb ? d / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

// Each query is followed by the project we'd expect to win, so the output is
// easy to eyeball. Meta/visual/topical routing all get exercised here.
const QUERIES = [
  'plug-in',            // → c4d2gs / txt2mesh
  'author',             // → about
  'who made this',      // → about
  'contact',            // → about
  'master thesis',      // → operational-analysis-of-photogrammetry
  'surveillance',       // → operational-analysis-of-photogrammetry
  '3d print',           // → vision-of-the-hybrid (also pixelsorter enclosure)
  'sculpture',          // → vision-of-the-hybrid
  'running dog',        // → greyhound
  'AI video',           // → greyhound
  'glitch art',         // → handheld-pixelsorter
  'handheld device',    // → handheld-pixelsorter
  'gaussian splatting', // → c4d2gs
  'text to 3d',         // → txt2mesh
];

console.log('Loading model…');
const embedder = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', { dtype: 'fp32' });

// bge-base-en-v1.5 expects this instruction on the query side only (passages get none).
const QUERY_PREFIX = 'Represent this sentence for searching relevant passages: ';

for (const query of QUERIES) {
  const out = await embedder(QUERY_PREFIX + query, { pooling: 'mean', normalize: true });
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
