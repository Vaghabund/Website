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
async function loadContent(p, inner, mobile = false) {
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

  buildDesktopProjectLayout(inner, { project: p, detail, texts, images, modelSrc, linear: mobile });
  return detail;
}

// Shows one project at a time inside `host`. Returns show(p, title?), which
// resolves once the content is in place; a newer call supersedes an older
// one that is still loading.
function createPane(containerId, host, onBuilt) {
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
    let detail = {};
    try { detail = await loadContent(p, inner, !!onBuilt); } catch (err) { console.error(err); }
    if (mine !== token) return;
    onBuilt?.(section, inner, p, detail);
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
  const intro  = document.getElementById('site-header-intro')?.textContent || '';
  const email  = (aboutDetail.links || []).find(l => /mail/i.test(l.label))?.url;

  // Same wordmark SVG and tagline as the desktop header.
  const makeHead = (mode) => {
    const head = el('header', 'm-head');
    const mark = el('button', 'm-mark');
    mark.type = 'button';
    mark.setAttribute('aria-label', 'Joel Tenenberg');
    const logo = el('img', 'm-mark-img');
    logo.src = 'media/icons/Name_bold.svg';
    logo.alt = '';
    mark.append(logo, el('span', 'm-tagline', intro));
    mark.addEventListener('click', () => go(''));
    // One row for everything that is not a project, same style throughout.
    const nav = el('nav', 'm-nav');
    // A dot before each label; on the item that is open it turns into a cross.
    const item = (label, onClick, open = false) => {
      const b = el('button', `m-nav-item${open ? ' is-open' : ''}`);
      b.append(el('span', 'm-dot'), document.createTextNode(label));
      b.type = 'button';
      b.addEventListener('click', onClick);
      return b;
    };
    nav.appendChild(mode === 'index'
      ? item('Close', () => setMenu(false), true)
      : item('Index', () => { if (mode === 'about') go(''); setMenu(true); }));
    nav.appendChild(mode === 'about'
      ? item('Close', () => go(''), true)
      : item('About', () => go('about')));
    if (email) nav.appendChild(item('Contact', () => { location.href = email; }));
    head.append(mark, nav);
    return head;
  };

  const main = el('main', 'm-main');

  // Full-screen menu — the same year-grouped index as desktop.
  const { nav, setActive } = buildIndexNav(groups, go);
  const menu = el('div', 'm-menu');
  menu.append(makeHead('index'), nav);
  menu.hidden = true;

  // About opens as a full-screen page of the same kind as the index.
  const aboutBody = el('main', 'm-main');
  const aboutPage = el('div', 'm-menu m-about');
  aboutPage.append(makeHead('about'), aboutBody);
  aboutPage.hidden = true;

  view.append(makeHead(null), main, menu, aboutPage);

  function setAbout(open) {
    aboutPage.hidden = !open;
    view.classList.toggle('menu-open', open || !menu.hidden);
    if (open) aboutPage.scrollTop = 0;
  }

  function setMenu(open) {
    menu.hidden = !open;
    view.classList.toggle('menu-open', open || !aboutPage.hidden);
    if (open) menu.scrollTop = 0;
  }

  const flat = groups.flatMap(g => g.projects.map(p => ({ p, year: g.year })));

  // Reshapes a freshly built project page for a phone: meta line under the
  // title, hero first, a teaser instead of the full text, a capped gallery,
  // and a card for the next project at the end.
  function shapeProject(section, inner, p, detail) {
    const title = section.querySelector('.idx-title');
    const meta = [detail.year, detail.role].filter(Boolean).join(' · ');
    if (meta && title) title.after(el('p', 'm-meta', meta));

    if (inner.querySelector('.plb-video-wrap')) inner.classList.add('has-video');

    const split = inner.querySelector('.plb-split');
    const items = [...inner.querySelectorAll('.plb-gallery-item')];
    const cap = Number(detail.mobileImages) || 4;
    if (split && items.length > cap) {
      items.slice(cap).forEach(i => i.classList.add('m-extra'));
      inner.classList.add('m-gallery-collapsed');
      const more = el('button', 'm-more', `+ ${items.length - cap} more`);
      more.type = 'button';
      more.addEventListener('click', () => {
        inner.classList.remove('m-gallery-collapsed');
        more.remove();
      });
      split.appendChild(more);
    }

    const text = inner.querySelector('.plb-col-text');
    if (text && text.textContent.trim().length > 160) {
      inner.classList.add('m-text-collapsed');
      const read = el('button', 'm-read', 'Read more');
      read.type = 'button';
      read.addEventListener('click', () => {
        const open = inner.classList.toggle('m-text-collapsed');
        read.textContent = open ? 'Read more' : 'Show less';
      });
      text.appendChild(read);
    }

    const i = flat.findIndex(x => x.p.id === p.id);
    const next = i >= 0 ? flat[(i + 1) % flat.length] : null;
    if (next) {
      const wrap = el('div', 'm-next');
      wrap.append(el('div', 'm-next-label', 'Next'), makeCard(next.p, next.year, false));
      section.appendChild(wrap);
    }
  }

  const show = createPane('mobile-view', main, shapeProject);
  const showAbout = createPane('mobile-view', aboutBody, () => {});

  function showHome() {
    const home = el('section', 'm-home');
    home.appendChild(feed);
    main.replaceChildren(home);
    setActive(null);
  }

  // One full-width hero image per project, newest first. The images are
  // lazy so only the ones scrolled near are fetched.
  function makeCard(p, year, withImage = true) {
    const card = el('button', 'm-card');
    card.type = 'button';
    card.addEventListener('click', () => go(p.id));
    const cap = el('span', 'm-card-cap');
    cap.append(el('span', 'm-card-title', p.title), el('span', 'm-card-year', year));
    card.appendChild(cap);
    if (!withImage) return card;
    fetchDetail(p.id).then(d => {
      const rel = d.hero || (d.images || [])[0];
      if (!rel) return;
      const img = el('img', 'm-card-img');
      img.src = isAbsolute(rel) ? rel : `media/projects/${p.id}/${rel}`;
      img.alt = p.title;
      img.loading = 'lazy';
      img.decoding = 'async';
      card.prepend(img);
    });
    return card;
  }
  const feed = el('div', 'm-feed');
  flat.forEach(({ p, year }) => feed.appendChild(makeCard(p, year)));

  // The route is the hash: '' is home, '#<id>' is a project. Written through
  // pushState so Back steps through what the visitor actually looked at.
  function route() {
    const id = location.hash.slice(1);
    setMenu(false);
    setAbout(false);
    if (id === 'about') {
      if (!main.firstChild) showHome();
      setAbout(true);
      showAbout(byId.about, 'About');
      return;
    }
    view.scrollTop = 0;
    if (byId[id]) {
      setActive(id);
      show(byId[id]);
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
