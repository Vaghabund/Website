// ─────────────────────────────────────────────
// Image and project lightboxes.
// ─────────────────────────────────────────────

import { projectDataById } from './state.js';
import { el }              from './dom.js';
import { openModelLb, closeModelLb } from './three-viewer.js';

// ── Image lightbox ────────────────────────────────────────────────────────
const lightbox = document.getElementById('lightbox');
const lbImg    = document.getElementById('lb-img');
const lbCtr    = document.getElementById('lb-counter');

let lbImgs = [], lbI = 0;

export function openImgLb(imgs, i) {
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

// ── Project lightbox ──────────────────────────────────────────────────────
const projectLb = document.getElementById('project-lightbox');
const plbTitle  = document.getElementById('plb-title');
const plbTabs   = document.getElementById('plb-tabs');
const plbBody   = document.getElementById('plb-body');

export function openProjectLb(projectId) {
  const data = projectDataById[projectId];
  if (!data) return;
  plbTitle.textContent = data.project.title;
  plbTabs.innerHTML = '';
  plbBody.innerHTML = '';

  function appendDetails(target) {
    if (!data.hasDetail) return;
    const d = data.detail;
    [
      d.year      && ['Year',      d.year],
      d.role      && ['Role',      d.role],
      d.timeline  && ['Timeline',  d.timeline],
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
        a.href = link.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.className = 'plb-link'; a.textContent = link.label;
        row.appendChild(a);
        row.appendChild(document.createElement('br'));
      });
      target.appendChild(row);
    }
  }

  // Desktop: two-column split layout.
  plbTabs.style.display = 'none';
  const split = el('div', 'plb-split');
  const left  = el('div', 'plb-col plb-col-images');
  const right = el('div', 'plb-col plb-col-text');

  if (data.images.length) {
    const g = el('div', 'plb-gallery');
    data.images.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src; img.alt = `${data.project.title} image ${i + 1}`; img.loading = 'lazy';
      img.addEventListener('click', e => { e.stopPropagation(); openImgLb(data.images, i); });
      g.appendChild(img);
    });
    left.appendChild(g);
  }

  if (data.texts.length) {
    data.texts.forEach(t => {
      const block = el('div', 'plb-text-block');
      block.appendChild(el('div', 'plb-text-title', t.label));
      block.appendChild(el('div', 'plb-text-body',  t.body));
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
}

document.getElementById('plb-close').onclick = () => projectLb.classList.remove('open');
projectLb.addEventListener('click', e => { if (e.target === projectLb) projectLb.classList.remove('open'); });

// ── Global keyboard shortcuts for all lightboxes ─────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    lightbox.classList.remove('open');
    projectLb.classList.remove('open');
    closeModelLb();
    document.getElementById('impressum-lightbox')?.classList.remove('open');
  }
  if (lightbox.classList.contains('open')) {
    if (e.key === 'ArrowLeft')  lbStep(-1);
    if (e.key === 'ArrowRight') lbStep(1);
  }
});
