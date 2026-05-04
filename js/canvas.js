// ─────────────────────────────────────────────
// Canvas pan / zoom / drag event handling.
// ─────────────────────────────────────────────

import { state, MIN_ZOOM, MAX_ZOOM, canvasRoot, clusterNodes, clusterRects, clusterTitlePos } from './state.js';
import { SZ }                                                  from './layout.js';
import { redrawClusterCurves }                                 from './clusters.js';
import { redrawLines }                                         from './search.js';

// Apply the current pan/zoom transform and synchronise all overlays.
export function applyTransform() {
  canvasRoot.style.transform = `translate(${state.pan.x}px,${state.pan.y}px) scale(${state.zoom})`;
  redrawClusterCurves();
  redrawLines();
}
applyTransform();

// ── Cluster drag ──────────────────────────────────────────────────────────
export function moveCluster(id, newCx, newCy) {
  const c = clusterNodes[id];
  if (!c) return;
  c.cx = newCx; c.cy = newCy;
  // Move title node.
  c.titleEl.style.left = Math.round(newCx - SZ.title.w / 2) + 'px';
  c.titleEl.style.top  = Math.round(newCy - SZ.title.h / 2) + 'px';
  // Move satellites and rebuild rects.
  const rects = [{ x: newCx - SZ.title.w/2, y: newCy - SZ.title.h/2, w: SZ.title.w, h: SZ.title.h }];
  for (const s of c.satellites) {
    const sx = newCx + s.ox, sy = newCy + s.oy;
    s.el.style.left = Math.round(sx - s.w / 2) + 'px';
    s.el.style.top  = Math.round(sy - s.h / 2) + 'px';
    rects.push({ x: sx - s.w/2, y: sy - s.h/2, w: s.w, h: s.h });
  }
  clusterRects[id]    = rects;
  clusterTitlePos[id] = { x: newCx, y: newCy };
  redrawClusterCurves();
  redrawLines();
}

// ── Canvas-level pan + per-title-node drag ────────────────────────────────
let clusterDragging = null; // { id, startCx, startCy, mouseStartX, mouseStartY }
let dragging = false, dragStart = { x: 0, y: 0 }, panStart = { x: 0, y: 0 };
let rafPending = false;

document.addEventListener('mousedown', e => {
  if (e.target.closest('#input-wrap,#lightbox,#text-lightbox,.node-image,.detail-link,.node-text,.node-model,.node-bar,.node-resize')) return;

  const titleEl = e.target.closest('.node-title');
  if (titleEl && titleEl._clusterId) {
    e.stopPropagation();
    const c = clusterNodes[titleEl._clusterId];
    // Refresh ox/oy from live DOM so individually-dragged satellites keep their offset.
    for (const s of c.satellites) {
      s.ox = parseInt(s.el.style.left) + s.w / 2 - c.cx;
      s.oy = parseInt(s.el.style.top)  + s.h / 2 - c.cy;
    }
    clusterDragging = {
      id: titleEl._clusterId,
      startCx: c.cx, startCy: c.cy,
      mouseStartX: e.clientX, mouseStartY: e.clientY,
    };
    canvasRoot.classList.add('dragging');
    return;
  }

  dragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  panStart  = { x: state.pan.x, y: state.pan.y };
  canvasRoot.classList.add('dragging');
});

document.addEventListener('mousemove', e => {
  if (clusterDragging) {
    const dx    = (e.clientX - clusterDragging.mouseStartX) / state.zoom;
    const dy    = (e.clientY - clusterDragging.mouseStartY) / state.zoom;
    const newCx = clusterDragging.startCx + dx;
    const newCy = clusterDragging.startCy + dy;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(() => { moveCluster(clusterDragging.id, newCx, newCy); rafPending = false; });
    }
    return;
  }
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
  clusterDragging = null;
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
  if (e.target.closest('#tlb-inner')) return;
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

document.addEventListener('touchstart', e => { if (e.touches.length === 2) lastPinch = pinchDist(e); }, { passive: true });
document.addEventListener('touchmove',  e => {
  if (document.body.classList.contains('list-view')) return;
  if (e.touches.length !== 2) return;
  const d  = pinchDist(e);
  const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
  const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
  if (lastPinch) doZoom((lastPinch - d) * 5, cx, cy);
  lastPinch = d;
}, { passive: true });
document.addEventListener('touchend',    () => { lastPinch = null; });
document.addEventListener('touchcancel', () => { lastPinch = null; });
