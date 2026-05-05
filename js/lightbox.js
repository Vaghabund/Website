// ─────────────────────────────────────────────
// Image and project lightboxes.
// ─────────────────────────────────────────────

import { projectDataById } from './state.js';
import { el }              from './dom.js';
import { openModelLb, closeModelLb, mountInlineModel, disposeInlineModel } from './three-viewer.js';

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
    // Only show non-PDF links here; PDFs are surfaced as tabs.
    const nonPdfLinks = (d.links || []).filter(l => !l.url?.endsWith('.pdf'));
    if (nonPdfLinks.length) {
      const row = el('div', 'plb-detail-row');
      row.appendChild(el('div', 'plb-detail-label', 'Links'));
      nonPdfLinks.forEach(link => {
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

  // Gallery panel
  const gallery = el('div', 'plb-left-panel');
  if (data.images.length) {
    const g = el('div', `plb-gallery${data.images.length < 3 ? ' plb-gallery-single' : ''}`);
    data.images.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src; img.alt = `${data.project.title} image ${i + 1}`; img.loading = 'lazy';
      img.style.animationDelay = `${0.08 + i * 0.06}s`;
      img.addEventListener('click', e => { e.stopPropagation(); openImgLb(data.images, i); });
      g.appendChild(img);
    });
    gallery.appendChild(g);
  }

  // Model panel (only built if model exists)
  const modelPanel = data.modelSrc ? el('div', 'plb-left-panel plb-model-panel') : null;

  // Tab bar (only shown when both panels exist)
  if (data.modelSrc && data.images.length) {
    const tabBar = el('div', 'plb-left-tabs');
    const imgTab   = el('button', 'plb-left-tab active', 'Images');
    const modelTab = el('button', 'plb-left-tab', '3D Model');

    function showGallery() {
      gallery.style.display = '';
      modelPanel.style.display = 'none';
      disposeInlineModel();
      imgTab.classList.add('active');
      modelTab.classList.remove('active');
    }
    function showModel() {
      gallery.style.display = 'none';
      modelPanel.style.display = '';
      modelPanel.innerHTML = '';
      mountInlineModel(data.modelSrc, modelPanel);
      modelTab.classList.add('active');
      imgTab.classList.remove('active');
    }

    imgTab.addEventListener('click', showGallery);
    modelTab.addEventListener('click', showModel);
    tabBar.appendChild(imgTab);
    tabBar.appendChild(modelTab);
    left.appendChild(tabBar);
    modelPanel.style.display = 'none';
  }

  left.appendChild(gallery);
  if (modelPanel) left.appendChild(modelPanel);

  // Right column: tabbed text panels + PDF panels, details always visible below.
  const pdfLinks = (data.detail.links || []).filter(l => l.url && l.url.endsWith('.pdf'));

  const rightPanels = [
    ...data.texts.map(t => ({ label: t.label || 'Text', kind: 'text', data: t })),
    ...pdfLinks.map(l => ({ label: l.label || 'PDF', kind: 'pdf', url: l.url })),
  ];

  if (rightPanels.length > 1) {
    const tabBar    = el('div', 'plb-left-tabs');
    const panelWrap = el('div', 'plb-right-panels');

    rightPanels.forEach((panel, i) => {
      const tab = el('button', `plb-left-tab${i === 0 ? ' active' : ''}`, panel.label);
      const pane = el('div', 'plb-right-pane');
      if (i !== 0) pane.style.display = 'none';

      if (panel.kind === 'text') {
        pane.appendChild(el('div', 'plb-text-body', panel.data.body));
      } else {
        const iframe = document.createElement('iframe');
        iframe.src = panel.url;
        iframe.className = 'plb-pdf-frame';
        iframe.setAttribute('loading', 'lazy');
        pane.appendChild(iframe);
      }

      tab.addEventListener('click', () => {
        tabBar.querySelectorAll('.plb-left-tab').forEach(t => t.classList.remove('active'));
        panelWrap.querySelectorAll('.plb-right-pane').forEach(p => p.style.display = 'none');
        tab.classList.add('active');
        pane.style.display = '';
      });

      tabBar.appendChild(tab);
      panelWrap.appendChild(pane);
    });

    right.appendChild(tabBar);
    right.appendChild(panelWrap);
  } else if (rightPanels.length === 1) {
    const panel = rightPanels[0];
    if (panel.kind === 'text') {
      const block = el('div', 'plb-text-block');
      block.appendChild(el('div', 'plb-text-body', panel.data.body));
      right.appendChild(block);
    } else {
      const iframe = document.createElement('iframe');
      iframe.src = panel.url;
      iframe.className = 'plb-pdf-frame';
      right.appendChild(iframe);
    }
  }

  appendDetails(right);

  split.appendChild(left);
  split.appendChild(right);
  plbBody.appendChild(split);
  projectLb.classList.add('open');
}

function closePlb() { projectLb.classList.remove('open'); disposeInlineModel(); }
document.getElementById('plb-close').onclick = closePlb;
projectLb.addEventListener('click', e => { if (e.target === projectLb) closePlb(); });

// ── Global keyboard shortcuts for all lightboxes ─────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    lightbox.classList.remove('open');
    closePlb();
    closeModelLb();
    document.getElementById('impressum-lightbox')?.classList.remove('open');
  }
  if (lightbox.classList.contains('open')) {
    if (e.key === 'ArrowLeft')  lbStep(-1);
    if (e.key === 'ArrowRight') lbStep(1);
  }
});
