// ─────────────────────────────────────────────
// Lightweight DOM creation helpers shared by
// multiple modules.
// ─────────────────────────────────────────────

import { canvasRoot } from './state.js';

// Create an element with an optional CSS class and text content.
export function el(tag, cls = '', txt = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}

// Cache an element's pixel dimensions to avoid repeated layout reads.
export function cacheDims(e) {
  e._cw = e.offsetWidth;
  e._ch = e.offsetHeight;
}

// Batch-schedule cacheDims so all nodes placed in a single synchronous
// pass have their dimensions captured in one requestAnimationFrame.
let _dimQueue = [], _dimRaf = false;
export function queueCacheDims(node) {
  _dimQueue.push(node);
  if (!_dimRaf) {
    _dimRaf = true;
    requestAnimationFrame(() => {
      _dimQueue.forEach(cacheDims);
      _dimQueue = []; _dimRaf = false;
    });
  }
}

// Place a node with its top-left corner at canvas coordinates (x, y).
export function place(node, x, y) {
  node.style.left = Math.round(x) + 'px';
  node.style.top  = Math.round(y) + 'px';
  canvasRoot.appendChild(node);
  queueCacheDims(node);
}

// Place a node so its centre is at canvas coordinates (cx, cy).
export function placeCentered(node, cx, cy, w, h) {
  place(node, cx - w / 2, cy - h / 2);
}
