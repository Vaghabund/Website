// ─────────────────────────────────────────────
// Entry point — orchestrates module initialisation.
// All heavy logic lives in js/*.js modules.
// ─────────────────────────────────────────────

import PROJECTS from './projects.js';

// These modules are side-effect-free at evaluation time and are needed by
// both the mobile and desktop paths, so they are imported statically.
import { IS_MOBILE }                           from './js/state.js';
import { fibPos }                              from './js/layout.js';
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
  // Assign phyllotaxis positions to all non-about projects before any
  // node builder reads p.x / p.y.
  let si = 0;
  PROJECTS.forEach(p => { if (p.id !== 'about') Object.assign(p, fibPos(si++)); });

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
    const detailPromise = p.id === 'about'
      ? Promise.resolve({ texts: [{ file: 'bio.md', label: 'Bio' }], images: ['profile.webp'], _aboutBase: true })
      : fetchDetail(p.id);

    detailPromise.then(async detail => {
      const textDefs = Array.isArray(detail.texts) && detail.texts.length
        ? detail.texts
        : [{ file: 'description.md', label: p.title }];

      const baseDir = detail._aboutBase ? 'media/about' : `media/projects/${p.id}`;

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
