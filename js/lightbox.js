// ─────────────────────────────────────────────
// Image and project lightboxes.
// ─────────────────────────────────────────────

import { projectDataById } from './state.js';
import { el }              from './dom.js';
import { mountInlineModel, disposeInlineModel } from './three-viewer.js';

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

// ── Reusable video player with sound + play/pause overlays ───────────────
const VIDEO_ICONS = {
  muted:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
  unmuted: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
  play:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
};

export function createVideoWrap(src, { silent = false, poster = null } = {}) {
  const wrap = el('div', 'plb-video-wrap');
  const video = document.createElement('video');
  video.src = src; video.className = 'plb-video';
  video.autoplay = true; video.loop = true; video.muted = true;
  video.setAttribute('playsinline', '');
  if (poster) video.poster = poster;

  let soundBtn = null;
  if (!silent) {
    soundBtn = el('button', 'plb-video-sound');
    soundBtn.type = 'button';
    soundBtn.setAttribute('aria-label', 'Toggle sound');
    soundBtn.innerHTML = VIDEO_ICONS.muted;
    soundBtn.addEventListener('click', e => {
      e.stopPropagation();
      video.muted = !video.muted;
      soundBtn.innerHTML = video.muted ? VIDEO_ICONS.muted : VIDEO_ICONS.unmuted;
      if (!video.muted) video.play().catch(() => {});
    });
  }

  const playOverlay = el('button', 'plb-video-play');
  playOverlay.type = 'button';
  playOverlay.setAttribute('aria-label', 'Play');
  playOverlay.innerHTML = VIDEO_ICONS.play;
  playOverlay.style.display = 'none';

  video.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
  video.addEventListener('play',  () => { playOverlay.style.display = 'none'; wrap.classList.remove('paused'); });
  video.addEventListener('pause', () => { playOverlay.style.display = '';     wrap.classList.add('paused');    });
  playOverlay.addEventListener('click', e => { e.stopPropagation(); video.play().catch(() => {}); });

  wrap.appendChild(video);
  if (soundBtn) wrap.appendChild(soundBtn);
  wrap.appendChild(playOverlay);
  return wrap;
}

// ── Shared desktop two-column layout builder ──────────────────────────────
// Used by both the project lightbox and the desktop list-view accordion.
export function buildDesktopProjectLayout(container, { project, detail, texts, images, modelSrc }) {
  const hasDetail = !!(detail.year || detail.role || detail.timeline || detail.tools?.length || detail.links?.length || detail.exhibitions?.length);

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
    if (detail.exhibitions?.length) {
      const row = el('div', 'plb-detail-row');
      row.appendChild(el('div', 'plb-detail-label', 'Exhibited at'));
      const value = el('div', 'plb-detail-value');
      detail.exhibitions.forEach((ex, i) => {
        value.appendChild(document.createTextNode(ex));
        if (i < detail.exhibitions.length - 1) value.appendChild(document.createElement('br'));
      });
      row.appendChild(value);
      target.appendChild(row);
    }
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

  // Left: videos (above gallery) + gallery + optional model tab
  const videos  = detail._resolvedVideos || [];
  const gallery = el('div', 'plb-left-panel');
  videos.forEach(src => gallery.appendChild(createVideoWrap(src, { silent: detail.silentVideos, poster: detail._resolvedPoster })));
  if (images.length) {
    const g = el('div', `plb-gallery${images.length < 3 ? ' plb-gallery-single' : ''}`);
    gallery.appendChild(g);

    const applyOrientation = project.id !== 'greyhound';

    if (!applyOrientation) {
      // Greyhound: render in order, no cropping
      images.forEach((src, i) => {
        const wrap = el('div', 'plb-gallery-item');
        const img  = document.createElement('img');
        img.src = src; img.alt = `${project.title} image ${i + 1}`; img.loading = 'lazy';
        img.style.animationDelay = `${0.08 + i * 0.06}s`;
        img.addEventListener('click', e => { e.stopPropagation(); openImgLb(images, i); });
        wrap.appendChild(img);
        g.appendChild(wrap);
      });
    } else {
      // Preload all images to get natural dimensions, then sort and render
      Promise.all(images.map(src => new Promise(resolve => {
        const probe = new Image();
        probe.onload  = () => resolve({ src, landscape: probe.naturalWidth >= probe.naturalHeight });
        probe.onerror = () => resolve({ src, landscape: true });
        probe.src = src;
      }))).then(items => {
        // Pair similar orientations: stable-sort portraits together, landscapes together
        const portraits  = items.filter(x => !x.landscape);
        const landscapes = items.filter(x =>  x.landscape);
        const sorted = [];
        let pi = 0, li = 0;
        while (pi < portraits.length || li < landscapes.length) {
          // Prefer pairing: take two of the same kind if available
          if (pi + 1 <= portraits.length  && portraits.length - pi >= landscapes.length - li) {
            sorted.push(portraits[pi++]);
            if (pi < portraits.length) sorted.push(portraits[pi++]);
          } else {
            sorted.push(landscapes[li++]);
            if (li < landscapes.length) sorted.push(landscapes[li++]);
          }
        }

        sorted.forEach(({ src, landscape }, i) => {
          const originalIdx = images.indexOf(src);
          const wrap = el('div', 'plb-gallery-item');
          wrap.classList.add(landscape ? 'img-landscape' : 'img-portrait');
          // Span full width if last and alone on its row
          if (i === sorted.length - 1 && sorted.length % 2 !== 0) {
            wrap.classList.add('img-full-row');
          }
          const img = document.createElement('img');
          img.src = src;
          img.alt = `${project.title} image ${i + 1}`;
          img.loading = 'lazy';
          img.style.animationDelay = `${0.08 + i * 0.06}s`;
          img.addEventListener('click', e => { e.stopPropagation(); openImgLb(images, originalIdx); });
          wrap.appendChild(img);
          g.appendChild(wrap);
        });
      });
    }
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
  const zipLinks    = (detail.links || []).filter(l => l.url?.endsWith('.zip'));
  const rightPanels = [
    ...texts.map(t => ({ label: t.label || 'Text', kind: 'text', data: t })),
    ...pdfLinks.map(l => ({ label: l.label || 'PDF', kind: 'pdf', url: l.url })),
    ...zipLinks.map(l => ({ label: l.label || 'Download', kind: 'zip', url: l.url })),
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
      if (panel.kind === 'zip') {
        const tab = el('button', 'plb-left-tab plb-left-tab-pdf', panel.label);
        tab.innerHTML = `${panel.label}<svg class="plb-tab-ext" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 2v5M2.5 5.5L5 7.5l2.5-2M2 8.5h6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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
    document.getElementById('impressum-lightbox')?.classList.remove('open');
  }
  if (lightbox.classList.contains('open')) {
    if (e.key === 'ArrowLeft')  lbStep(-1);
    if (e.key === 'ArrowRight') lbStep(1);
  }
});
