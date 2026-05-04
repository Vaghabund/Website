import PROJECTS from './projects.js';

document.addEventListener('contextmenu', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });

// ─────────────────────────────────────────────
// Markdown fetch + strip (shared)
// ─────────────────────────────────────────────
function stripMd(txt) {
  return txt
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchMdBody(id) {
  try {
    const txt = await fetch(`media/projects/${id}/description.md`).then(r => r.ok ? r.text() : null);
    return txt ? stripMd(txt) : null;
  } catch { return null; }
}

function parseKeywordMd(txt) {
  const seen = new Set();
  const keywords = [];
  txt.split('\n').forEach(raw => {
    const clean = raw
      .replace(/<!--.*?-->/g, '')
      .replace(/^\s*[-*+]\s+/, '')
      .replace(/^\s*\d+\.\s+/, '')
      .replace(/^\s*#+\s+/, '')
      .trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    keywords.push(clean);
  });
  return keywords;
}

async function fetchKeywords() {
  try {
    const txt = await fetch('media/search-keywords.md').then(r => r.ok ? r.text() : '');
    return txt ? parseKeywordMd(txt) : [];
  } catch {
    return [];
  }
}

// Parse YAML-ish frontmatter from detail.md into a plain object.
// Supports string scalars, indented list items, and nested list-of-objects.
function parseFrontmatter(txt) {
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const LIST_KEYS = new Set(['images', 'tools', 'links', 'texts']);
  const out = {};
  const lines = m[1].split('\n');
  let key = null, listKey = null, listObj = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    // nested object item inside a list:  "  - label: ..."
    const objItem = line.match(/^  - (\w+):\s*"?([^"]*)"?$/);
    if (objItem && listKey) {
      listObj = { [objItem[1]]: objItem[2].trim() };
      if (!Array.isArray(out[listKey])) out[listKey] = [];
      out[listKey].push(listObj);
      continue;
    }
    // continuation key on a list object:  "    url: ..."
    const objCont = line.match(/^    (\w+):\s*"?([^"]*)"?$/);
    if (objCont && listObj) {
      listObj[objCont[1]] = objCont[2].trim();
      continue;
    }
    // plain list item:  "  - value"
    const listItem = line.match(/^  - (.+)$/);
    if (listItem && listKey) {
      if (!Array.isArray(out[listKey])) out[listKey] = [];
      out[listKey].push(listItem[1].replace(/^"|"$/g, '').trim());
      listObj = null;
      continue;
    }
    // top-level list key with no inline value
    const listStart = line.match(/^(\w+):\s*(?:\[\s*\])?\s*$/);
    if (listStart && LIST_KEYS.has(listStart[1])) {
      listKey = listStart[1];
      out[listKey] = [];
      key = null; listObj = null;
      continue;
    }
    // top-level key
    const kv = line.match(/^(\w+):\s*"?([^"]*)"?$/);
    if (kv) {
      key = kv[1]; listKey = null; listObj = null;
      const val = kv[2].trim();
      out[key] = val === '' ? null : val;
      continue;
    }
  }
  return out;
}

async function fetchDetail(id) {
  try {
    const txt = await fetch(`media/projects/${id}/detail.md`).then(r => r.ok ? r.text() : null);
    return txt ? parseFrontmatter(txt) : {};
  } catch { return {}; }
}

// ─────────────────────────────────────────────
// Mobile accordion view
// ─────────────────────────────────────────────
async function loadMobileItem(p, content) {
  const [mdText, media] = await Promise.all([
    (async () => {
      if (p.id === 'about') {
        const raw = await fetch('media/about/bio.md').then(r => r.ok ? r.text() : null).catch(() => null);
        return raw ? stripMd(raw) : null;
      }
      return fetchMdBody(p.id);
    })(),
    (async () => {
      if (p.id === 'about') {
        return { imgSrcs: ['media/about/profile-small.webp'], detail: {} };
      }
      const detail = await fetchDetail(p.id);
      const base   = `media/projects/${p.id}/`;
      const imgSrcs = (detail.images || []).map(i => i.startsWith('media/') ? i : base + i);
      return { imgSrcs, detail };
    })(),
  ]);

  const imgSrcs = media.imgSrcs || [];
  const detail = media.detail || {};
  const split = document.createElement('div');
  split.className = 'm-split';
  const leftCol = document.createElement('div');
  leftCol.className = 'm-col m-col-images';
  const rightCol = document.createElement('div');
  rightCol.className = 'm-col m-col-text';

  const altBase = p.id === 'about' ? 'Profile photo of Joel Tenenberg' : `${p.title} — project image`;
  const gallery = document.createElement('div');
  gallery.className = 'm-gallery';
  imgSrcs.forEach((src, idx) => {
    const img     = document.createElement('img');
    img.src       = src;
    img.alt       = p.id === 'about' ? `${altBase} ${idx + 1}` : altBase;
    img.className = 'm-img';
    img.loading   = 'lazy';
    gallery.appendChild(img);
  });
  if (gallery.childElementCount) leftCol.appendChild(gallery);

  if (mdText) {
    const textEl = document.createElement('div');
    textEl.className = 'm-text';
    textEl.textContent = mdText;
    rightCol.appendChild(textEl);
  }

  const infoRows = [
    detail.year && ['Year', detail.year],
    detail.role && ['Role', detail.role],
    detail.timeline && ['Timeline', detail.timeline],
    detail.tools?.length && ['Tools', detail.tools.join(', ')],
  ].filter(Boolean);

  if (infoRows.length || (Array.isArray(detail.links) && detail.links.length)) {
    const info = document.createElement('div');
    info.className = 'm-info';
    infoRows.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'm-info-row';
      const lbl = document.createElement('div');
      lbl.className = 'm-info-label';
      lbl.textContent = label;
      const val = document.createElement('div');
      val.className = 'm-info-value';
      val.textContent = value;
      row.appendChild(lbl);
      row.appendChild(val);
      info.appendChild(row);
    });

    if (Array.isArray(detail.links) && detail.links.length) {
      const row = document.createElement('div');
      row.className = 'm-info-row';
      const lbl = document.createElement('div');
      lbl.className = 'm-info-label';
      lbl.textContent = 'Links';
      row.appendChild(lbl);
      detail.links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'm-link';
        a.textContent = link.label;
        row.appendChild(a);
      });
      info.appendChild(row);
    }

    rightCol.appendChild(info);
  }

  split.appendChild(leftCol);
  split.appendChild(rightCol);
  content.appendChild(split);
}

const IMPRESSUM_TEXT = `Angaben gemäß § 5 TMG

Joel Tenenberg

Kontakt
E-Mail: joel@tenenberg.net

Haftungsausschluss
Die Inhalte dieser Seite wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird keine Gewähr übernommen.`;

function buildFooter() {
  const footer = document.createElement('footer');
  footer.id = 'site-footer';
  footer.innerHTML = `
    <span class="footer-socials">
      <a href="https://www.instagram.com/vaghabund/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">Instagram</a>
    </span>
    <span class="footer-copy">© Joel Tenenberg ${new Date().getFullYear()}</span>
    <button class="footer-impressum">Impressum</button>
  `;
  document.body.appendChild(footer);

  // Impressum lightbox
  const lb = document.createElement('div');
  lb.id = 'impressum-lightbox';
  lb.innerHTML = `
    <div id="imp-inner">
      <div id="imp-title">Impressum</div>
      <div id="imp-body"></div>
    </div>
    <button id="imp-close">&#x2715;</button>
  `;
  document.body.appendChild(lb);
  document.getElementById('imp-body').textContent = IMPRESSUM_TEXT;

  footer.querySelector('.footer-impressum').onclick = () => lb.classList.add('open');
  document.getElementById('imp-close').onclick = () => lb.classList.remove('open');
  lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('open'); });
}

function buildAccordionView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const mobileProjects = [
    ...PROJECTS.filter(p => p.id !== 'about'),
    PROJECTS.find(p => p.id === 'about'),
  ].filter(Boolean);

  for (const p of mobileProjects) {
    const item    = document.createElement('div');
    item.className = 'm-item';

    const content = document.createElement('div');
    content.className = 'm-content';
    content.id = `${containerId}-content-${p.id}`;

    const header  = document.createElement('button');
    header.type = 'button';
    header.className = 'm-header';
    header.textContent = p.title;
    header.setAttribute('aria-controls', content.id);
    header.setAttribute('aria-expanded', 'false');

    header.addEventListener('click', () => {
      const isOpen = header.classList.contains('open');
      container.querySelectorAll('.m-header.open').forEach(h => {
        h.classList.remove('open');
        h.setAttribute('aria-expanded', 'false');
      });
      container.querySelectorAll('.m-content.open').forEach(c => c.classList.remove('open'));
      if (!isOpen) {
        header.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
        content.classList.add('open');
        item.scrollIntoView({ block: 'start', behavior: 'smooth' });
        if (!content.dataset.loaded) {
          content.dataset.loaded = 'true';
          loadMobileItem(p, content).catch(console.error);
        }
      }
    });

    item.appendChild(header);
    item.appendChild(content);
    container.appendChild(item);
  }
}

function buildMobileView() {
  buildAccordionView('mobile-view');
}

// ─────────────────────────────────────────────
// Mobile: render accordion and stop here.
// Detection runs once at load — stamping a class on <body> so CSS doesn't
// re-evaluate on orientation change (which would show the canvas mid-session).
// ─────────────────────────────────────────────
const IS_MOBILE = window.matchMedia('(max-width: 600px)').matches ||
                  window.matchMedia('(max-height: 600px) and (orientation: landscape) and (pointer: coarse)').matches;

if (IS_MOBILE) {
  document.body.classList.add('is-mobile');
  buildMobileView();
  buildFooter();
} else {

// ─────────────────────────────────────────────
// Desktop only — canvas, nodes, AI search
// ─────────────────────────────────────────────

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
    const listMode = !document.body.classList.contains('list-view');
    setDesktopViewMode(listMode);
  });
  setDesktopViewMode(false);
}

// Seeded PRNG (mulberry32)
function seededRand(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function strSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return h >>> 0;
}

const TRUNC = 240;
function trunc(full) {
  if (full.length <= TRUNC) return { short: full, more: false };
  const c = full.lastIndexOf(' ', TRUNC);
  return { short: full.slice(0, c > 0 ? c : TRUNC), more: true };
}

// ─────────────────────────────────────────────
// Layout constants — all in canvas px
// ─────────────────────────────────────────────
const CANVAS_CX = 2000, CANVAS_CY = 1500;

// Node sizes in canvas px (must match CSS widths + estimated heights)
const SZ = {
  title:  { w: 220, h: 38  },
  image:  { w: 190, h: 154 }, // 190 × (190 * 3/4) + border
  project:{ w: 230, h: 190 },
  text:   { w: 210, h: 373 },
  detail: { w: 148, h: 100 },
  model:  { w: 220, h: 220 },
};

// Fibonacci/golden-angle phyllotaxis around the search bar.
// Each successive cluster is placed at the golden angle (137.5°) further
// around, and radius grows with sqrt(i) so density stays even.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.3999 rad
const FIB_RADIUS   = 620; // scale factor — increase to spread clusters further
function fibPos(i) {
  const a = i * GOLDEN_ANGLE;
  const r = FIB_RADIUS * Math.sqrt(i + 1);
  return { x: CANVAS_CX + r * Math.cos(a), y: CANVAS_CY + r * Math.sin(a) };
}
let si = 0;
PROJECTS.forEach(p => { if (p.id !== 'about') Object.assign(p, fibPos(si++)); });

// ─────────────────────────────────────────────
// Satellite positions — tight, non-overlapping
// Three satellites at 120° sectors around title centre.
// Distance from title centre: half-diagonal of the satellite node
// + half-diagonal of the title node + gap.
// ─────────────────────────────────────────────
const GAP = 8; // canvas px between node edges
const SECTOR = (2 * Math.PI) / 3;

function halfDiag(type) {
  return Math.sqrt(SZ[type].w ** 2 + SZ[type].h ** 2) / 2;
}

// slotIndex: 0-based position around the title, type: key into SZ
function satPos(p, slotIndex, type, totalSlots) {
  const n      = Math.max(totalSlots, 3);
  const rand   = seededRand(strSeed(p.id + 'base'));
  const base   = rand() * 2 * Math.PI;
  const jitter = seededRand(strSeed(p.id + type + slotIndex));
  const angle  = base + slotIndex * (2 * Math.PI / n) + (jitter() - 0.5) * 0.3;
  const dist   = halfDiag('title') + halfDiag(type) + GAP;
  return {
    x: p.x + dist * Math.cos(angle),
    y: p.y + dist * Math.sin(angle),
  };
}

// ─────────────────────────────────────────────
// Pan / zoom
// ─────────────────────────────────────────────
const MIN_ZOOM = 0.2, MAX_ZOOM = 3.0, INITIAL_ZOOM = 0.6;
let zoom = INITIAL_ZOOM;
let pan  = {
  x: window.innerWidth  / 2 - CANVAS_CX * zoom,
  y: window.innerHeight / 2 - CANVAS_CY * zoom,
};

const canvasRoot = document.getElementById('canvas-root');
const clusterSvg = document.getElementById('cluster-svg');
const lineSvg         = document.getElementById('line-overlay');
const clusterRects    = {};
const clusterTitlePos = {};
const clusterNodes    = {}; // id → { titleEl, cx, cy, satellites:[{el,ox,oy,w,h}] }
const nodePositions   = {}; // nodeKey → { el }  — for per-node search lines
let   lineScores      = {}; // nodeKey → normalised score
const inputWrap  = document.getElementById('input-wrap');
const inputEl    = document.getElementById('query-input');
const suggestionEl = document.getElementById('query-suggestion');
const sendBtn    = document.getElementById('send-btn');
const loadDot    = document.getElementById('loading-dot');

let keywordList = [];
let activeSuggestion = '';
let searchActive = false;

function syncSendButtonState() {
  sendBtn.textContent = searchActive ? 'x' : '→';
}

function getBestSuggestion(value) {
  const q = value.trim().toLowerCase();
  if (!q) return '';
  const startsWith = keywordList.find(k => k.toLowerCase().startsWith(q));
  if (startsWith) return startsWith;
  return keywordList.find(k => k.toLowerCase().includes(q)) || '';
}

function refreshSuggestion() {
  activeSuggestion = getBestSuggestion(inputEl.value);
  if (!activeSuggestion || activeSuggestion.toLowerCase() === inputEl.value.trim().toLowerCase()) {
    suggestionEl.textContent = '';
    return;
  }
  suggestionEl.textContent = activeSuggestion;
}

function hasAcceptableSuggestion() {
  return !!activeSuggestion && activeSuggestion.toLowerCase() !== inputEl.value.trim().toLowerCase();
}

function acceptSuggestion() {
  if (!hasAcceptableSuggestion()) return false;
  inputEl.value = activeSuggestion;
  refreshSuggestion();
  return true;
}

function applyTransform() {
  canvasRoot.style.transform = `translate(${pan.x}px,${pan.y}px) scale(${zoom})`;
  redrawClusterCurves();
  redrawLines();
}
applyTransform();

// Cache inputWrap width (only changes on window resize)
requestAnimationFrame(() => cacheDims(inputWrap));
window.addEventListener('resize', () => cacheDims(inputWrap));

// ─────────────────────────────────────────────
// Cluster drag
// ─────────────────────────────────────────────
function moveCluster(id, newCx, newCy) {
  const c = clusterNodes[id];
  if (!c) return;
  c.cx = newCx; c.cy = newCy;
  // move title
  c.titleEl.style.left = Math.round(newCx - SZ.title.w / 2) + 'px';
  c.titleEl.style.top  = Math.round(newCy - SZ.title.h / 2) + 'px';
  // move satellites and rebuild rects
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

let clusterDragging = null; // { id, startCx, startCy, mouseStartX, mouseStartY }

// Pan
let dragging = false, dragStart = { x: 0, y: 0 }, panStart = { x: 0, y: 0 };
document.addEventListener('mousedown', e => {
  if (e.target.closest('#input-wrap,#lightbox,#text-lightbox,.node-image,.detail-link,.node-text,.node-model,.node-bar,.node-resize')) return;
  // Check if clicking a title node
  const titleEl = e.target.closest('.node-title');
  if (titleEl && titleEl._clusterId) {
    e.stopPropagation();
    const c = clusterNodes[titleEl._clusterId];
    // Refresh ox/oy from live DOM so individually-dragged satellites keep their position
    for (const s of c.satellites) {
      s.ox = parseInt(s.el.style.left) + s.w / 2 - c.cx;
      s.oy = parseInt(s.el.style.top)  + s.h / 2 - c.cy;
    }
    clusterDragging = { id: titleEl._clusterId, startCx: c.cx, startCy: c.cy, mouseStartX: e.clientX, mouseStartY: e.clientY };
    canvasRoot.classList.add('dragging');
    return;
  }
  dragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  panStart  = { ...pan };
  canvasRoot.classList.add('dragging');
});
let rafPending = false;
document.addEventListener('mousemove', e => {
  if (clusterDragging) {
    const dx = (e.clientX - clusterDragging.mouseStartX) / zoom;
    const dy = (e.clientY - clusterDragging.mouseStartY) / zoom;
    const newCx = clusterDragging.startCx + dx;
    const newCy = clusterDragging.startCy + dy;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(() => { moveCluster(clusterDragging.id, newCx, newCy); rafPending = false; });
    }
    return;
  }
  if (!dragging) return;
  pan.x = panStart.x + (e.clientX - dragStart.x);
  pan.y = panStart.y + (e.clientY - dragStart.y);
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

// Zoom
function doZoom(delta, cx, cy) {
  const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * Math.exp(-delta * 0.001)));
  const r  = nz / zoom;
  pan.x = cx + (pan.x - cx) * r;
  pan.y = cy + (pan.y - cy) * r;
  zoom  = nz;
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => { applyTransform(); rafPending = false; });
  }
}
document.addEventListener('wheel', e => {
  if (document.body.classList.contains('list-view')) return;
  if (e.target.closest('#tlb-inner')) return;
  e.preventDefault(); doZoom(e.deltaY, e.clientX, e.clientY);
}, { passive: false });
let lp = null;
document.addEventListener('touchstart', e => { if (e.touches.length === 2) lp = pd(e); }, { passive: true });
document.addEventListener('touchmove',  e => {
  if (document.body.classList.contains('list-view')) return;
  if (e.touches.length !== 2) return;
  const d = pd(e);
  const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
  const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
  if (lp) doZoom((lp - d) * 5, cx, cy);
  lp = d;
}, { passive: true });
document.addEventListener('touchend',    () => { lp = null; });
document.addEventListener('touchcancel', () => { lp = null; });
function pd(e) {
  return Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY);
}

// ─────────────────────────────────────────────
// Lightboxes
// ─────────────────────────────────────────────
const lightbox = document.getElementById('lightbox');
const lbImg    = document.getElementById('lb-img');
const lbCtr    = document.getElementById('lb-counter');
const projectLb = document.getElementById('project-lightbox');
const plbTitle  = document.getElementById('plb-title');
const plbTabs   = document.getElementById('plb-tabs');
const plbBody   = document.getElementById('plb-body');
const projectDataById = {};
const projectNodeById = {};
let lbImgs = [], lbI = 0;
function openImgLb(imgs, i) {
  lbImgs = imgs; lbI = i;
  lbImg.src = lbImgs[lbI];
  lbCtr.textContent = `${lbI + 1} / ${lbImgs.length}`;
  lightbox.classList.add('open');
}
function lbStep(d) {
  lbI = (lbI + d + lbImgs.length) % lbImgs.length;
  lbImg.src = lbImgs[lbI];
  lbCtr.textContent = `${lbI + 1} / ${lbImgs.length}`;
}
document.getElementById('lb-close').onclick = () => lightbox.classList.remove('open');
document.getElementById('lb-prev').onclick  = () => lbStep(-1);
document.getElementById('lb-next').onclick  = () => lbStep(1);
lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });

const textLb   = document.getElementById('text-lightbox');
const tlbTitle = document.getElementById('tlb-title');
const tlbBody  = document.getElementById('tlb-body');
function openTxtLb(title, body) { tlbTitle.textContent = title; tlbBody.textContent = body; textLb.classList.add('open'); }
document.getElementById('tlb-close').onclick = () => textLb.classList.remove('open');
textLb.addEventListener('click', e => { if (e.target === textLb) textLb.classList.remove('open'); });

function openProjectLb(projectId) {
  const data = projectDataById[projectId];
  if (!data) return;
  plbTitle.textContent = data.project.title;
  plbTabs.innerHTML = '';
  plbBody.innerHTML = '';

  function appendDetails(target) {
    if (!data.hasDetail) return;
    const d = data.detail;
    [
      d.year && ['Year', d.year],
      d.role && ['Role', d.role],
      d.timeline && ['Timeline', d.timeline],
      d.tools?.length && ['Tools', d.tools.join(', ')],
    ].filter(Boolean).forEach(([label, value]) => {
      const row = el('div', 'plb-detail-row');
      row.appendChild(el('div', 'plb-detail-label', label));
      row.appendChild(el('div', 'plb-detail-value', value));
      target.appendChild(row);
    });
    if (Array.isArray(d.links) && d.links.length) {
      const row = el('div', 'plb-detail-row');
      row.appendChild(el('div', 'plb-detail-label', 'Links'));
      d.links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'plb-link';
        a.textContent = link.label;
        row.appendChild(a);
        row.appendChild(document.createElement('br'));
      });
      target.appendChild(row);
    }
  }

  if (!IS_MOBILE) {
    plbTabs.style.display = 'none';
    const split = el('div', 'plb-split');
    const left = el('div', 'plb-col plb-col-images');
    const right = el('div', 'plb-col plb-col-text');

    if (data.images.length) {
      const g = el('div', 'plb-gallery');
      data.images.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `${data.project.title} image ${i + 1}`;
        img.loading = 'lazy';
        img.addEventListener('click', e => { e.stopPropagation(); openImgLb(data.images, i); });
        g.appendChild(img);
      });
      left.appendChild(g);
    }

    if (data.texts.length) {
      data.texts.forEach(t => {
        const block = el('div', 'plb-text-block');
        block.appendChild(el('div', 'plb-text-title', t.label));
        block.appendChild(el('div', 'plb-text-body', t.body));
        right.appendChild(block);
      });
    }

    appendDetails(right);

    if (data.modelSrc) {
      const btn = document.createElement('button');
      btn.className = 'plb-tab active';
      btn.textContent = 'Open 3D Model';
      btn.addEventListener('click', () => openModelLb(data.modelSrc));
      right.appendChild(btn);
    }

    split.appendChild(left);
    split.appendChild(right);
    plbBody.appendChild(split);
    projectLb.classList.add('open');
    return;
  }

  plbTabs.style.display = '';

  const tabs = [];
  if (data.images.length) tabs.push('Images');
  if (data.texts.length) tabs.push('Texts');
  if (data.hasDetail) tabs.push('Details');
  if (data.modelSrc) tabs.push('Model');
  if (!tabs.length) tabs.push('Overview');

  function renderTab(tab) {
    plbBody.innerHTML = '';
    if (tab === 'Images') {
      const g = el('div', 'plb-gallery');
      data.images.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `${data.project.title} image ${i + 1}`;
        img.loading = 'lazy';
        img.addEventListener('click', e => { e.stopPropagation(); openImgLb(data.images, i); });
        g.appendChild(img);
      });
      plbBody.appendChild(g);
      return;
    }
    if (tab === 'Texts') {
      data.texts.forEach(t => {
        const block = el('div', 'plb-text-block');
        block.appendChild(el('div', 'plb-text-title', t.label));
        block.appendChild(el('div', 'plb-text-body', t.body));
        plbBody.appendChild(block);
      });
      return;
    }
    if (tab === 'Details') {
      appendDetails(plbBody);
      return;
    }
    if (tab === 'Model') {
      const btn = document.createElement('button');
      btn.className = 'plb-tab active';
      btn.textContent = 'Open 3D Model';
      btn.addEventListener('click', () => openModelLb(data.modelSrc));
      plbBody.appendChild(btn);
      return;
    }
    plbBody.textContent = 'No additional content.';
  }

  tabs.forEach((tab, i) => {
    const b = el('button', 'plb-tab', tab);
    b.type = 'button';
    if (i === 0) b.classList.add('active');
    b.addEventListener('click', () => {
      [...plbTabs.querySelectorAll('.plb-tab')].forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderTab(tab);
    });
    plbTabs.appendChild(b);
  });

  renderTab(tabs[0]);
  projectLb.classList.add('open');
}

document.getElementById('plb-close').onclick = () => projectLb.classList.remove('open');
projectLb.addEventListener('click', e => { if (e.target === projectLb) projectLb.classList.remove('open'); });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    lightbox.classList.remove('open');
    textLb.classList.remove('open');
    projectLb.classList.remove('open');
    closeModelLb();
    document.getElementById('impressum-lightbox')?.classList.remove('open');
  }
  if (lightbox.classList.contains('open')) {
    if (e.key === 'ArrowLeft')  lbStep(-1);
    if (e.key === 'ArrowRight') lbStep(1);
  }
});

// ─────────────────────────────────────────────
// DOM helpers
// ─────────────────────────────────────────────
function el(tag, cls = '', txt = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt) e.textContent = txt;
  return e;
}
// Batch cacheDims — all nodes placed synchronously get their dims cached in one RAF
let _dimQueue = [], _dimRaf = false;
function queueCacheDims(node) {
  _dimQueue.push(node);
  if (!_dimRaf) {
    _dimRaf = true;
    requestAnimationFrame(() => {
      _dimQueue.forEach(cacheDims);
      _dimQueue = []; _dimRaf = false;
    });
  }
}

// Place node top-left corner at canvas (x, y)
function place(node, x, y) {
  node.style.left = Math.round(x) + 'px';
  node.style.top  = Math.round(y) + 'px';
  canvasRoot.appendChild(node);
  queueCacheDims(node);
}
// Place node so its centre is at canvas (cx, cy)
function placeCentered(node, cx, cy, w, h) {
  place(node, cx - w / 2, cy - h / 2);
}

// Wrap a node element with a top bar (drag handle) + resize dot.
// Returns { nodeEl, content } where content is where the node's body goes.
// label: short string shown in the bar  clusterId: for curve redraw
function makeNode(cls, label, clusterId, w, h, { resizable = true, aspect = null } = {}) {
  const nodeEl  = el('div', `node ${cls}`);
  nodeEl.style.width  = w + 'px';
  if (h) nodeEl.style.height = h + 'px';
  nodeEl._clusterId = clusterId;

  const bar = el('div', 'node-bar');
  bar.appendChild(el('span', 'node-bar-label', label));
  nodeEl.appendChild(bar);

  const content = el('div', 'node-content');
  nodeEl.appendChild(content);

  const resizeHandle = resizable ? el('div', 'node-resize') : null;
  if (resizeHandle) nodeEl.appendChild(resizeHandle);

  // Per-node drag via bar — suppresses click if mouse moved
  bar.addEventListener('mousedown', e => {
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startL = parseInt(nodeEl.style.left), startT = parseInt(nodeEl.style.top);
    let moved = false;
    function onMove(e) {
      if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 4) moved = true;
      nodeEl.style.left = Math.round(startL + (e.clientX - startX) / zoom) + 'px';
      nodeEl.style.top  = Math.round(startT + (e.clientY - startY) / zoom) + 'px';
      redrawClusterCurves();
      redrawLines();
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',  onUp);
      if (moved) nodeEl.addEventListener('click', e => e.stopPropagation(), { once: true, capture: true });
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',  onUp);
  });

  // Resize via bottom-right dot
  if (!resizeHandle) return { nodeEl, content };
  resizeHandle.addEventListener('mousedown', e => {
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startW = nodeEl.offsetWidth, startH = nodeEl.offsetHeight;
    let moved = false;
    function onMove(e) {
      if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 4) moved = true;
      const newW = Math.max(80, startW + (e.clientX - startX) / zoom);
      const ar = aspect ?? nodeEl._aspect ?? null;
      const newH = ar ? newW * ar : Math.max(40, startH + (e.clientY - startY) / zoom);
      nodeEl.style.width  = Math.round(newW) + 'px';
      nodeEl.style.height = Math.round(newH) + 'px';
      nodeEl._cw = Math.round(newW); nodeEl._ch = Math.round(newH);
      redrawClusterCurves();
      if (nodeEl._refreshText) nodeEl._refreshText();
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',  onUp);
      if (moved) nodeEl.addEventListener('click', e => e.stopPropagation(), { once: true, capture: true });
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',  onUp);
  });

  return { nodeEl, content };
}

// ─────────────────────────────────────────────
// Cluster bezier curves (inside canvas, scale with nodes)
// ─────────────────────────────────────────────
function convexHull(pts) {
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

function catmullPath(hull) {
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

// Read and cache an element's pixel dimensions — avoids repeated offsetWidth/Height reads
function cacheDims(e) {
  e._cw = e.offsetWidth;
  e._ch = e.offsetHeight;
}

function redrawClusterCurves() {
  if (!Object.keys(clusterNodes).length) return;
  const PAD = 18;
  const ids = Object.keys(clusterNodes);

  // Ensure we have one <path> per cluster, creating or reusing
  while (clusterSvg.children.length < ids.length) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'rgba(255,255,255,0.06)');
    p.setAttribute('stroke-width', '1');
    clusterSvg.appendChild(p);
  }
  while (clusterSvg.children.length > ids.length) {
    clusterSvg.removeChild(clusterSvg.lastChild);
  }

  ids.forEach((id, i) => {
    const c = clusterNodes[id];
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

// ─────────────────────────────────────────────
// Build clusters
// ─────────────────────────────────────────────

let threeCache = null;
async function loadThree() {
  if (threeCache) return threeCache;
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  threeCache = { THREE, GLTFLoader, OrbitControls };
  return threeCache;
}

// Shared model lightbox — one persistent Three.js renderer, recreated only when needed
const modelLightbox = document.getElementById('model-lightbox');
const mlbCanvasWrap = document.getElementById('mlb-canvas-wrap');
document.getElementById('mlb-close').onclick = closeModelLb;
modelLightbox.addEventListener('click', e => { if (e.target === modelLightbox) closeModelLb(); });

let mlbRenderer = null, mlbControls = null, mlbRaf = null;

function closeModelLb() {
  modelLightbox.classList.remove('open');
  // Stop the RAF loop — no point rendering a hidden lightbox
  if (mlbRaf) { cancelAnimationFrame(mlbRaf); mlbRaf = null; }
}

function disposeMlb() {
  if (mlbRaf) { cancelAnimationFrame(mlbRaf); mlbRaf = null; }
  if (mlbRenderer) { mlbRenderer.dispose(); mlbRenderer = null; }
  mlbControls = null;
  mlbCanvasWrap.innerHTML = '';
}

async function openModelLb(src) {
  // Dispose previous session cleanly before creating a new one
  disposeMlb();
  modelLightbox.classList.add('open');

  const { THREE, GLTFLoader, OrbitControls } = await loadThree();
  const W = mlbCanvasWrap.offsetWidth  || 600;
  const H = mlbCanvasWrap.offsetHeight || 600;

  const canvas = document.createElement('canvas');
  mlbCanvasWrap.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(W, H);
  renderer.setClearColor(0x080808, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  mlbRenderer = renderer;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 1000);
  camera.position.set(0, 0, 3);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const d1 = new THREE.DirectionalLight(0xffffff, 2.5); d1.position.set(3, 4, 3); scene.add(d1);
  const d2 = new THREE.DirectionalLight(0xffffff, 1.0); d2.position.set(-3, -2, -2); scene.add(d2);

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = true; controls.enablePan = false;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.8;
  controls.enableDamping = true; controls.dampingFactor = 0.07;
  mlbControls = controls;

  new GLTFLoader().load(src, gltf => {
    const obj = gltf.scene;
    const box = new THREE.Box3().setFromObject(obj);
    obj.position.sub(box.getCenter(new THREE.Vector3()));
    obj.scale.multiplyScalar(2.2 / box.getSize(new THREE.Vector3()).length());
    scene.add(obj);
  }, undefined, err => console.warn('GLB load error', src, err));

  function render() { mlbRaf = requestAnimationFrame(render); controls.update(); renderer.render(scene, camera); }
  render();
}

function buildModelNode(p, modelPath, rects, slotIndex, totalSlots) {
  if (!modelPath) return;
  const isAbsolute = /^https?:\/\//i.test(modelPath);
  const src = isAbsolute
    ? modelPath
    : modelPath.startsWith('media/')
      ? modelPath
      : `media/projects/${p.id}/${modelPath}`;
  const sat  = satPos(p, slotIndex, 'model', totalSlots);
  const W = SZ.model.w, H = SZ.model.h;
  const BAR_H = 20;
  const CW = W, CH = H - BAR_H;

  const { nodeEl, content } = makeNode('node-model', '3d model', p.id, W, H, { aspect: 3/4 });

  const hint = el('div', 'model-hint', 'click to open');
  content.appendChild(hint);

  // Click anywhere on the node (except bar) → open lightbox
  nodeEl.addEventListener('click', e => {
    if (e.target.closest('.node-bar')) return;
    e.stopPropagation();
    openModelLb(src);
  });

  placeCentered(nodeEl, sat.x, sat.y, W, H);
  rects.push({ x: sat.x - W/2, y: sat.y - H/2, w: W, h: H });
  clusterNodes[p.id].satellites.push({ el: nodeEl, ox: sat.x - p.x, oy: sat.y - p.y, w: W, h: H });

  loadThree().then(({ THREE, GLTFLoader, OrbitControls }) => {
    requestAnimationFrame(() => {
      const CW2 = content.offsetWidth  || CW;
      const CH2 = content.offsetHeight || CH;

      const canvas = document.createElement('canvas');
      content.insertBefore(canvas, hint);

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(CW2, CH2);
      canvas.style.position = 'absolute';
      canvas.style.top = '0'; canvas.style.left = '0';
      renderer.setClearColor(0x0a0a0a, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, CW2 / CH2, 0.01, 1000);
      camera.position.set(0, 0, 3);

      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      const d1 = new THREE.DirectionalLight(0xffffff, 2.5); d1.position.set(3, 4, 3); scene.add(d1);
      const d2 = new THREE.DirectionalLight(0xffffff, 1.0); d2.position.set(-3, -2, -2); scene.add(d2);

      const controls = new OrbitControls(camera, canvas);
      controls.enableZoom = false; controls.enablePan = false;
      controls.autoRotate = true; controls.autoRotateSpeed = 1.2;
      controls.enableDamping = true; controls.dampingFactor = 0.08;

      new GLTFLoader().load(src, gltf => {
        const obj = gltf.scene;
        const box = new THREE.Box3().setFromObject(obj);
        obj.position.sub(box.getCenter(new THREE.Vector3()));
        obj.scale.multiplyScalar(2.2 / box.getSize(new THREE.Vector3()).length());
        scene.add(obj);
      }, undefined, err => console.warn('GLB load error', src, err));

      // Pause RAF when node is scrolled out of view, resume when visible
      let raf = null;
      function startRender() {
        if (raf) return;
        function loop() { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); }
        loop();
      }
      function stopRender() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
      }

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) startRender(); else stopRender();
      }, { threshold: 0 });
      observer.observe(nodeEl);
    });
  });
}

function buildImageNode(p, images, rects, slotIndex, totalSlots) {
  if (!images?.length) return;
  const sat  = satPos(p, slotIndex, 'image', totalSlots);
  const srcs = images; // paths already resolved by caller (full .webp)
  const thumbSrc = src => src.replace(/(\.\w+)$/, '-small.webp');
  const { nodeEl, content } = makeNode('node-image', 'images', p.id, SZ.image.w, SZ.image.h, { aspect: null });
  const stack = el('div', 'image-stack');
  const img   = document.createElement('img');
  img.src = thumbSrc(srcs[0]); img.alt = ''; img.loading = 'lazy';
  let currentIndex = 0;

  function showImage(idx) {
    currentIndex = idx;
    img.src = thumbSrc(srcs[idx]);
  }

  // Once the first image loads, snap the node to its natural aspect ratio
  img.addEventListener('load', () => {
    if (img.naturalWidth && img.naturalHeight) {
      const ar = img.naturalHeight / img.naturalWidth;
      nodeEl._aspect = ar;
      const newH = Math.round(nodeEl.offsetWidth * ar);
      nodeEl.style.height = newH + 'px';
      nodeEl._ch = newH;
      redrawClusterCurves();
    }
  }, { once: true });

  stack.appendChild(img);
  if (srcs.length > 1) stack.appendChild(el('div', 'image-count', String(srcs.length)));
  content.appendChild(stack);
  nodeEl.addEventListener('click', e => { e.stopPropagation(); openImgLb(srcs, currentIndex); });

  // Register per-image search keys — each maps to this node with its index
  srcs.forEach((src, idx) => {
    const fileName = src.split('/').pop().replace(/\.\w+$/, '');
    const key = `${p.id}::image::${fileName}`;
    nodePositions[key] = { el: nodeEl, imgIndex: idx, showImage };
  });

  placeCentered(nodeEl, sat.x, sat.y, SZ.image.w, SZ.image.h);
  rects.push({ x: sat.x - SZ.image.w / 2, y: sat.y - SZ.image.h / 2, w: SZ.image.w, h: SZ.image.h });
  clusterNodes[p.id].satellites.push({ el: nodeEl, ox: sat.x - p.x, oy: sat.y - p.y, w: SZ.image.w, h: SZ.image.h });
}

function buildTextNode(p, label, fullText, rects, slotIndex, totalSlots) {
  const sat = satPos(p, slotIndex, 'text', totalSlots);
  const { nodeEl, content } = makeNode('node-text', label, p.id, SZ.text.w, SZ.text.h, { aspect: 4/3 });
  const body   = el('div', 'text-body');
  const toggle = el('span', 'text-toggle');
  content.appendChild(body);
  content.appendChild(toggle);

  // Dynamically show full text or truncated depending on available content height
  function refreshText() {
    const BAR_H = 20, PAD = 26; // bar + vertical padding
    const available = nodeEl.offsetHeight - BAR_H - PAD;
    body.textContent = fullText;
    const lineH = parseFloat(getComputedStyle(body).lineHeight) || 18;
    const fits  = body.scrollHeight <= available + lineH; // one line tolerance
    if (fits) {
      body.textContent = fullText;
      toggle.textContent = '';
      toggle.style.display = 'none';
    } else {
      // Binary-search the character count that fits
      let lo = 0, hi = fullText.length;
      while (hi - lo > 4) {
        const mid = (lo + hi) >> 1;
        body.textContent = fullText.slice(0, mid) + '…';
        if (body.scrollHeight <= available) lo = mid; else hi = mid;
      }
      body.textContent = fullText.slice(0, lo) + '…';
      toggle.style.display = '';
      toggle.textContent = 'read more';
    }
  }

  // Debounce refreshText — only runs after resize drag settles
  let refreshTimer = null;
  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshText, 16);
  }

  nodeEl.style.cursor = 'pointer';
  nodeEl.addEventListener('click', e => { e.stopPropagation(); openTxtLb(label, fullText); });
  nodeEl._refreshText = scheduleRefresh;
  requestAnimationFrame(refreshText);

  // Register for per-node search lines
  const nodeKey = `${p.id}::${label.toLowerCase().replace(/\s+/g, '-')}`;
  nodeEl._nodeKey = nodeKey;
  nodePositions[nodeKey] = { el: nodeEl };

  placeCentered(nodeEl, sat.x, sat.y, SZ.text.w, SZ.text.h);
  rects.push({ x: sat.x - SZ.text.w / 2, y: sat.y - SZ.text.h / 2, w: SZ.text.w, h: SZ.text.h });
  clusterNodes[p.id].satellites.push({ el: nodeEl, ox: sat.x - p.x, oy: sat.y - p.y, w: SZ.text.w, h: SZ.text.h });
}

function buildDetailNode(p, detail, rects, slotIndex, totalSlots) {
  const sat   = satPos(p, slotIndex, 'detail', totalSlots);
  const tools = Array.isArray(detail.tools) ? detail.tools : [];
  const links = Array.isArray(detail.links) ? detail.links : [];
  const { nodeEl, content } = makeNode('node-detail', 'detail', p.id, SZ.detail.w, null, { resizable: false });
  [
    detail.year     && ['Year',     detail.year],
    detail.role     && ['Role',     detail.role],
    detail.timeline && ['Timeline', detail.timeline],
    tools.length    && ['Tools',    tools.join(', ')],
  ].filter(Boolean).forEach(([lbl, val]) => {
    const row = el('div', 'detail-row');
    row.appendChild(el('div', 'detail-label', lbl));
    row.appendChild(el('div', 'detail-value', val));
    content.appendChild(row);
  });
  if (links.length) {
    const row = el('div', 'detail-row');
    row.appendChild(el('div', 'detail-label', 'Links'));
    links.forEach(lnk => {
      const a = document.createElement('a');
      a.href = lnk.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.className = 'detail-link'; a.textContent = lnk.label;
      a.addEventListener('click', e => e.stopPropagation());
      row.appendChild(a);
    });
    content.appendChild(row);
  }
  if (content.children.length) {
    placeCentered(nodeEl, sat.x, sat.y, SZ.detail.w, SZ.detail.h);
    rects.push({ x: sat.x - SZ.detail.w / 2, y: sat.y - SZ.detail.h / 2, w: SZ.detail.w, h: SZ.detail.h });
    clusterNodes[p.id].satellites.push({ el: nodeEl, ox: sat.x - p.x, oy: sat.y - p.y, w: SZ.detail.w, h: SZ.detail.h });
  }
}

function buildProjectNode(p, detail, texts, images) {
  const W = SZ.project.w;
  const H = SZ.project.h;
  const { nodeEl, content } = makeNode('node-image node-project', p.title, p.id, W, H, { resizable: false });
  const stack = el('div', 'image-stack');
  const img = document.createElement('img');
  const imageSrcs = images.length ? images : ['media/logo/joel-logo.webp'];
  img.src = imageSrcs[0];
  img.alt = `${p.title} preview`;
  img.loading = 'lazy';
  stack.appendChild(img);
  if (imageSrcs.length > 1) stack.appendChild(el('div', 'image-count', String(imageSrcs.length)));
  content.appendChild(stack);

  function showImage(idx) {
    const i = Math.max(0, Math.min(idx, imageSrcs.length - 1));
    img.src = imageSrcs[i];
  }

  nodeEl.addEventListener('click', e => {
    if (e.target.closest('.node-bar')) return;
    e.stopPropagation();
    openProjectLb(p.id);
  });

  placeCentered(nodeEl, p.x, p.y, W, H);
  nodePositions[`${p.id}::project`] = { el: nodeEl, showImage, imgIndex: 0 };
  projectNodeById[p.id] = nodeEl;

  const modelSrc = detail.model
    ? (/^https?:\/\//i.test(detail.model)
      ? detail.model
      : detail.model.startsWith('media/')
        ? detail.model
        : `${detail._aboutBase ? 'media/about' : `media/projects/${p.id}`}/${detail.model}`)
    : null;

  const hasDetail = !!(detail.year || detail.role || detail.timeline || detail.tools?.length || detail.links?.length);
  projectDataById[p.id] = {
    project: p,
    detail,
    texts,
    images: imageSrcs,
    hasDetail,
    modelSrc,
  };
}

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
    const cleanTexts = textBodies.filter(t => t.body);
    const resolvedImages = (detail.images || []).map(i => i.startsWith('media/') ? i : `${baseDir}/${i}`);
    buildProjectNode(p, detail, cleanTexts, resolvedImages);
  }).catch(console.error);
});

// Single-node layout does not draw cluster hulls.

// ─────────────────────────────────────────────
// Search lines — viewport-space, from canvas-centre screen pos
// to title node screen pos
// ─────────────────────────────────────────────

// Canvas px → screen px
function c2s(cx, cy) {
  return { x: pan.x + cx * zoom, y: pan.y + cy * zoom };
}

// Returns the point on the edge of an axis-aligned rect closest to target
function rectEdgePoint(rx, ry, rw, rh, tx, ty) {
  const cx = rx + rw / 2, cy = ry + rh / 2;
  const dx = tx - cx, dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const scaleX = Math.abs(dx) > 0 ? (rw / 2) / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0 ? (rh / 2) / Math.abs(dy) : Infinity;
  const s = Math.min(scaleX, scaleY);
  return { x: cx + dx * s, y: cy + dy * s };
}

function redrawLines() {
  lineSvg.innerHTML = '';
  const keys = Object.keys(lineScores);
  syncSendButtonState();
  if (!keys.length) return;

  const inputRect = inputWrap.getBoundingClientRect();
  const LINE_SOURCE_GAP = 12;
  const srcPt = {
    x: inputRect.left + inputRect.width / 2,
    y: inputRect.top - LINE_SOURCE_GAP,
  };
  const srcX = srcPt.x, srcY = srcPt.y;

  keys.forEach(nodeKey => {
    const score = lineScores[nodeKey];
    const np = nodePositions[nodeKey]; if (!np?.el) return;
    const e = np.el;

    const cx = parseInt(e.style.left) || 0;
    const cy = parseInt(e.style.top)  || 0;
    const cw = e._cw || e.offsetWidth  || 60;
    const ch = e._ch || e.offsetHeight || 30;

    const tl = c2s(cx, cy);
    const sw = cw * zoom, sh = ch * zoom;
    const dst = rectEdgePoint(tl.x, tl.y, sw, sh, srcX, srcY);

    const dx = dst.x - srcX;
    const dy = srcY - dst.y;
    const upwardBend = Math.max(Math.abs(dy) * 0.35, 90);
    const lateral = dx * 0.35;
    const cp1x = srcX + lateral * 0.2;
    const cp1y = srcY - upwardBend;
    const cp2x = dst.x - lateral * 0.25;
    const cp2y = dst.y - upwardBend * 0.35;

    // Power curve: exaggerates gap between top match and weaker ones
    const s = Math.pow(score, 1.8);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${srcX},${srcY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${dst.x},${dst.y}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'white');
    path.setAttribute('stroke-width',   (s * 3.5).toFixed(2));
    path.setAttribute('stroke-opacity', (s * 0.85).toFixed(2));
    path.setAttribute('stroke-linecap', 'round');
    lineSvg.appendChild(path);
  });
}

function clearLines() {
  // Reset any image nodes that were swapped by search back to their first image
  for (const [key, np] of Object.entries(nodePositions)) {
    if (key.includes('::image::') && np.showImage) np.showImage(0);
  }
  lineScores = {}; lineSvg.innerHTML = '';
  searchActive = false;
  syncSendButtonState();
  const noResults = document.getElementById('no-results');
  if (noResults) noResults.classList.remove('visible');
}

function animateLines() {
  [...lineSvg.querySelectorAll('path')].forEach((path, i) => {
    const len = path.getTotalLength();
    const targetOpacity = path.getAttribute('stroke-opacity');

    // Start hidden and drawn-in from source
    path.setAttribute('stroke-opacity', '0');
    path.style.strokeDasharray  = len;
    path.style.strokeDashoffset = len;

    // Stagger each line slightly so they don't all appear at once
    const delay = i * 40;
    const duration = 420 + len * 0.3;

    let start = null;
    function tick(ts) {
      if (!start) start = ts + delay;
      const elapsed = ts - start;
      if (elapsed < 0) { requestAnimationFrame(tick); return; }
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const e = 1 - Math.pow(1 - t, 3);
      path.style.strokeDashoffset = len * (1 - e);
      path.setAttribute('stroke-opacity', (parseFloat(targetOpacity) * Math.min(t * 3, 1)).toFixed(3));
      if (t < 1) requestAnimationFrame(tick);
      else {
        path.style.strokeDasharray  = '';
        path.style.strokeDashoffset = '';
      }
    }
    requestAnimationFrame(tick);
  });
}

// ─────────────────────────────────────────────
// Embeddings
// ─────────────────────────────────────────────
let pipelineFn = null;
let embedder = null, nodeEmbeddings = {};

async function ensureTransformers() {
  if (pipelineFn) return true;
  try {
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2/dist/transformers.min.js');
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    pipelineFn = pipeline;
    return true;
  } catch (err) {
    console.error('Failed to load transformers runtime', err);
    return false;
  }
}

// Extract flat Float32Array from whatever the pipeline returns
function extractVec(out) {
  // v3 Tensor: out is Tensor with .data (Float32Array) and .dims
  // v2: out.data is Float32Array directly
  // Both cases: grab .data if it exists, else assume out itself is array-like
  const raw = out?.data ?? out;
  return raw instanceof Float32Array ? raw : new Float32Array(raw);
}

async function init() {
  const runtimeReady = await ensureTransformers();
  keywordList = await fetchKeywords();
  if (!runtimeReady) {
    loadDot.style.display = 'none';
    inputEl.placeholder = 'search unavailable';
    return;
  }
  loadDot.style.display = 'block';
  inputEl.placeholder = 'archive agent loading…';
  const stored = await fetch('embeddings.json').then(r => r.json()).catch(() => null);
  if (stored) {
    for (const [key, vec] of Object.entries(stored))
      nodeEmbeddings[key] = new Float32Array(vec);
  }
  embedder = await pipelineFn('feature-extraction', 'Xenova/bge-base-en-v1.5', { dtype: 'q8' });
  console.log(`Embeddings ready: ${Object.keys(nodeEmbeddings).length} nodes`);
  loadDot.style.display = 'none';
  const hints = ['search', 'search', 'search', "you may ask what i'm proud of"];
  inputEl.placeholder = hints[Math.floor(Math.random() * hints.length)];
  inputEl.disabled = false; sendBtn.disabled = false; inputEl.focus();
  refreshSuggestion();
}

function cosSim(a, b) {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  if (na === 0 || nb === 0) return 0;
  return d / (Math.sqrt(na) * Math.sqrt(nb));
}

async function runQuery(t) {
  if (!t.trim()) { clearLines(); return; }
  searchActive = true;
  syncSendButtonState();
  const out = await embedder(t, { pooling: 'mean', normalize: true });
  const q   = extractVec(out);
  const raw = {};
  for (const [nodeKey, vec] of Object.entries(nodeEmbeddings)) {
    raw[nodeKey] = Math.max(0, cosSim(q, vec));
  }

  const byProject = {};
  for (const [nodeKey, score] of Object.entries(raw)) {
    const projectId = nodeKey.split('::')[0];
    if (!projectNodeById[projectId]) continue;
    byProject[projectId] = Math.max(byProject[projectId] || 0, score);
  }

  const max = Math.max(...Object.values(byProject), 0);
  lineScores = {};
  const noResults = document.getElementById('no-results');
  if (max >= 0.25) {
    for (const [projectId, score] of Object.entries(byProject)) {
      const norm = score / max;
      if (norm >= 0.4) {
        lineScores[`${projectId}::project`] = norm;
      }
    }
    noResults.classList.remove('visible');
  } else {
    noResults.classList.add('visible');
  }
  redrawLines(); animateLines();
}

sendBtn.addEventListener('click', () => {
  if (searchActive) {
    inputEl.value = '';
    refreshSuggestion();
    clearLines();
    return;
  }
  runQuery(inputEl.value);
});
inputEl.addEventListener('keydown', e => {
  if (e.key === 'Shift') {
    if (acceptSuggestion()) e.preventDefault();
    return;
  }
  if (e.key === 'Enter') {
    if (acceptSuggestion()) {
      e.preventDefault();
      return;
    }
    runQuery(inputEl.value);
  }
});
inputEl.addEventListener('input', () => {
  refreshSuggestion();
  if (!inputEl.value) clearLines();
});

init().catch(console.error);
syncSendButtonState();
buildFooter();

} // end desktop-only block
