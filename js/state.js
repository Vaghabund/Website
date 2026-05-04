// ─────────────────────────────────────────────
// Shared mutable state and stable DOM refs.
//
// All modules that need cross-module mutable state
// import the `state` object from here and read/write
// its properties directly.  Because every importer
// receives the same object reference, changes are
// immediately visible to all other modules.
//
// DOM element references are also captured here once
// (safe because <script type="module"> is deferred,
// so the DOM is fully parsed before any module runs).
// ─────────────────────────────────────────────

import { CANVAS_CX, CANVAS_CY } from './layout.js';

// Canvas zoom/pan constants
export const MIN_ZOOM     = 0.2;
export const MAX_ZOOM     = 3.0;
export const INITIAL_ZOOM = 0.6;

// IS_MOBILE is computed once at load so CSS and JS stay in sync
// even if the viewport is later resized.
export const IS_MOBILE =
  window.matchMedia('(max-width: 600px)').matches ||
  window.matchMedia('(max-height: 600px) and (orientation: landscape) and (pointer: coarse)').matches;

// Mutable runtime state — stored as a single object so every importer
// always reads the live value (primitive reassignment would break exports).
export const state = {
  zoom: INITIAL_ZOOM,
  pan: {
    x: window.innerWidth  / 2 - CANVAS_CX * INITIAL_ZOOM,
    y: window.innerHeight / 2 - CANVAS_CY * INITIAL_ZOOM,
  },
  searchActive:     false,
  keywordList:      [],
  activeSuggestion: '',
  lineScores:       {}, // nodeKey → normalised relevance score (0–1)
};

// ── Stable DOM element refs ───────────────────────────────────────────────
export const canvasRoot   = document.getElementById('canvas-root');
export const lineSvg      = document.getElementById('line-overlay');
export const inputWrap    = document.getElementById('input-wrap');
export const inputEl      = document.getElementById('query-input');
export const suggestionEl = document.getElementById('query-suggestion');
export const sendBtn      = document.getElementById('send-btn');
export const loadDot      = document.getElementById('loading-dot');

// ── Node tracking maps ────────────────────────────────────────────────────
// Mutated by nodes.js; read by search.js.
export const nodePositions   = {}; // nodeKey → { el, [imgIndex], [showImage] }
export const projectDataById = {}; // id → { project, detail, texts, images, hasDetail, modelSrc }
export const projectNodeById = {}; // id → DOM element
