// ─────────────────────────────────────────────
// Search: search-line visualisation, keyword
// suggestions, and input event wiring.
// ─────────────────────────────────────────────

import {
  state, lineSvg, inputWrap, inputEl, suggestionEl, sendBtn, loadDot,
  nodePositions,
} from './state.js';
import { fetchKeywords } from './utils.js';
import { cacheDims }     from './dom.js';

// ── Send-button / clear state ─────────────────────────────────────────────
export function syncSendButtonState() {
  sendBtn.textContent = state.searchActive ? 'x' : '→';
}

// ── Keyword autocomplete ──────────────────────────────────────────────────
function getBestSuggestion(value) {
  const q = value.trim().toLowerCase();
  if (!q) return '';
  const startsWith = state.keywordList.find(k => k.toLowerCase().startsWith(q));
  if (startsWith) return startsWith;
  return state.keywordList.find(k => k.toLowerCase().includes(q)) || '';
}

export function refreshSuggestion() {
  state.activeSuggestion = getBestSuggestion(inputEl.value);
  if (!state.activeSuggestion ||
      state.activeSuggestion.toLowerCase() === inputEl.value.trim().toLowerCase()) {
    suggestionEl.textContent = '';
    return;
  }
  suggestionEl.textContent = state.activeSuggestion;
}

function hasAcceptableSuggestion() {
  return !!state.activeSuggestion &&
    state.activeSuggestion.toLowerCase() !== inputEl.value.trim().toLowerCase();
}

function acceptSuggestion() {
  if (!hasAcceptableSuggestion()) return false;
  inputEl.value = state.activeSuggestion;
  refreshSuggestion();
  return true;
}

// ── Search lines (viewport-space SVG) ────────────────────────────────────
// Convert canvas px → screen px using current pan/zoom.
function c2s(cx, cy) {
  return { x: state.pan.x + cx * state.zoom, y: state.pan.y + cy * state.zoom };
}

// Returns the point on the edge of an axis-aligned rect closest to a target.
function rectEdgePoint(rx, ry, rw, rh, tx, ty) {
  const cx = rx + rw / 2, cy = ry + rh / 2;
  const dx = tx - cx, dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const scaleX = Math.abs(dx) > 0 ? (rw / 2) / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0 ? (rh / 2) / Math.abs(dy) : Infinity;
  const s = Math.min(scaleX, scaleY);
  return { x: cx + dx * s, y: cy + dy * s };
}

export function redrawLines() {
  lineSvg.innerHTML = '';
  const keys = Object.keys(state.lineScores);
  syncSendButtonState();
  if (!keys.length) return;

  const inputRect      = inputWrap.getBoundingClientRect();
  const LINE_SOURCE_GAP = 12;
  const srcX = inputRect.left + inputRect.width / 2;
  const srcY = inputRect.top  - LINE_SOURCE_GAP;

  keys.forEach((nodeKey, i) => {
    const { norm: score, raw: rawScore } = state.lineScores[nodeKey];
    const np    = nodePositions[nodeKey]; if (!np?.el) return;
    const e     = np.el;

    const cx = parseInt(e.style.left) || 0;
    const cy = parseInt(e.style.top)  || 0;
    const cw = e._cw || e.offsetWidth  || 60;
    const ch = e._ch || e.offsetHeight || 30;

    const tl  = c2s(cx, cy);
    const sw  = cw * state.zoom, sh = ch * state.zoom;
    const dst = rectEdgePoint(tl.x, tl.y, sw, sh, srcX, srcY);

    const dx   = dst.x - srcX;
    const dy   = dst.y - srcY;
    const dist = Math.hypot(dx, dy);

    // cp1 leaves the source straight upward (lines emanate from top of input bar).
    const cp1x = srcX;
    const cp1y = srcY - Math.max(dist * 0.4, 80);

    // cp2 arrives at the destination along the approach direction (src→dst),
    // so the curve is tangent to the node edge rather than hitting it sideways.
    const pull = Math.max(dist * 0.4, 80);
    const nx   = dx / dist, ny = dy / dist;  // unit vector src→dst
    const cp2x = dst.x - nx * pull;
    const cp2y = dst.y - ny * pull;

    // Power curve: exaggerates the gap between top match and weaker ones.
    const s = Math.pow(score, 1.8);

    const label  = rawScore.toFixed(3);
    const GAP    = label.length * 6 + 6;  // px gap to cut out of the stroke
    const d      = `M ${srcX},${srcY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${dst.x},${dst.y}`;

    // Measure the full path length via a temporary detached element.
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    probe.setAttribute('d', d);
    lineSvg.appendChild(probe);
    const totalLen = probe.getTotalLength();
    const mid      = probe.getPointAtLength(totalLen * 0.5);
    // Also sample a point just after midpoint to get the tangent angle.
    const midFwd   = probe.getPointAtLength(totalLen * 0.5 + 1);
    lineSvg.removeChild(probe);

    let angle      = Math.atan2(midFwd.y - mid.y, midFwd.x - mid.x) * 180 / Math.PI;
    if (angle > 90 || angle < -90) angle += 180;  // keep text right-side up
    const half     = totalLen / 2;
    const dashA    = half - GAP / 2;        // draw up to gap start
    const dashB    = GAP;                   // transparent gap
    const dashC    = totalLen - half - GAP / 2; // draw rest

    const pathId = `srch-line-${i}`;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('id',             pathId);
    path.setAttribute('d',              d);
    path.setAttribute('fill',           'none');
    path.setAttribute('stroke',         'white');
    path.setAttribute('stroke-width',   (s * 3.5).toFixed(2));
    path.setAttribute('stroke-opacity', (s * 0.85).toFixed(2));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-dasharray', `${dashA} ${dashB} ${dashC}`);
    lineSvg.appendChild(path);

    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('fill',         'white');
    textEl.setAttribute('fill-opacity', (s * 0.75).toFixed(2));
    textEl.setAttribute('font-size',    '10');
    textEl.setAttribute('font-family',  'monospace');
    textEl.setAttribute('text-anchor',  'middle');
    textEl.setAttribute('dominant-baseline', 'middle');
    textEl.setAttribute('transform',    `translate(${mid.x},${mid.y}) rotate(${angle})`);
    textEl.textContent = label;
    lineSvg.appendChild(textEl);
  });
}

export function clearLines() {
  // Reset any image nodes that were swapped by search back to their first image.
  for (const [key, np] of Object.entries(nodePositions)) {
    if (key.includes('::image::') && np.showImage) np.showImage(0);
  }
  state.lineScores  = {};
  state.searchActive = false;
  lineSvg.innerHTML  = '';
  syncSendButtonState();
  const noResults = document.getElementById('no-results');
  if (noResults) noResults.classList.remove('visible');
}

function animateLines() {
  const paths  = [...lineSvg.querySelectorAll('path')];
  const labels = [...lineSvg.querySelectorAll('text')];
  paths.forEach((path, i) => {
    const len           = path.getTotalLength();
    const targetOpacity = path.getAttribute('stroke-opacity');
    const finalDash     = path.getAttribute('stroke-dasharray'); // gap pattern set by redrawLines
    const label         = labels[i];
    const targetLabelOp = label ? parseFloat(label.getAttribute('fill-opacity')) : 0;

    path.setAttribute('stroke-opacity', '0');
    // Override gap dasharray with a full-length draw animation.
    path.style.strokeDasharray  = len;
    path.style.strokeDashoffset = len;
    if (label) label.setAttribute('fill-opacity', '0');

    const delay    = i * 40;
    const duration = 420 + len * 0.3;

    let start = null;
    function tick(ts) {
      if (!start) start = ts + delay;
      const elapsed = ts - start;
      if (elapsed < 0) { requestAnimationFrame(tick); return; }
      const t = Math.min(elapsed / duration, 1);
      const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
      path.style.strokeDashoffset = len * (1 - e);
      path.setAttribute('stroke-opacity', (parseFloat(targetOpacity) * Math.min(t * 3, 1)).toFixed(3));
      // Label fades in during the second half of the draw.
      if (label) label.setAttribute('fill-opacity', (targetLabelOp * Math.max(0, t * 2 - 1)).toFixed(3));
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        // Restore the gap dasharray now that the draw animation is done.
        path.style.strokeDasharray  = '';
        path.style.strokeDashoffset = '';
        if (finalDash) path.setAttribute('stroke-dasharray', finalDash);
      }
    }
    requestAnimationFrame(tick);
  });
}

// ── Search ──────────────────────────────────────────────────────────────
// The previous semantic-search backend (client-side transformers.js +
// embeddings model) has been removed and is being replaced. This shell keeps
// the input/button wiring and the line-drawing visualisation intact for
// whatever scoring logic replaces it — runQuery() just needs to populate
// state.lineScores and call redrawLines()/animateLines().
export async function init() {
  state.keywordList = await fetchKeywords();
  loadDot.style.display = 'none';
  const hints = ['search', 'search', 'search', "you may ask what i'm proud of"];
  inputEl.placeholder = hints[Math.floor(Math.random() * hints.length)];
  inputEl.disabled = false; sendBtn.disabled = false;
  refreshSuggestion();
}

async function runQuery(t) {
  if (!t.trim()) { clearLines(); return; }
  // No scoring backend wired up yet.
  clearLines();
}

// ── Input event wiring ────────────────────────────────────────────────────
// Called once from main.js after the desktop path is confirmed.
export function bindSearchEvents() {
  sendBtn.addEventListener('click', () => {
    if (state.searchActive) {
      inputEl.value = '';
      refreshSuggestion();
      clearLines();
      return;
    }
    runQuery(inputEl.value);
  });

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      if (acceptSuggestion()) e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      runQuery(inputEl.value);
    }
  });

  inputEl.addEventListener('input', () => {
    refreshSuggestion();
    if (!inputEl.value) clearLines();
  });

  // Cache inputWrap dimensions (only change on window resize).
  requestAnimationFrame(() => cacheDims(inputWrap));
  window.addEventListener('resize', () => cacheDims(inputWrap));
}
