// ─────────────────────────────────────────────
// Mobile accordion view.
// Also exports buildAccordionView so the desktop
// list-view can reuse the same layout.
// ─────────────────────────────────────────────

import PROJECTS           from '../projects.js';
import { stripMd, fetchMdBody, fetchDetail } from './utils.js';
import { buildDesktopProjectLayout, openImgLb, createVideoWrap } from './lightbox.js';

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

export function buildAccordionView(containerId, { desktop = false } = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const items = [
    ...PROJECTS.filter(p => p.id !== 'about'),
    PROJECTS.find(p => p.id === 'about'),
  ].filter(Boolean);

  for (const p of items) {
    const item    = document.createElement('div'); item.className = 'm-item';
    const content = document.createElement('div');
    content.className = 'm-content';
    content.id        = `${containerId}-content-${p.id}`;

    const header = document.createElement('button');
    header.type        = 'button';
    header.className   = 'm-header';
    header.textContent = p.title;
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
        header.setAttribute('aria-expanded', 'true');
        content.classList.add('open');
        const mv = document.getElementById('mobile-view');
        if (mv) mv.scrollTo({ top: item.offsetTop, behavior: 'smooth' });
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
  const siteHeader   = document.getElementById('site-header');
  const stickyHeader = document.getElementById('mobile-sticky-header');
  const mobileView   = document.getElementById('mobile-view');
  if (!siteHeader || !stickyHeader || !mobileView) return;

  // Move the header into the scroll container so it scrolls with the content.
  mobileView.insertBefore(siteHeader, mobileView.firstChild);

  // No separate sticky bar needed — the open .m-header is itself sticky.
}
