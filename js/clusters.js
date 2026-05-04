// ─────────────────────────────────────────────
// Cluster convex-hull bezier curves.
// Drawn inside the canvas element so they
// scale with nodes as the user pans/zooms.
// ─────────────────────────────────────────────

import { clusterSvg, clusterNodes } from './state.js';
import { cacheDims }                from './dom.js';

// Andrew's monotone chain convex hull algorithm.
export function convexHull(pts) {
  pts = pts.slice().sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
  const cross = (O, A, B) => (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
  const lo = [], hi = [];
  for (const p of pts) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop();
    hi.push(p);
  }
  hi.pop(); lo.pop();
  return lo.concat(hi);
}

// Closed Catmull-Rom spline through the hull points.
export function catmullPath(hull) {
  const n = hull.length;
  if (n < 3) return '';
  const T = 0.4;
  let d = `M ${hull[0].x},${hull[0].y}`;
  for (let i = 0; i < n; i++) {
    const p0 = hull[(i - 1 + n) % n], p1 = hull[i],
          p2 = hull[(i + 1) % n],     p3 = hull[(i + 2) % n];
    const cp1x = p1.x + (p2.x - p0.x) * T, cp1y = p1.y + (p2.y - p0.y) * T;
    const cp2x = p2.x - (p3.x - p1.x) * T, cp2y = p2.y - (p3.y - p1.y) * T;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d + ' Z';
}

// Redraw one SVG <path> per cluster based on the convex hull of all its nodes.
export function redrawClusterCurves() {
  if (!Object.keys(clusterNodes).length) return;
  const PAD = 18;
  const ids = Object.keys(clusterNodes);

  // Ensure exactly one <path> per cluster, reusing existing elements.
  while (clusterSvg.children.length < ids.length) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('fill',         'none');
    p.setAttribute('stroke',       'rgba(255,255,255,0.06)');
    p.setAttribute('stroke-width', '1');
    clusterSvg.appendChild(p);
  }
  while (clusterSvg.children.length > ids.length) {
    clusterSvg.removeChild(clusterSvg.lastChild);
  }

  ids.forEach((id, i) => {
    const c   = clusterNodes[id];
    const pts = [];
    const els = [c.titleEl, ...c.satellites.map(s => s.el)];
    for (const e of els) {
      const x = parseInt(e.style.left) || 0;
      const y = parseInt(e.style.top)  || 0;
      const w = e._cw || e.offsetWidth  || 0;
      const h = e._ch || e.offsetHeight || 0;
      if (!w || !h) continue;
      pts.push({ x: x - PAD,     y: y - PAD     });
      pts.push({ x: x + w + PAD, y: y - PAD     });
      pts.push({ x: x + w + PAD, y: y + h + PAD });
      pts.push({ x: x - PAD,     y: y + h + PAD });
    }
    const hull = convexHull(pts);
    clusterSvg.children[i].setAttribute('d', hull.length >= 3 ? catmullPath(hull) : '');
  });
}
