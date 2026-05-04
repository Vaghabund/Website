// ─────────────────────────────────────────────
// Mobile accordion view.
// Also exports buildAccordionView so the desktop
// list-view can reuse the same layout.
// ─────────────────────────────────────────────

import PROJECTS           from '../projects.js';
import { stripMd, fetchMdBody, fetchDetail } from './utils.js';

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
      const detail  = await fetchDetail(p.id);
      const base    = `media/projects/${p.id}/`;
      const imgSrcs = (detail.images || []).map(i => i.startsWith('media/') ? i : base + i);
      return { imgSrcs, detail };
    })(),
  ]);

  const imgSrcs = media.imgSrcs || [];
  const detail  = media.detail  || {};

  const split    = document.createElement('div'); split.className = 'm-split';
  const leftCol  = document.createElement('div'); leftCol.className  = 'm-col m-col-images';
  const rightCol = document.createElement('div'); rightCol.className = 'm-col m-col-text';

  const altBase = p.id === 'about' ? 'Profile photo of Joel Tenenberg' : `${p.title} — project image`;
  const gallery = document.createElement('div'); gallery.className = 'm-gallery';
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
    textEl.className   = 'm-text';
    textEl.textContent = mdText;
    rightCol.appendChild(textEl);
  }

  const infoRows = [
    detail.year     && ['Year',     detail.year],
    detail.role     && ['Role',     detail.role],
    detail.timeline && ['Timeline', detail.timeline],
    detail.tools?.length && ['Tools', detail.tools.join(', ')],
  ].filter(Boolean);

  if (infoRows.length || (Array.isArray(detail.links) && detail.links.length)) {
    const info = document.createElement('div'); info.className = 'm-info';

    infoRows.forEach(([label, value]) => {
      const row = document.createElement('div'); row.className = 'm-info-row';
      const lbl = document.createElement('div'); lbl.className = 'm-info-label'; lbl.textContent = label;
      const val = document.createElement('div'); val.className = 'm-info-value'; val.textContent = value;
      row.appendChild(lbl); row.appendChild(val);
      info.appendChild(row);
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

    rightCol.appendChild(info);
  }

  split.appendChild(leftCol);
  split.appendChild(rightCol);
  content.appendChild(split);
}

export function buildAccordionView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  // Show all projects first, then 'about' at the end.
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
    header.type      = 'button';
    header.className = 'm-header';
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

export function buildMobileView() {
  buildAccordionView('mobile-view');
}
