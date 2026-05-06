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

// ── Shared desktop two-column layout builder ──────────────────────────────
// Used by both the project lightbox and the desktop list-view accordion.
export function buildDesktopProjectLayout(container, { project, detail, texts, images, modelSrc }) {
  const hasDetail = !!(detail.year || detail.role || detail.timeline || detail.tools?.length || detail.links?.length);

  function appendDetails(target) {
    if (!hasDetail) return;
    [
      detail.year      && ['Year',      detail.year],
      detail.role      && ['Role',      detail.role],
      detail.timeline  && ['Timeline',  detail.timeline],
      detail.tools?.length && ['Tools', detail.tools.join(', ')],
    ].filter(Boolean).forEach(([label, value]) => {
      const row = el('div', 'plb-detail-row');
      row.appendChild(el('div', 'plb-detail-label', label));
      row.appendChild(el('div', 'plb-detail-value', value));
      target.appendChild(row);
    });
    const nonPdfLinks = (detail.links || []).filter(l => !l.url?.endsWith('.pdf'));
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

  const split = el('div', 'plb-split');
  const left  = el('div', 'plb-col plb-col-images');
  const right = el('div', 'plb-col plb-col-text');

  // Left: gallery + optional model tab
  const gallery = el('div', 'plb-left-panel');
  if (images.length) {
    const g = el('div', `plb-gallery${images.length < 3 ? ' plb-gallery-single' : ''}`);
    images.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src; img.alt = `${project.title} image ${i + 1}`; img.loading = 'lazy';
      img.style.animationDelay = `${0.08 + i * 0.06}s`;
      img.addEventListener('click', e => { e.stopPropagation(); openImgLb(images, i); });
      g.appendChild(img);
    });
    gallery.appendChild(g);
  }

  const modelPanel = modelSrc ? el('div', 'plb-left-panel plb-model-panel') : null;
  if (modelSrc && images.length) {
    const tabBar   = el('div', 'plb-left-tabs');
    const imgTab   = el('button', 'plb-left-tab active', 'Images');
    const modelTab = el('button', 'plb-left-tab', '3D Model');
    imgTab.addEventListener('click', () => {
      gallery.style.display = ''; modelPanel.style.display = 'none';
      disposeInlineModel();
      imgTab.classList.add('active'); modelTab.classList.remove('active');
    });
    modelTab.addEventListener('click', () => {
      gallery.style.display = 'none'; modelPanel.style.display = '';
      modelPanel.innerHTML = ''; mountInlineModel(modelSrc, modelPanel);
      modelTab.classList.add('active'); imgTab.classList.remove('active');
    });
    tabBar.appendChild(imgTab); tabBar.appendChild(modelTab);
    left.appendChild(tabBar);
    modelPanel.style.display = 'none';
  }
  left.appendChild(gallery);
  if (modelPanel) left.appendChild(modelPanel);

  // Right: tabbed text + PDF panels, details pinned below
  const pdfLinks    = (detail.links || []).filter(l => l.url?.endsWith('.pdf'));
  const rightPanels = [
    ...texts.map(t => ({ label: t.label || 'Text', kind: 'text', data: t })),
    ...pdfLinks.map(l => ({ label: l.label || 'PDF', kind: 'pdf', url: l.url })),
  ];

  if (rightPanels.length > 1) {
    const tabBar    = el('div', 'plb-left-tabs');
    const panelWrap = el('div', 'plb-right-panels');
    const textPanels = rightPanels.filter(p => p.kind === 'text');
    rightPanels.forEach((panel, i) => {
      if (panel.kind === 'pdf') {
        const tab = el('button', 'plb-left-tab plb-left-tab-pdf', panel.label);
        tab.innerHTML = `${panel.label}<svg class="plb-tab-ext" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        tab.addEventListener('click', () => window.open(panel.url, '_blank', 'noopener,noreferrer'));
        tabBar.appendChild(tab);
        return;
      }
      const textIdx = textPanels.indexOf(panel);
      const tab  = el('button', `plb-left-tab${textIdx === 0 ? ' active' : ''}`, panel.label);
      const pane = el('div', 'plb-right-pane');
      if (textIdx !== 0) pane.style.display = 'none';
      const body = el('div', 'plb-text-body', panel.data.body);
      pane.appendChild(body);
      if (textIdx === 0) appendDetails(pane);
      tab.addEventListener('click', () => {
        tabBar.querySelectorAll('.plb-left-tab:not(.plb-left-tab-pdf)').forEach(t => t.classList.remove('active'));
        panelWrap.querySelectorAll('.plb-right-pane').forEach(p => p.style.display = 'none');
        tab.classList.add('active'); pane.style.display = '';
      });
      tabBar.appendChild(tab); panelWrap.appendChild(pane);
    });
    right.appendChild(tabBar); right.appendChild(panelWrap);
  } else if (rightPanels.length === 1) {
    const panel = rightPanels[0];
    const singleWrap = el('div', 'plb-right-panels');
    const pane = el('div', 'plb-right-pane');
    if (panel.kind === 'text') {
      pane.appendChild(el('div', 'plb-text-body', panel.data.body));
      appendDetails(pane);
    } else {
      appendDetails(pane);
    }
    singleWrap.appendChild(pane);
    right.appendChild(singleWrap);
  } else {
    const detailWrap = el('div', 'plb-right-panels');
    const pane = el('div', 'plb-right-pane');
    appendDetails(pane);
    detailWrap.appendChild(pane);
    right.appendChild(detailWrap);
  }

  split.appendChild(left); split.appendChild(right);
  container.appendChild(split);
}

export function openProjectLb(projectId) {
  const data = projectDataById[projectId];
  if (!data) return;
  plbTitle.textContent = data.project.title;
  plbTabs.innerHTML = '';
  plbBody.innerHTML = '';
  plbTabs.style.display = 'none';
  projectLb.dataset.project = projectId;
  buildDesktopProjectLayout(plbBody, data);
  projectLb.classList.add('open');
}

function closePlb() { projectLb.classList.remove('open'); delete projectLb.dataset.project; disposeInlineModel(); }
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
