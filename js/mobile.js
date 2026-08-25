// ─────────────────────────────────────────────
// Mobile accordion view.
// Also exports buildAccordionView so the desktop
// list-view can reuse the same layout.
// ─────────────────────────────────────────────

import PROJECTS           from '../projects.js';
import { stripMd, fetchMdBody, fetchDetail, toThumb } from './utils.js';
import { buildDesktopProjectLayout, openImgLb, createVideoWrap } from './lightbox.js';

// Row layout, left to right: title (left-bound) — hero image — year
// (right-bound). The image sits in a fixed-width zone between the two and
// is the only thing that grows on cursor proximity (see initRowGrowth) —
// title and year stay put at their bound edges.

async function loadMobileItem(p, content) {
  const [mdText, media] = await Promise.all([
    fetchMdBody(p.id),
    (async () => {
      const detail   = await fetchDetail(p.id);
      const base     = `media/projects/${p.id}/`;
      const isAbs    = u => /^https?:\/\//i.test(u) || u.startsWith('media/');
      const resolve  = u => isAbs(u) ? u : base + u;
      const imgSrcs  = (detail.images || []).map(resolve);
      const videoSrcs = (detail.videos || []).map(resolve);
      const posterSrc = detail.poster ? resolve(detail.poster) : null;
      return { imgSrcs, videoSrcs, posterSrc, detail };
    })(),
  ]);

  const imgSrcs   = media.imgSrcs   || [];
  const videoSrcs = media.videoSrcs || [];
  const posterSrc = media.posterSrc || null;
  const detail    = media.detail    || {};
  const altBase   = `${p.title} — image`;

  function makeImg(src, idx) {
    const img = document.createElement('img');
    img.src = src; img.alt = imgSrcs.length > 1 ? `${altBase} ${idx + 1}` : altBase;
    img.className = 'm-img'; img.loading = 'lazy';
    img.addEventListener('click', () => openImgLb(imgSrcs, idx));
    return img;
  }

  // Videos (above first image)
  videoSrcs.forEach(src => {
    const wrap = createVideoWrap(src, { silent: detail.silentVideos, poster: posterSrc });
    wrap.classList.add('m-video');
    content.appendChild(wrap);
  });

  const deferFirstImage = !!detail.firstImageAfterText;

  // First image (unless deferred to after info)
  if (imgSrcs[0] && !deferFirstImage) content.appendChild(makeImg(imgSrcs[0], 0));

  // Text
  if (mdText) {
    const textEl = document.createElement('div');
    textEl.className = 'm-text'; textEl.textContent = mdText;
    content.appendChild(textEl);
  }

  // Info rows — after text, before remaining images
  const infoRows = [
    detail.year     && ['Year',     detail.year],
    detail.role     && ['Role',     detail.role],
    detail.timeline && ['Timeline', detail.timeline],
    detail.tools?.length && ['Tools', detail.tools.join(', ')],
  ].filter(Boolean);

  if (infoRows.length || Array.isArray(detail.links) && detail.links.length) {
    const info = document.createElement('div'); info.className = 'm-info';
    infoRows.forEach(([label, value]) => {
      const row = document.createElement('div'); row.className = 'm-info-row';
      const lbl = document.createElement('div'); lbl.className = 'm-info-label'; lbl.textContent = label;
      const val = document.createElement('div'); val.className = 'm-info-value'; val.textContent = value;
      row.appendChild(lbl); row.appendChild(val); info.appendChild(row);
    });
    if (Array.isArray(detail.links) && detail.links.length) {
      const row = document.createElement('div'); row.className = 'm-info-row';
      const lbl = document.createElement('div'); lbl.className = 'm-info-label'; lbl.textContent = 'Links';
      row.appendChild(lbl);
      detail.links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.className = 'm-link'; a.textContent = link.label;
        row.appendChild(a);
      });
      info.appendChild(row);
    }
    content.appendChild(info);
  }

  // First image (placed after info when deferred)
  if (imgSrcs[0] && deferFirstImage) content.appendChild(makeImg(imgSrcs[0], 0));

  // Rest of images
  imgSrcs.slice(1).forEach((src, i) => content.appendChild(makeImg(src, i + 1)));
}

export async function buildAccordionView(containerId, { desktop = false } = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const nonAbout = PROJECTS.filter(p => p.id !== 'about');
  const about    = PROJECTS.find(p => p.id === 'about');

  const isAbsolute = u => /^https?:\/\//i.test(u) || u.startsWith('media/');

  async function rowInfo(p) {
    const detail = await fetchDetail(p.id);
    const base   = `media/projects/${p.id}/`;
    const first  = detail.images?.[0];
    const thumb  = first ? toThumb(isAbsolute(first) ? first : base + first) : null;
    return { p, year: detail.year || '', thumb };
  }

  const withYears = await Promise.all(nonAbout.map(rowInfo));
  withYears.sort((a, b) => b.year.localeCompare(a.year));

  // On desktop the bio is reached through the top-bar "about" link, which
  // opens it in the project lightbox — so it gets no row here. Mobile has no
  // project lightbox, so there it stays the last row of the accordion.
  const bioRow = (!desktop && about) ? await rowInfo(about).then(r => ({ ...r, year: '' })) : null;
  const items = [...withYears, bioRow].filter(Boolean);

  for (const { p, year, thumb } of items) {
    const item    = document.createElement('div'); item.className = 'm-item';
    // Lets js/view-switch.js pair a row up with its canvas node when it
    // measures both ends of the node ⇄ list flight.
    item.dataset.id = p.id;
    const content = document.createElement('div');
    content.className = 'm-content';
    content.id        = `${containerId}-content-${p.id}`;

    const header = document.createElement('button');
    header.type      = 'button';
    header.className = 'm-header';

    const titleSpan  = document.createElement('span');
    titleSpan.className   = 'm-header-title';
    titleSpan.textContent = p.title;
    header.appendChild(titleSpan);

    if (thumb) {
      // Absolutely positioned + centered on .m-header itself (not a flex
      // sibling of title/year), so it sits at the true horizontal center of
      // the row regardless of title length or year width.
      const thumbImg = document.createElement('img');
      thumbImg.className = 'm-header-thumb';
      thumbImg.src = thumb; thumbImg.alt = ''; thumbImg.loading = 'lazy';
      header.appendChild(thumbImg);
    }

    const yearSpan = document.createElement('span');
    yearSpan.className   = 'm-header-year';
    yearSpan.textContent = year;
    header.appendChild(yearSpan);

    header.setAttribute('aria-controls', content.id);
    header.setAttribute('aria-expanded', 'false');

    header.addEventListener('click', () => {
      const isOpen = header.classList.contains('open');
      container.querySelectorAll('.m-header.open').forEach(h => {
        h.classList.remove('open'); h.setAttribute('aria-expanded', 'false');
      });
      container.querySelectorAll('.m-content.open').forEach(c => c.classList.remove('open'));
      if (!isOpen) {
        header.classList.add('open');
        // Snap back to base — proximity-grow is for closed rows only.
        header.style.removeProperty('--row-h');
        header.style.removeProperty('--thumb-w');
        header.style.removeProperty('--thumb-h');
        header.setAttribute('aria-expanded', 'true');
        content.classList.add('open');
        const scrollHost = document.getElementById(desktop ? 'desktop-list-view' : 'mobile-view');
        if (scrollHost) {
          const target = scrollHost.scrollTop + item.getBoundingClientRect().top - scrollHost.getBoundingClientRect().top;
          scrollHost.scrollTo({ top: target, behavior: 'smooth' });
        }
        if (!content.dataset.loaded) {
          content.dataset.loaded = 'true';
          if (desktop) {
            loadDesktopItem(p, content).catch(console.error);
          } else {
            loadMobileItem(p, content).catch(console.error);
          }
        }
      }
    });

    item.appendChild(header);
    item.appendChild(content);
    container.appendChild(item);
  }

  if (desktop) initRowGrowth(container);
}

// ── Row hover-proximity growth (desktop list view only) ────────────────────
// Rows nearer the cursor grow with a smoothstep falloff, easing back to base
// size as the mouse moves away or leaves. `container` persists across
// buildAccordionView() calls (only its children are rebuilt), so the
// mousemove/mouseleave listeners are bound once via `boundContainers`.
// Only the thumbnail grows — title and year stay static — and the growth
// range is intentionally modest (a quarter of what it once was) for a
// subtle effect rather than a dramatic one.
const ROW_BASE      = 76;  // px — matches --row-h default in style.css
const ROW_MAX       = 105; // px — fully grown, right under the cursor
const THUMB_BASE_W = 90, THUMB_BASE_H = 40;
const THUMB_MAX_W  = 190, THUMB_MAX_H = 76;
const ROW_INFLUENCE = 220; // px — vertical falloff radius

const boundContainers = new WeakSet();

function initRowGrowth(container) {
  if (boundContainers.has(container)) return;
  boundContainers.add(container);

  let mouseY = null, rafPending = false;

  function apply() {
    rafPending = false;
    if (mouseY == null) return;
    container.querySelectorAll('.m-header:not(.open)').forEach(h => {
      const rect = h.getBoundingClientRect();
      const cy   = rect.top + rect.height / 2;
      const dist = Math.abs(mouseY - cy);
      const t    = Math.max(0, 1 - dist / ROW_INFLUENCE);
      const growth = t * t * (3 - 2 * t); // smoothstep
      h.style.setProperty('--row-h',   (ROW_BASE     + (ROW_MAX     - ROW_BASE)     * growth).toFixed(1) + 'px');
      h.style.setProperty('--thumb-w', (THUMB_BASE_W + (THUMB_MAX_W - THUMB_BASE_W) * growth).toFixed(1) + 'px');
      h.style.setProperty('--thumb-h', (THUMB_BASE_H + (THUMB_MAX_H - THUMB_BASE_H) * growth).toFixed(1) + 'px');
    });
  }

  container.addEventListener('mousemove', e => {
    mouseY = e.clientY;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(apply);
  });

  container.addEventListener('mouseleave', () => {
    mouseY = null;
    container.querySelectorAll('.m-header').forEach(h => {
      h.style.removeProperty('--row-h');
      h.style.removeProperty('--thumb-w');
      h.style.removeProperty('--thumb-h');
    });
  });
}

async function loadDesktopItem(p, content) {
  const detail  = await fetchDetail(p.id);
  const base    = `media/projects/${p.id}/`;
  const isAbsolute = u => /^https?:\/\//i.test(u) || u.startsWith('media/');
  const resolve = u => isAbsolute(u) ? u : base + u;
  const images  = (detail.images || []).map(resolve);
  const videos  = (detail.videos || []).map(resolve);
  detail._resolvedVideos = videos;
  detail._resolvedPoster = detail.poster ? resolve(detail.poster) : null;
  const modelSrc = detail.model
    ? (/^https?:\/\//i.test(detail.model) || detail.model.startsWith('media/')
        ? detail.model : `${base}${detail.model}`)
    : null;

  const textDefs = Array.isArray(detail.texts) && detail.texts.length
    ? detail.texts : [{ file: 'description.md', label: p.title }];

  const texts = (await Promise.all(textDefs.map(async t => {
    try {
      const file = t.file || 'description.md';
      const raw  = await fetch(`${base}${file}`).then(r => r.ok ? r.text() : null);
      return raw ? { label: t.label || 'Overview', body: stripMd(raw) } : null;
    } catch { return null; }
  }))).filter(Boolean);

  buildDesktopProjectLayout(content, { project: p, detail, texts, images, modelSrc });
}

export function buildMobileView() {
  buildAccordionView('mobile-view');
  initMobileHeader();
}

function initMobileHeader() {
  const siteHeader = document.getElementById('site-header');
  const mobileView = document.getElementById('mobile-view');
  if (!siteHeader || !mobileView) return;

  // Move the header into the scroll container so it scrolls with the
  // content. No separate sticky bar needed — the open .m-header is itself
  // sticky.
  mobileView.insertBefore(siteHeader, mobileView.firstChild);
}
