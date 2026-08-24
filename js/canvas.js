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

// Trackpad drivers often report two-finger movement as single-axis wheel
// deltas that flip between vertical-only and horizontal-only several times a
// second (even during a smooth circular motion). Applying each event's delta
// directly makes panning feel like it snaps between up/down and left/right.
// Instead we blend incoming deltas into a decaying velocity, which smooths
// that axis-flicker into continuous diagonal motion.
let panVX = 0, panVY = 0, panLoopActive = false;

// Windows' touchpad driver locks two-finger scrolling to whichever axis is
// dominant at the start of a gesture, and only lets the other axis through
// once you push hard enough to "break" the lock (an OS-level behaviour we
// can't disable). These EMAs track how dominant each axis has recently been
// so we can amplify whatever small amount of cross-axis movement does leak
// through, making direction changes register sooner instead of needing an
// exaggerated swing.
let axisMagX = 0, axisMagY = 0, lastWheelTime = 0;

function panLoop() {
  state.pan.x += panVX;
  state.pan.y += panVY;
  applyTransform();
  panVX *= 0.72;
  panVY *= 0.72;
  if (Math.abs(panVX) > 0.05 || Math.abs(panVY) > 0.05) {
    requestAnimationFrame(panLoop);
  } else {
    panVX = panVY = 0;
    panLoopActive = false;
  }
}

document.addEventListener('wheel', e => {
  // Canvas panning only applies in the plain node-canvas ("visual archive")
  // state — during landing-view it would otherwise swallow every wheel/touch
  // gesture (via preventDefault below) that's meant to natively scroll the
  // landing → list hub instead (see #hub-scroll in js/landing.js).
  if (document.body.classList.contains('list-view') || document.body.classList.contains('landing-view')) return;
  if (e.target.closest('#plb-inner,#project-lightbox,#model-lightbox,#impressum-lightbox')) return;
  e.preventDefault();
  // Trackpad pinch-to-zoom is reported by the browser as a wheel event with
  // ctrlKey set; plain two-finger scrolling is not. Only pinch should zoom —
  // two-finger panning should just pan the canvas.
  if (e.ctrlKey) {
    doZoom(e.deltaY, e.clientX, e.clientY);
    return;
  }

  const now = performance.now();
  if (now - lastWheelTime > 150) axisMagX = axisMagY = 0; // fingers lifted — new gesture
  lastWheelTime = now;

  const adx = Math.abs(e.deltaX), ady = Math.abs(e.deltaY);
  const total = axisMagX + axisMagY || 1;
  const boostX = 1 + Math.min(1.5, (axisMagY / total) * 2.5);
  const boostY = 1 + Math.min(1.5, (axisMagX / total) * 2.5);
  axisMagX = axisMagX * 0.85 + adx * 0.15;
  axisMagY = axisMagY * 0.85 + ady * 0.15;

  panVX = panVX * 0.45 - e.deltaX * 0.55 * boostX;
  panVY = panVY * 0.45 - e.deltaY * 0.55 * boostY;
  if (!panLoopActive) {
    panLoopActive = true;
    requestAnimationFrame(panLoop);
  }
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
  // Canvas panning only applies in the plain node-canvas ("visual archive")
  // state — during landing-view it would otherwise swallow every wheel/touch
  // gesture (via preventDefault below) that's meant to natively scroll the
  // landing → list hub instead (see #hub-scroll in js/landing.js).
  if (document.body.classList.contains('list-view') || document.body.classList.contains('landing-view')) return;
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
