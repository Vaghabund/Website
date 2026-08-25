// ─────────────────────────────────────────────
// View switch — node canvas ⇄ flat project list.
//
// The boot intro hands straight over to the node canvas; a small toggle at
// the top of the screen is the only navigation between the two views.
//
// Switching runs a FLIP flight: each project's hero thumbnail is measured in
// BOTH views (the one being left is already on screen; the one being entered
// is briefly revealed at opacity 0 — see the .measuring rules in style.css),
// then a throwaway "flyer" is animated from one rect to the other while the
// real thumbnails stay hidden. The result is that the nodes visibly fly into
// their list rows, and back out into the ring again.
//
// The flyer is a div with a background-image rather than an <img> because
// the two ends fit their image differently (node: cover/top, row:
// contain/centre). object-fit can't be animated, but explicit pixel
// background-size can — see bgFrame() — so the crop resolves continuously
// over the flight instead of popping on the first frame.
// ─────────────────────────────────────────────

import PROJECTS              from '../projects.js';
import { projectNodeById }   from './state.js';
import { buildAccordionView } from './mobile.js';
import { openProjectLb }      from './lightbox.js';

// The flight runs in two beats: every hero image travels first, then the
// destination's chrome blends in around the images once they have landed.
// Everything within a beat moves in unison — the per-element `stagger`
// offsets below are all 0. They stay wired up (rather than being ripped out)
// purely as a knob: raising one reintroduces a wave for that stage.
const FLIGHT_MS  = 520;
const STAGGER_MS = 0;

// Beat two, per direction. Durations differ because the work differs:
//   nodes: slower; a whole card has to materialise around its image, so it
//          gets room to settle.
//   list:  quicker; the labels are light text next to an image that is
//          already there, and dragging them out just feels sluggish.
// Driven from CSS via --chrome-dur / --chrome-delay (see style.css).
const CHROME_NODES = { dur: 420, stagger: 0 };
const CHROME_LIST  = { dur: 240, stagger: 0 };

// Same path data as media/icons/LOGO.svg (three petals + centre dot).
const LOGO_PATHS = [
  'M164.26,23.392c21.179,-27.227 60.479,-32.138 87.706,-10.958c27.227,21.179 32.138,60.479 10.958,87.706c-21.179,27.227 -60.479,32.138 -87.706,10.958c-27.227,-21.179 -32.138,-60.479 -10.958,-87.706Z',
  'M315.148,226.786c31.955,-12.99 68.445,2.408 81.435,34.363c12.99,31.955 -2.408,68.445 -34.363,81.435c-31.955,12.99 -68.445,-2.408 -81.435,-34.363c-12.99,-31.955 2.408,-68.445 34.363,-81.435Z',
  'M21.168,272.999c4.728,-34.169 36.308,-58.072 70.477,-53.343c34.169,4.728 58.072,36.308 53.343,70.477c-4.728,34.169 -36.308,58.072 -70.477,53.343c-34.169,-4.728 -58.072,-36.308 -53.343,-70.477Z',
  'M149.877,200.788c4.728,-34.169 36.308,-58.072 70.477,-53.343c34.169,4.728 58.072,36.308 53.343,70.477c-4.728,34.169 -36.308,58.072 -70.477,53.343c-34.169,-4.728 -58.072,-36.308 -53.343,-70.477Z',
];

const SVG_NS = 'http://www.w3.org/2000/svg';

let listEl, flightLayer, toggleEl, canvasEl;
let isList = false;
let busy   = false;

export function initViewSwitch() {
  listEl      = document.getElementById('desktop-list-view');
  flightLayer = document.getElementById('view-flight-layer');
  toggleEl    = document.getElementById('view-toggle');
  canvasEl    = document.getElementById('canvas-root');

  // Built once, up front: the list has to be laid out (even while hidden)
  // for its row rects to be measurable when the first flight runs.
  buildAccordionView('desktop-list-view', { desktop: true });

  buildLogoMark();

  toggleEl?.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view === 'list'));
  });

  // The bio has no canvas node and no list row — this link is its only way
  // in. openProjectLb no-ops until main.js has registered the data, which
  // lands well inside the boot intro.
  document.getElementById('about-link')
    ?.addEventListener('click', () => openProjectLb('about'));

  syncToggle();
}

// Static corner mark — brand only, no menu behaviour. pointer-events:none in
// CSS so it can never swallow a wheel or click meant for the view underneath.
function buildLogoMark() {
  if (document.getElementById('logo-mark')) return;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.id = 'logo-mark';
  svg.setAttribute('viewBox', '0 0 420 420');
  svg.setAttribute('aria-hidden', 'true');
  LOGO_PATHS.forEach(d => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  });
  document.body.appendChild(svg);
}

function syncToggle() {
  toggleEl?.querySelectorAll('button').forEach(b => {
    const on = (b.dataset.view === 'list') === isList;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  toggleEl?.classList.toggle('on-list', isList);
}

async function setView(wantList) {
  if (busy || wantList === isList) return;
  busy = true;
  isList = wantList;
  syncToggle();
  try {
    await flyBetweenViews(wantList);
  } finally {
    busy = false;
  }
}

// ── Measuring ─────────────────────────────────────────────────────────────
// Both measure functions return { id → {rect, src, nw, nh, fit, posY} }.
// `reveal` briefly un-hides the view being measured (at opacity 0) for the
// duration of the read — neither view affects the other's layout, so this
// is invisible and can't disturb scroll position.

function measureNodes({ reveal = false } = {}) {
  if (reveal) canvasEl.classList.add('measuring');
  const out = {};
  PROJECTS.forEach(p => {
    const img = projectNodeById[p.id]?.querySelector('.image-stack img');
    if (!img) return;
    const rect = img.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    out[p.id] = {
      el: img, rect,
      src: img.currentSrc || img.src,
      nw: img.naturalWidth, nh: img.naturalHeight,
      opacity: getComputedStyle(img).opacity,
      fit: 'cover', posY: 0, // matches .image-stack img's object-fit/position
    };
  });
  if (reveal) canvasEl.classList.remove('measuring');
  return out;
}

function measureRows({ reveal = false } = {}) {
  if (reveal) listEl.classList.add('measuring');
  const out = {};
  listEl.querySelectorAll('.m-item[data-id]').forEach(item => {
    const img = item.querySelector('.m-header-thumb');
    if (!img) return;
    const rect = img.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    out[item.dataset.id] = {
      el: img, rect,
      src: img.currentSrc || img.src,
      nw: img.naturalWidth, nh: img.naturalHeight,
      opacity: getComputedStyle(img).opacity,
      fit: 'contain', posY: 50, // matches .m-header-thumb's object-fit/position
    };
  });
  if (reveal) listEl.classList.remove('measuring');
  return out;
}

// object-fit resolved to an explicit background-size, so the two ends of the
// flight interpolate instead of snapping between `cover` and `contain`.
function bgFrame({ rect, nw, nh, fit, posY }) {
  const pos = `50% ${posY}%`;
  if (!nw || !nh) return { size: `${rect.width}px ${rect.height}px`, pos };
  const s = fit === 'cover'
    ? Math.max(rect.width / nw, rect.height / nh)
    : Math.min(rect.width / nw, rect.height / nh);
  return { size: `${(nw * s).toFixed(2)}px ${(nh * s).toFixed(2)}px`, pos };
}

// ── The flight ────────────────────────────────────────────────────────────
async function flyBetweenViews(toListView) {
  const from = toListView ? measureNodes() : measureRows();
  const to   = toListView ? measureRows({ reveal: true }) : measureNodes({ reveal: true });

  const ids = Object.keys(from).filter(id => to[id]);

  // Each destination hero image is hidden with `visibility`, not opacity: the
  // real thumbnails carry opacity transitions of their own, so re-showing them
  // through one would re-introduce exactly the fade-in pop this hand-off
  // exists to remove. visibility flips instantly, in both directions.
  ids.forEach(id => to[id].el.classList.add('flight-hidden'));

  // `view-flying` suppresses the destination's chrome — row labels, node
  // cards — so nothing is doubled up while the flyers are in the air.
  document.body.classList.add('view-flying');
  document.body.classList.toggle('list-view', toListView);
  if (toListView) listEl.scrollTop = 0;

  // ── 1. Fly every hero image into place ──────────────────────────────────
  // The flyers hold their final frame (fill: 'both') and deliberately stay
  // on screen afterwards — the hand-off happens in step 3, not here.
  await Promise.all(ids.map((id, i) => flyOne(from[id], to[id], i)));

  // ── 2. Blend the chrome in around the images that just landed ───────────
  // Node cards assemble around their hero image rather than sitting there
  // waiting with a hole in them; row labels likewise settle in after their
  // thumbnails have arrived. The flyers stay on top throughout, so the
  // destination's own (still hidden) hero images never double up.
  //
  // Both custom properties inherit, so setting them on .m-header also drives
  // its title, year and ::after icon. With stagger at 0 every host gets the
  // same delay and the whole view blends in as one.
  const { dur, stagger } = toListView ? CHROME_LIST : CHROME_NODES;
  const hosts = ids
    .map(id => to[id].el.closest('.m-header, .node-project'))
    .filter(Boolean);
  hosts.forEach((host, i) => {
    host.style.setProperty('--chrome-dur',   `${dur}ms`);
    host.style.setProperty('--chrome-delay', `${i * stagger}ms`);
  });

  document.body.classList.remove('view-flying');
  await wait(dur + stagger * Math.max(0, hosts.length - 1) + 20);

  // Clear the overrides so the delay can't leak into any later state change
  // on these elements (row hover, a subsequent flight in the other order).
  hosts.forEach(host => {
    host.style.removeProperty('--chrome-dur');
    host.style.removeProperty('--chrome-delay');
  });

  // ── 3. Hand off ─────────────────────────────────────────────────────────
  // Chrome is fully opaque by now, so replacing each flyer with the real
  // hero image sitting underneath it is an exact pixel swap. One synchronous
  // block, so the browser only ever paints the finished state.
  ids.forEach(id => to[id].el.classList.remove('flight-hidden'));
  flightLayer.replaceChildren();
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function flyOne(from, to, i) {
  // The list's thumbnails are lazy and the list starts hidden, so on the very
  // first flight the row <img> can still have naturalWidth 0. Both ends show
  // the same file, so whichever end did report real dimensions speaks for both.
  const nw = from.nw || to.nw, nh = from.nh || to.nh;
  const a = bgFrame({ ...from, nw, nh }), b = bgFrame({ ...to, nw, nh });

  const fly = document.createElement('div');
  fly.className = 'view-flyer';
  fly.style.left            = `${from.rect.left}px`;
  fly.style.top             = `${from.rect.top}px`;
  fly.style.backgroundImage = `url("${from.src}")`;
  // Match the destination's own opacity so the hand-off below is an exact
  // pixel swap rather than a step in brightness.
  fly.style.opacity         = to.opacity;
  flightLayer.appendChild(fly);

  // left/top stay pinned at the start rect; the delta is carried by
  // transform, so only width/height/background-size need to interpolate.
  const anim = fly.animate([
    {
      transform: 'translate(0px, 0px)',
      width: `${from.rect.width}px`, height: `${from.rect.height}px`,
      backgroundSize: a.size, backgroundPosition: a.pos,
    },
    {
      transform: `translate(${to.rect.left - from.rect.left}px, ${to.rect.top - from.rect.top}px)`,
      width: `${to.rect.width}px`, height: `${to.rect.height}px`,
      backgroundSize: b.size, backgroundPosition: b.pos,
    },
  ], {
    duration: FLIGHT_MS,
    delay: i * STAGGER_MS,
    easing: 'cubic-bezier(.6,0,.25,1)',
    fill: 'both',
  });

  // Resolves when this flyer reaches its destination rect; it stays put
  // (fill: 'both') until flyBetweenViews hands off in one go.
  await anim.finished.catch(() => {});
}
