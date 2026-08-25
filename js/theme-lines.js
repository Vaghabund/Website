// ─────────────────────────────────────────────
// Theme connection lines — canvas only. Hovering a
// project node draws a line to every other project
// that shares at least one theme tag, labelled with
// the shared theme. Lives inside #canvas-root, so it
// pans/zooms with the canvas for free — no per-frame
// screen-space conversion needed.
// ─────────────────────────────────────────────

import { projectDataById, projectNodeById } from './state.js';
import { CANVAS_CX, CANVAS_CY }             from './layout.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const THEME_LABELS = {
  'photogrammetry':     'Photogrammetry',
  'plugin-engineering': 'Plugin Engineering',
  'generative-ai':      'Generative AI',
  'physical-object':    'Physical Object',
  'critical-theory':    'Critical Theory',
};

let svg = null;
function getSvg() {
  if (!svg) svg = document.getElementById('theme-line-overlay');
  return svg;
}

function nodeCenter(nodeEl) {
  return {
    cx: (parseInt(nodeEl.style.left) || 0) + (nodeEl._cw || nodeEl.offsetWidth  || 0) / 2,
    cy: (parseInt(nodeEl.style.top)  || 0) + (nodeEl._ch || nodeEl.offsetHeight || 0) / 2,
  };
}

function themesOf(id) {
  return projectDataById[id]?.detail?.themes || [];
}

// Quadratic-bezier "noodle" that routes inward toward the canvas centre
// (the hub all the ring-arranged nodes sit around) before curving back out
// to the destination — a hub-and-spoke chord rather than a direct bow.
//
// The old version pulled each endpoint toward the centre independently and
// fanned them with a pseudo-random per-pair jitter, which routed unrelated
// noodles through roughly the same central region and made them cross
// arbitrarily. This version instead places a single control point on the
// radius at the pair's *angular midpoint*, pulled toward the centre by an
// amount proportional to how far apart the two nodes are around the ring —
// neighbours get a shallow arc that hugs the ring, opposite-side pairs dip
// close to the hub. That's a standard circular-chord layout: it only
// crosses another noodle when the two connections are genuinely
// interleaved around the ring, not because of arbitrary routing.
function noodlePath(x1, y1, x2, y2) {
  const a1 = Math.atan2(y1 - CANVAS_CY, x1 - CANVAS_CX);
  const a2 = Math.atan2(y2 - CANVAS_CY, x2 - CANVAS_CX);
  let diff = a2 - a1;
  while (diff >  Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const midAngle    = a1 + diff / 2;
  const angularSpan = Math.abs(diff); // 0 (neighbours) .. PI (opposite sides)

  const r1 = Math.hypot(x1 - CANVAS_CX, y1 - CANVAS_CY);
  const r2 = Math.hypot(x2 - CANVAS_CX, y2 - CANVAS_CY);
  const pull = 0.15 + 0.65 * (angularSpan / Math.PI); // 0.15..0.8 toward centre
  const cr = ((r1 + r2) / 2) * (1 - pull);
  const cx = CANVAS_CX + cr * Math.cos(midAngle);
  const cy = CANVAS_CY + cr * Math.sin(midAngle);

  return {
    d: `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`,
    // Point at t=0.5 on a quadratic bezier: 0.25·P0 + 0.5·P1 + 0.25·P2
    midX: 0.25 * x1 + 0.5 * cx + 0.25 * x2,
    midY: 0.25 * y1 + 0.5 * cy + 0.25 * y2,
  };
}

function clearLines() {
  const s = getSvg();
  if (s) s.innerHTML = '';
}

// id of the project currently showing lines, or null. Tracked so drag/resize
// (js/nodes.js) can call refreshLines() to reposition the same set of lines
// every frame without re-running hover detection or re-triggering the fade.
let hoveredId = null;

// Rebuilds the line/label elements from scratch at hoveredId's and its
// related nodes' *current* positions — cheap enough (a handful of DOM
// nodes) to call on every drag/resize move for live-following noodles.
function render() {
  clearLines();
  const s = getSvg();
  const fromEl = projectNodeById[hoveredId];
  const themes = themesOf(hoveredId);
  if (!s || !fromEl || !themes.length) return;

  const from = nodeCenter(fromEl);

  Object.keys(projectNodeById).forEach(otherId => {
    if (otherId === hoveredId) return;
    const shared = themes.filter(t => themesOf(otherId).includes(t));
    if (!shared.length) return;
    const toEl = projectNodeById[otherId];
    if (!toEl) return;
    const to = nodeCenter(toEl);
    const noodle = noodlePath(from.cx, from.cy, to.cx, to.cy);

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', noodle.d);
    path.setAttribute('class', 'theme-line');
    s.appendChild(path);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', noodle.midX);
    label.setAttribute('y', noodle.midY);
    label.setAttribute('class', 'theme-line-label');
    label.textContent = shared.map(t => THEME_LABELS[t] || t).join(' · ');
    s.appendChild(label);
  });
}

function drawLinesFrom(id) {
  hoveredId = id;
  render();
  // Fade the whole overlay in on the next frame, rather than snapping in —
  // simpler than per-line fades, and the whole constellation reads as one
  // reveal. On mouseleave we only fade it back out (see hideLines) and
  // leave the now-invisible lines in place; the next drawLinesFrom() call
  // clears them at its own start, so there's nothing to clean up here.
  const s = getSvg();
  if (s) requestAnimationFrame(() => s.classList.add('visible'));
}

function hideLines() {
  hoveredId = null;
  const s = getSvg();
  if (s) s.classList.remove('visible');
}

// Called once per project node from js/nodes.js after it's registered.
export function bindThemeLineHover(nodeEl, id) {
  nodeEl.addEventListener('mouseenter', () => drawLinesFrom(id));
  nodeEl.addEventListener('mouseleave', hideLines);
}

// Called from js/nodes.js's drag/resize move handlers so the lines track
// the node live instead of only updating on the next hover. No-ops when
// nothing is currently hovered/showing lines.
export function refreshLines() {
  if (hoveredId) render();
}
