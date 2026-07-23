// ─────────────────────────────────────────────
// Canvas node builders.
// makeNode wraps content in a draggable/resizable
// node shell; buildProjectNode creates a single
// project card that opens the project lightbox.
// ─────────────────────────────────────────────

import { state, nodePositions, projectDataById, projectNodeById } from './state.js';
import { SZ }                                from './layout.js';
import { el, placeCentered }                 from './dom.js';
import { redrawLines }                       from './search.js';
import { openProjectLb, openImgLb }          from './lightbox.js';
import { toThumb }                           from './utils.js';

// ── Shared node shell ─────────────────────────────────────────────────────
// Returns { nodeEl, content } where content is where the node's body goes.
export function makeNode(cls, label, w, h, { resizable = true, aspect = null } = {}) {
  const nodeEl = el('div', `node ${cls}`);
  nodeEl.style.width = w + 'px';
  if (h) nodeEl.style.height = h + 'px';

  const bar = el('div', 'node-bar');
  bar.appendChild(el('span', 'node-bar-label', label));
  nodeEl.appendChild(bar);

  const content = el('div', 'node-content');
  nodeEl.appendChild(content);

  const resizeHandle = resizable ? el('div', 'node-resize') : null;
  if (resizeHandle) nodeEl.appendChild(resizeHandle);

  // Per-node drag via bar — suppresses click propagation if the mouse moved.
  bar.addEventListener('mousedown', e => {
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startL = parseInt(nodeEl.style.left), startT = parseInt(nodeEl.style.top);
    let moved = false;
    function onMove(e) {
      if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 4) moved = true;
      nodeEl.style.left = Math.round(startL + (e.clientX - startX) / state.zoom) + 'px';
      nodeEl.style.top  = Math.round(startT + (e.clientY - startY) / state.zoom) + 'px';
      redrawLines();
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      if (moved) nodeEl.addEventListener('click', e => e.stopPropagation(), { once: true, capture: true });
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  if (!resizeHandle) return { nodeEl, content };

  // Resize via bottom-right dot.
  resizeHandle.addEventListener('mousedown', e => {
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startW = nodeEl.offsetWidth, startH = nodeEl.offsetHeight;
    let moved = false;
    function onMove(e) {
      if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 4) moved = true;
      const newW = Math.max(80, startW + (e.clientX - startX) / state.zoom);
      const ar   = aspect ?? nodeEl._aspect ?? null;
      const newH = ar ? newW * ar : Math.max(40, startH + (e.clientY - startY) / state.zoom);
      nodeEl.style.width  = Math.round(newW) + 'px';
      nodeEl.style.height = Math.round(newH) + 'px';
      nodeEl._cw = Math.round(newW); nodeEl._ch = Math.round(newH);
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      if (moved) nodeEl.addEventListener('click', e => e.stopPropagation(), { once: true, capture: true });
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  return { nodeEl, content };
}

// ── Project card ──────────────────────────────────────────────────────────
// Single draggable card per project on the canvas; click opens the project
// lightbox with the full tabbed overview.
export function buildProjectNode(p, detail, texts, images) {
  const W = SZ.project.w, H = SZ.project.h;

  // Resolve model path.
  const modelSrc = detail.model
    ? (/^https?:\/\//i.test(detail.model) || detail.model.startsWith('media/')
        ? detail.model
        : `media/projects/${p.id}/${detail.model}`)
    : null;

  const hasDetail = !!(detail.year || detail.role || detail.timeline || detail.tools?.length || detail.links?.length);
  const imageSrcs = images.length ? images : [];

  // Store data used by the project lightbox.
  projectDataById[p.id] = { project: p, detail, texts, images: imageSrcs, hasDetail, modelSrc };

  const { nodeEl, content } = makeNode('node-image node-project', p.title, W, H, { resizable: false });

  // Stack layers — positioned behind and offset down-right from the node wrapper.
  const STACK_DEPTH = 2;
  const stackCount = Math.min(STACK_DEPTH, imageSrcs.length - 1);
  for (let s = stackCount; s >= 1; s--) {
    const layer = el('div', `node-stack-layer node-stack-layer-${s}`);
    const layerImg = document.createElement('img');
    layerImg.src     = toThumb(imageSrcs[s]);
    layerImg.alt     = '';
    layerImg.loading = 'lazy';
    layer.appendChild(layerImg);
    nodeEl.appendChild(layer);
  }

  const stack = el('div', 'image-stack');
  const img   = document.createElement('img');
  img.src = imageSrcs[0] ? toThumb(imageSrcs[0]) : 'media/icons/LOGO.svg';
  img.alt = `${p.title} preview`; img.loading = 'lazy';
  stack.appendChild(img);
  if (imageSrcs.length > 1) stack.appendChild(el('div', 'image-count', String(imageSrcs.length)));
  content.appendChild(stack);

  function showImage(idx) {
    const src = imageSrcs[Math.max(0, Math.min(idx, imageSrcs.length - 1))];
    img.src = toThumb(src);
  }

  nodeEl.addEventListener('click', e => {
    if (e.target.closest('.node-bar')) return;
    e.stopPropagation();
    openProjectLb(p.id);
  });

  const hasZip = (detail.links || []).some(l => l.url?.endsWith('.zip'));
  if (hasZip) {
    const badge = el('div', 'node-download-badge');
    const badgeImg = document.createElement('img');
    badgeImg.src = 'media/icons/Goodie.svg';
    badgeImg.alt = 'Download available';
    badge.appendChild(badgeImg);
    nodeEl.appendChild(badge);
  }

  placeCentered(nodeEl, p.x, p.y, W, H);
  nodePositions[`${p.id}::project`] = { el: nodeEl, showImage, imgIndex: 0 };
  projectNodeById[p.id] = nodeEl;
}


