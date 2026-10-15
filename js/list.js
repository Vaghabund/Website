// ─────────────────────────────────────────────
// Project index — the text-first counterpart to the node canvas.
//
// Desktop (#desktop-list-view): a left-bound index grouped by year, with the
// selected project opening in a pane on the right. The first project is open
// from the start, so the right side is never empty.
//
// Mobile (#mobile-view): a big wordmark with a menu button. The menu is a
// full-screen version of the same index; picking a project swaps the page
// for that project (media, title, text), and the browser's back button
// returns to wherever you were. Projects are addressable as #<id>.
//
// Both platforms render a project with the SAME builder the project lightbox
// uses, so it reads identically wherever it opens. Content is rebuilt on
// every selection rather than cached — a project's inline 3D viewer and
// autoplaying videos can't safely be left running in a hidden section.
// ─────────────────────────────────────────────

import PROJECTS                   from '../projects.js';
import { stripMd, fetchDetail }   from './utils.js';
import { el }                     from './dom.js';
import { buildDesktopProjectLayout } from './lightbox.js';
import { disposeInlineModel }     from './three-viewer.js';

const isAbsolute = u => /^https?:\/\//i.test(u) || u.startsWith('media/');

// ── Project content ───────────────────────────────────────────────────────
async function loadContent(p, inner) {
  const detail  = await fetchDetail(p.id);
  const base    = `media/projects/${p.id}/`;
  const resolve = u => isAbsolute(u) ? u : base + u;

  const images = (detail.images || []).map(resolve);
  detail._resolvedVideos = (detail.videos || []).map(resolve);
  detail._resolvedPoster = detail.poster ? resolve(detail.poster) : null;

  const modelSrc = detail.model ? resolve(detail.model) : null;

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

// Shows one project at a time inside `host`. Returns show(p, title?), which
// resolves once the content is in place; a newer call supersedes an older
// one that is still loading.
function createPane(containerId, host) {
  let token = 0;
  return async function show(p, title) {
    const mine = ++token;
    const section = el('section', 'idx-project');
    section.appendChild(el('h2', 'idx-title', title || p.title));
    const inner = el('div', 'idx-content');
    // Keeps the per-project CSS hooks (e.g. the greyhound gallery override)
    // working against the same id scheme they were written for.
    inner.id = `${containerId}-content-${p.id}`;
    section.appendChild(inner);
    try { await loadContent(p, inner); } catch (err) { console.error(err); }
    if (mine !== token) return;
    disposeInlineModel();
    host.replaceChildren(section);
    host.scrollTop = 0;
  };
}

// ── Index ─────────────────────────────────────────────────────────────────
// Projects grouped by year, newest first. `about` is never part of it: on
// desktop it lives behind the top-bar link, on mobile it is added by hand.
async function loadGroups() {
  const items = await Promise.all(
    PROJECTS.filter(p => p.id !== 'about')
      .map(async p => ({ p, year: (await fetchDetail(p.id)).year || '' }))
  );
  items.sort((a, b) => b.year.localeCompare(a.year));

  const groups = [];
  items.forEach(({ p, year }) => {
    let g = groups[groups.length - 1];
    if (!g || g.year !== year) groups.push(g = { year, projects: [] });
    g.projects.push(p);
  });
  return groups;
}

// Builds the year-grouped button list. `extras` are appended as a final
// ungrouped block (mobile: About / Contact).
function buildIndexNav(groups, onSelect, extras = []) {
  const nav = el('nav', 'idx');
  const buttons = new Map();

  const addButton = (parent, id, label, onClick) => {
    const b = el('button', 'idx-item', label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    if (id) buttons.set(id, b);
    parent.appendChild(b);
  };

  groups.forEach(({ year, projects }) => {
    const group = el('div', 'idx-group');
    if (year) group.appendChild(el('div', 'idx-year', year));
    projects.forEach(p => addButton(group, p.id, p.title, () => onSelect(p.id)));
    nav.appendChild(group);
  });

  if (extras.length) {
    const group = el('div', 'idx-group idx-extras');
    extras.forEach(x => addButton(group, x.id, x.label, x.onClick));
    nav.appendChild(group);
  }

  const setActive = id => buttons.forEach((b, k) => {
    const on = k === id;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
  });
  return { nav, setActive };
}

// ── Desktop ───────────────────────────────────────────────────────────────
// Returns { activateDefault }. The first project is opened lazily — by
// js/view-switch.js on the first visit to the list — so a visitor who stays
// on the canvas never pays for its images.
export async function buildProjectList(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return { activateDefault() {} };
  container.innerHTML = '';

  const groups = await loadGroups();
  const byId   = Object.fromEntries(PROJECTS.map(p => [p.id, p]));

  const detail = el('main', 'idx-detail');
  const show   = createPane(containerId, detail);
  const select = id => { setActive(id); return show(byId[id]); };
  const { nav, setActive } = buildIndexNav(groups, select);

  container.append(nav, detail);

  let started = false;
  return {
    activateDefault() {
      if (started) return;
      started = true;
      const first = groups[0]?.projects[0];
      if (first) select(first.id);
    },
  };
}

// ── Mobile ────────────────────────────────────────────────────────────────
export async function buildMobileList() {
  const view = document.getElementById('mobile-view');
  if (!view) return;
  view.innerHTML = '';

  const byId   = Object.fromEntries(PROJECTS.map(p => [p.id, p]));
  const groups = await loadGroups();
  const aboutDetail = await fetchDetail('about');
  const email  = (aboutDetail.links || []).find(l => /mail/i.test(l.label))?.url;
  const intro  = document.getElementById('site-header-intro')?.textContent || '';

  // The wordmark is text, not the desktop SVG: that is a 16:1 strip, far too
  // flat to carry a phone header.
  const makeHead = (menuOpen) => {
    const head = el('header', 'm-head');
    const mark = el('button', 'm-mark');
    mark.type = 'button';
    mark.innerHTML = 'Joel<br>Tenenberg';
    mark.addEventListener('click', () => go(''));
    const burger = el('button', `m-burger${menuOpen ? ' is-close' : ''}`);
    burger.type = 'button';
    burger.setAttribute('aria-label', menuOpen ? 'Close menu' : 'Open menu');
    burger.append(el('span'), el('span'), el('span'));
    burger.addEventListener('click', () => setMenu(!menuOpen));
    head.append(mark, burger);
    return head;
  };

  const main = el('main', 'm-main');

  // Full-screen menu — the same index as desktop, plus About and Contact.
  const extras = [{ id: 'about', label: 'About', onClick: () => go('about') }];
  if (email) extras.push({ id: null, label: 'Contact', onClick: () => { location.href = email; } });
  const { nav, setActive } = buildIndexNav(groups, go, extras);
  const menu = el('div', 'm-menu');
  menu.append(makeHead(true), nav);
  menu.hidden = true;

  view.append(makeHead(false), main, menu);

  function setMenu(open) {
    menu.hidden = !open;
    view.classList.toggle('menu-open', open);
    if (open) menu.scrollTop = 0;
  }

  const show = createPane('mobile-view', main);

  function showHome() {
    const home = el('section', 'm-home');
    const links = el('div', 'm-home-links');
    const about = el('button', 'm-home-link', '→ About');
    about.type = 'button';
    about.addEventListener('click', () => go('about'));
    links.appendChild(about);
    if (email) {
      const a = el('a', 'm-home-link', '→ Contact');
      a.href = email;
      links.appendChild(a);
    }
    home.append(links, el('p', 'm-home-intro', intro));
    main.replaceChildren(home);
    setActive(null);
  }

  // The route is the hash: '' is home, '#<id>' is a project. Written through
  // pushState so Back steps through what the visitor actually looked at.
  function route() {
    const id = location.hash.slice(1);
    setMenu(false);
    view.scrollTop = 0;
    if (byId[id]) {
      setActive(id);
      show(byId[id], id === 'about' ? 'About' : undefined);
    } else {
      showHome();
    }
  }

  function go(id) {
    const target = id ? `#${id}` : location.pathname + location.search;
    if (id ? location.hash !== target : location.hash) history.pushState(null, '', target);
    route();
  }

  window.addEventListener('popstate', route);
  route();
}
