// ─────────────────────────────────────────────
// Entry point — orchestrates module initialisation.
// All heavy logic lives in js/*.js modules.
// ─────────────────────────────────────────────

import PROJECTS from './projects.js';

// These modules are side-effect-free at evaluation time and are needed by
// both the mobile and desktop paths, so they are imported statically.
import { IS_MOBILE, INITIAL_ZOOM }             from './js/state.js';
import { CANVAS_CX, CANVAS_CY }               from './js/layout.js';
import { buildMobileView }                     from './js/mobile.js';
import { buildFooter }                         from './js/footer.js';
import './js/intro.js';
import './js/favicon-spin.js';

// Disable right-click save on images sitewide.
document.addEventListener('contextmenu', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });

if (IS_MOBILE) {
  // ── Mobile path ──────────────────────────────────────────────────────────
  document.body.classList.add('is-mobile');
  buildMobileView();
  buildFooter();
} else {
  // ── Desktop path ─────────────────────────────────────────────────────────
  // Desktop modules are dynamically imported so their module-level side
  // effects (event listeners, initial applyTransform call, etc.) only run
  // when we are actually on a desktop browser.
  // The node canvas is the default view — no body class needed; `list-view`
  // is added by js/view-switch.js only once the user toggles into the list.
  initDesktop();
}

async function initDesktop() {
  // MAX_R is in screen pixels — divide by zoom to convert to canvas coords,
  // so the visual cluster size stays the same regardless of initial zoom level.
  const MAX_R_SCREEN = 250;
  const MAX_R = MAX_R_SCREEN / INITIAL_ZOOM;
  // "about" never becomes a node, so it must not take up a slot on the ring
  // (that would leave a visible gap) or be nudged around by the overlap pass.
  const CANVAS_PROJECTS = PROJECTS.filter(p => p.id !== 'about');
  const unplaced = CANVAS_PROJECTS.filter(p => !p.x && !p.y);
  unplaced.forEach((p, i) => {
    // Evenly spaced around a ring, starting at 12 o'clock, going clockwise —
    // rather than scattered randomly within the disk.
    const angle = (i / unplaced.length) * 2 * Math.PI - Math.PI / 2;
    p.x = CANVAS_CX + MAX_R * Math.cos(angle);
    p.y = CANVAS_CY + MAX_R * Math.sin(angle);
  });

  // Resolve overlaps: repeatedly nudge colliding nodes apart until clear.
  // NODE_W/H are canvas-px footprints with a small gutter.
  const { SZ } = await import('./js/layout.js');
  const NODE_W = SZ.project.w + 60;
  const NODE_H = SZ.project.h + 60;
  const movable = CANVAS_PROJECTS.filter(p => p.x && p.y);
  for (let iter = 0; iter < 200; iter++) {
    let anyOverlap = false;
    for (let i = 0; i < movable.length; i++) {
      for (let j = i + 1; j < movable.length; j++) {
        const a = movable[i], b = movable[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const overlapX = NODE_W - Math.abs(dx);
        const overlapY = NODE_H - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        anyOverlap = true;
        // Push along the axis of least overlap.
        if (overlapX < overlapY) {
          const push = overlapX / 2 + 1;
          a.x -= dx > 0 ? push : -push;
          b.x += dx > 0 ? push : -push;
        } else {
          const push = overlapY / 2 + 1;
          a.y -= dy > 0 ? push : -push;
          b.y += dy > 0 ? push : -push;
        }
      }
    }
    if (!anyOverlap) break;
  }

  // Load desktop modules in parallel.
  //   canvas.js   — executes applyTransform() and registers mouse/wheel/touch
  //                 listeners during its own evaluation (side effects only).
  //   lightbox.js — wires all lightbox close buttons during its own evaluation.
  const [
    ,                                                    // canvas.js — side effects only
    { fetchDetail, stripMd },                            // utils.js
    { buildProjectNode, registerProjectData },           // nodes.js
    ,                                                    // lightbox.js — side effects only
    { initViewSwitch },                                  // view-switch.js
  ] = await Promise.all([
    import('./js/canvas.js'),
    import('./js/utils.js'),
    import('./js/nodes.js'),
    import('./js/lightbox.js'),
    import('./js/view-switch.js'),
  ]);

  // ── Node canvas ⇄ list toggle ───────────────────────────────────────────
  initViewSwitch();

  // ── Build all project nodes ────────────────────────────────────────────
  // "about" is deliberately excluded from the canvas AND from the list — its
  // data is still registered so the top-bar "about" link can open it in the
  // project lightbox, it just never becomes a node or a row.
  PROJECTS.forEach(p => {
    fetchDetail(p.id).then(async detail => {
      const textDefs = Array.isArray(detail.texts) && detail.texts.length
        ? detail.texts
        : [{ file: 'description.md', label: 'Overview' }];

      const baseDir = `media/projects/${p.id}`;

      const textBodies = await Promise.all(textDefs.map(async t => {
        const file = t.file || 'description.md';
        try {
          const txt = await fetch(`${baseDir}/${file}`).then(r => r.ok ? r.text() : null);
          return { label: t.label || 'Overview', body: txt ? stripMd(txt) : null };
        } catch { return { label: t.label || 'Overview', body: null }; }
      }));

      const cleanTexts     = textBodies.filter(t => t.body);
      const isAbsolute = u => /^https?:\/\//i.test(u) || u.startsWith('media/');
      const resolve = u => isAbsolute(u) ? u : `${baseDir}/${u}`;
      const resolvedImages = (detail.images || []).map(resolve);
      const resolvedVideos = (detail.videos || []).map(resolve);
      detail._resolvedVideos = resolvedVideos;
      detail._resolvedPoster = detail.poster ? resolve(detail.poster) : null;
      if (p.id === 'about') registerProjectData(p, detail, cleanTexts, resolvedImages);
      else                  buildProjectNode(p, detail, cleanTexts, resolvedImages);
    }).catch(console.error);
  });

  // ── Bootstrap footer ─────────────────────────────────────────────────
  buildFooter();
}
