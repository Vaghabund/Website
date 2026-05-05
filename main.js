// ─────────────────────────────────────────────
// Entry point — orchestrates module initialisation.
// All heavy logic lives in js/*.js modules.
// ─────────────────────────────────────────────

import PROJECTS from './projects.js';

// These modules are side-effect-free at evaluation time and are needed by
// both the mobile and desktop paths, so they are imported statically.
import { IS_MOBILE, INITIAL_ZOOM }             from './js/state.js';
import { CANVAS_CX, CANVAS_CY }               from './js/layout.js';
import { buildMobileView, buildAccordionView } from './js/mobile.js';
import { buildFooter }                         from './js/footer.js';

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
  initDesktop();
}

async function initDesktop() {
  // MAX_R is in screen pixels — divide by zoom to convert to canvas coords,
  // so the visual cluster size stays the same regardless of initial zoom level.
  const MAX_R_SCREEN = 300;
  const MAX_R = MAX_R_SCREEN / INITIAL_ZOOM;
  PROJECTS.forEach(p => {
    if (p.x || p.y) return;
    const angle = Math.random() * 2 * Math.PI;
    const r     = MAX_R * Math.sqrt(Math.random());
    p.x = CANVAS_CX + r * Math.cos(angle);
    p.y = CANVAS_CY + r * Math.sin(angle);
  });

  // Resolve overlaps: repeatedly nudge colliding nodes apart until clear.
  // NODE_W/H are canvas-px footprints with a small gutter.
  const { SZ } = await import('./js/layout.js');
  const NODE_W = SZ.project.w + 20;
  const NODE_H = SZ.project.h + 20;
  const movable = PROJECTS.filter(p => p.x && p.y);
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
    ,                                                              // canvas.js — side effects only
    { clearLines, init, syncSendButtonState, bindSearchEvents },   // search.js
    { fetchDetail, stripMd },                                      // utils.js
    { buildProjectNode },                                          // nodes.js
    ,                                                              // lightbox.js — side effects only
  ] = await Promise.all([
    import('./js/canvas.js'),
    import('./js/search.js'),
    import('./js/utils.js'),
    import('./js/nodes.js'),
    import('./js/lightbox.js'),
  ]);

  // ── View toggle (canvas ↔ list view) ──────────────────────────────────
  const viewToggleBtn = document.getElementById('view-toggle');
  buildAccordionView('desktop-list-view');

  function setDesktopViewMode(listMode) {
    document.body.classList.toggle('list-view', listMode);
    if (viewToggleBtn) {
      viewToggleBtn.setAttribute('aria-pressed', listMode ? 'true' : 'false');
      viewToggleBtn.textContent = listMode ? 'visual archive' : 'list view';
    }
    if (listMode) clearLines();
  }

  if (viewToggleBtn) {
    viewToggleBtn.addEventListener('click', () => {
      setDesktopViewMode(!document.body.classList.contains('list-view'));
    });
    setDesktopViewMode(false);
  }

  // ── Build all project nodes ────────────────────────────────────────────
  PROJECTS.forEach(p => {
    fetchDetail(p.id).then(async detail => {
      const textDefs = Array.isArray(detail.texts) && detail.texts.length
        ? detail.texts
        : [{ file: 'description.md', label: p.title }];

      const baseDir = `media/projects/${p.id}`;

      const textBodies = await Promise.all(textDefs.map(async t => {
        const file = t.file || 'description.md';
        try {
          const txt = await fetch(`${baseDir}/${file}`).then(r => r.ok ? r.text() : null);
          return { label: t.label || p.title, body: txt ? stripMd(txt) : null };
        } catch { return { label: t.label || p.title, body: null }; }
      }));

      const cleanTexts     = textBodies.filter(t => t.body);
      const resolvedImages = (detail.images || []).map(i => i.startsWith('media/') ? i : `${baseDir}/${i}`);
      buildProjectNode(p, detail, cleanTexts, resolvedImages);
    }).catch(console.error);
  });

  // ── Bootstrap search and footer ────────────────────────────────────────
  bindSearchEvents();
  init().catch(console.error);
  syncSendButtonState();
  buildFooter();
}
