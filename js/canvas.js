// ─────────────────────────────────────────────
// Canvas pan / zoom / drag event handling.
// ─────────────────────────────────────────────

import { state, MIN_ZOOM, MAX_ZOOM, canvasRoot } from './state.js';
import { redrawLines }                            from './search.js';

// Apply the current pan/zoom transform and synchronise search-line overlay.
export function applyTransform() {
  canvasRoot.style.transform = `translate(${state.pan.x}px,${state.pan.y}px) scale(${state.zoom})`;
  redrawLines();
}
applyTransform();

// ── Canvas-level pan ──────────────────────────────────────────────────────
let dragging = false, dragStart = { x: 0, y: 0 }, panStart = { x: 0, y: 0 };
let rafPending = false;

document.addEventListener('mousedown', e => {
  if (e.target.closest('#input-wrap,#lightbox,#project-lightbox,#model-lightbox,#impressum-lightbox,.node-image,.node-bar,.node-resize')) return;
  dragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  panStart  = { x: state.pan.x, y: state.pan.y };
  canvasRoot.classList.add('dragging');
});

document.addEventListener('mousemove', e => {
  if (!dragging) return;
  state.pan.x = panStart.x + (e.clientX - dragStart.x);
  state.pan.y = panStart.y + (e.clientY - dragStart.y);
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => { applyTransform(); rafPending = false; });
  }
});

document.addEventListener('mouseup', () => {
  dragging = false;
  canvasRoot.classList.remove('dragging');
});

// ── Zoom ──────────────────────────────────────────────────────────────────
function doZoom(delta, cx, cy) {
  const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.zoom * Math.exp(-delta * 0.001)));
  const r  = nz / state.zoom;
  state.pan.x = cx + (state.pan.x - cx) * r;
  state.pan.y = cy + (state.pan.y - cy) * r;
  state.zoom  = nz;
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => { applyTransform(); rafPending = false; });
  }
}

document.addEventListener('wheel', e => {
  if (document.body.classList.contains('list-view')) return;
  if (e.target.closest('#plb-inner,#project-lightbox,#model-lightbox,#impressum-lightbox')) return;
  e.preventDefault();
  doZoom(e.deltaY, e.clientX, e.clientY);
}, { passive: false });

// ── Pinch-to-zoom (touch) ─────────────────────────────────────────────────
function pinchDist(e) {
  return Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY,
  );
}
let lastPinch = null;

document.addEventListener('touchstart', e => {
  if (e.target.closest('#project-lightbox,#model-lightbox,#impressum-lightbox')) return;
  if (e.touches.length === 2) lastPinch = pinchDist(e);
}, { passive: true });
document.addEventListener('touchmove',  e => {
  if (document.body.classList.contains('list-view')) return;
  if (e.target.closest('#project-lightbox,#model-lightbox,#impressum-lightbox')) return;
  if (e.touches.length !== 2) return;
  const d  = pinchDist(e);
  const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
  const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
  if (lastPinch) doZoom((lastPinch - d) * 5, cx, cy);
  lastPinch = d;
}, { passive: true });
document.addEventListener('touchend',    () => { lastPinch = null; });
document.addEventListener('touchcancel', () => { lastPinch = null; });
