// ─────────────────────────────────────────────
// Project list — the flat, skimmable counterpart to the node canvas, and the
// primary way in on mobile, where panning a canvas is awkward.
//
// ONE builder serves both platforms: #desktop-list-view and #mobile-view get
// identical markup and behaviour, differing only in the band and type sizes
// CSS hands them. A row is three flat columns — title, centred hero image,
// year — that expands INLINE into the same two-column layout the project
// lightbox uses. Never a modal: opening a project keeps you in the list.
//
// One row open at a time. Opening collapses the line to a slim sticky header,
// grows the panel beneath it, and rides the row up to the top of the list.
// The panel's height animates with a grid-template-rows 0fr → 1fr transition
// rather than a measured max-height, so it needs no hard-coded heights and
// copes with content of any size.
// ─────────────────────────────────────────────

import PROJECTS                      from '../projects.js';
import { stripMd, fetchDetail, toThumb } from './utils.js';
import { el }                        from './dom.js';
import { buildDesktopProjectLayout } from './lightbox.js';

const isAbsolute = u => /^https?:\/\//i.test(u) || u.startsWith('media/');

// ── Row data ──────────────────────────────────────────────────────────────
async function rowInfo(p) {
  const detail = await fetchDetail(p.id);
  const base   = `media/projects/${p.id}/`;
  const first  = detail.images?.[0];
  return {
    p,
    year:  detail.year || '',
    thumb: first ? toThumb(isAbsolute(first) ? first : base + first) : null,
  };
}

// ── Panel content ─────────────────────────────────────────────────────────
// Deliberately the same builder the project lightbox uses, so a project reads
// identically wherever it is opened. CSS (.p-panel-inner) strips the
// lightbox's viewport cap and inner scrollers so it flows inline instead.
async function loadPanel(p, inner) {
  const detail  = await fetchDetail(p.id);
  const base    = `media/projects/${p.id}/`;
  const resolve = u => isAbsolute(u) ? u : base + u;

  const images = (detail.images || []).map(resolve);
  detail._resolvedVideos = (detail.videos || []).map(resolve);
  detail._resolvedPoster = detail.poster ? resolve(detail.poster) : null;

  const modelSrc = detail.model
    ? (isAbsolute(detail.model) ? detail.model : base + detail.model)
    : null;

  const textDefs = Array.isArray(detail.texts) && detail.texts.length
    ? detail.texts
    : [{ file: 'description.md', label: p.title }];

  const texts = (await Promise.all(textDefs.map(async t => {
    try {
      const raw = await fetch(`${base}${t.file || 'description.md'}`).then(r => r.ok ? r.text() : null);
      return raw ? { label: t.label || 'Overview', body: stripMd(raw) } : null;
    } catch { return null; }
  }))).filter(Boolean);

  buildDesktopProjectLayout(inner, { project: p, detail, texts, images, modelSrc });
}

// Rides the opened row up to the top of the list. Chases the target every
// frame rather than firing a single scrollTo: the panel is still growing and
// another row may be collapsing above it, so both the destination AND the
// furthest reachable scroll position keep moving. One scrollTo issued up
// front simply clamps against a document that hasn't grown yet, which is why
// the earlier version had to wait for the transition to finish first — and
// that wait is what made it read as a second, separate motion.
function scrollRowToTop(host, item, maxMs = 1000) {
  const start = performance.now();
  // The list's own top padding is where a sticky row comes to rest, so aim
  // there — aiming at the raw scrollport top tucks the row under the mask.
  const pad = parseFloat(getComputedStyle(host).paddingTop) || 0;
  function step(now) {
    const delta = item.getBoundingClientRect().top - (host.getBoundingClientRect().top + pad);
    if (Math.abs(delta) < 0.5 || now - start > maxMs) return;
    host.scrollTop += delta * 0.2;
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Build ─────────────────────────────────────────────────────────────────
export async function buildProjectList(containerId, { desktop = false } = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const projects = PROJECTS.filter(p => p.id !== 'about');
  const about    = PROJECTS.find(p => p.id === 'about');

  const rows = await Promise.all(projects.map(rowInfo));
  rows.sort((a, b) => b.year.localeCompare(a.year));

  // On desktop the bio is reached through the top-bar "about" link, which
  // opens it in the project lightbox — so it gets no row here. Mobile has no
  // project lightbox, so there it stays the last row of the list, labelled
  // "About": the bio's actual title is the site owner's name, which reads
  // oddly sitting in a column of project names. Only the row label changes —
  // the panel and the desktop lightbox still use the real title.
  if (!desktop && about) rows.push({ ...await rowInfo(about), year: '', label: 'About' });

  const scrollHost = document.getElementById(desktop ? 'desktop-list-view' : 'mobile-view');

  for (const { p, year, thumb, label } of rows) {
    // data-id lets js/view-switch.js pair a row with its canvas node when it
    // measures both ends of the node ⇄ list flight.
    const item = el('article', 'p-item');
    item.dataset.id = p.id;

    const row = document.createElement('button');
    row.type      = 'button';
    row.className = 'p-row';

    // Three flat columns: title left, hero image centred, year and mark
    // right. The two outer columns are equal (1fr), which is what actually
    // puts the image on the row's centre line. Nothing sits on top of the
    // image, so it needs no scrim to stay legible.
    row.appendChild(el('span', 'p-row-title', label || p.title));

    const media = el('div', 'p-row-media');
    if (thumb) {
      const img = document.createElement('img');
      img.className = 'p-row-img';
      img.src = thumb; img.alt = ''; img.loading = 'lazy';
      media.appendChild(img);
    }
    row.appendChild(media);

    const foot = el('div', 'p-row-foot');
    foot.appendChild(el('span', 'p-row-year', year));
    foot.appendChild(el('span', 'p-row-mark'));
    row.appendChild(foot);

    const panel = el('div', 'p-panel');
    const inner = el('div', 'p-panel-inner');
    // Keeps the per-project CSS hooks (e.g. the greyhound gallery override)
    // working against the same id scheme they were written for.
    inner.id = `${containerId}-content-${p.id}`;
    panel.appendChild(inner);

    row.setAttribute('aria-controls', inner.id);
    row.setAttribute('aria-expanded', 'false');

    row.addEventListener('click', async () => {
      if (item.classList.contains('open')) {
        item.classList.remove('open');
        container.classList.remove('p-list-open');
        row.setAttribute('aria-expanded', 'false');
        return;
      }

      // Build the content BEFORE opening. The panel animates to whatever
      // height its content reports, so opening an empty panel first would
      // animate to nothing and then pop as the content landed.
      if (!inner.dataset.loaded) {
        inner.dataset.loaded = 'true';
        try { await loadPanel(p, inner); } catch (err) { console.error(err); }
      }

      // One at a time.
      container.querySelectorAll('.p-item.open').forEach(open => {
        open.classList.remove('open');
        open.querySelector('.p-row')?.setAttribute('aria-expanded', 'false');
      });

      item.classList.add('open');
      // Adds slack below the list so even the last row can reach the top —
      // see the .p-list-open rule in style.css.
      container.classList.add('p-list-open');
      row.setAttribute('aria-expanded', 'true');
      // Started in the same frame as the expansion, so the collapse above,
      // the growth below and the scroll all read as one movement.
      if (scrollHost) scrollRowToTop(scrollHost, item);
    });

    item.appendChild(row);
    item.appendChild(panel);
    container.appendChild(item);
  }
}

export function buildMobileList() {
  buildProjectList('mobile-view');

  // Move the site header into the scroll container so it scrolls away with
  // the content instead of covering the first row.
  const siteHeader = document.getElementById('site-header');
  const mobileView = document.getElementById('mobile-view');
  if (siteHeader && mobileView) mobileView.insertBefore(siteHeader, mobileView.firstChild);
}
