// ─────────────────────────────────────────────
// Landing hub — the intermediate menu shown after the boot intro.
// The centre-dot logo is the visual archive; the three outer petals
// are (future) curated category views; "projects" / "about" / "portfolio"
// under the title box cover the rest.
//
// Landing and the project list share ONE continuous scroll container
// (#hub-scroll): the landing hero is a 100vh section on top, the list
// flows immediately below it. Scrolling from one into the other IS the
// navigation — a "scroll progress" value (0 = landing, 1 = list) is read
// straight from the hero's scroll position every frame and drives the
// logo's fly-to-corner, the background fade, and the magnifier fade
// continuously, so the transition always tracks exactly how far the user
// has scrolled (see applyHubProgress / updateHubProgress).
//
// The node canvas ("visual archive") is a separate, non-scroll-linked
// destination reached by a hard cut (enterCanvas / returnToLandingFromCanvas)
// with its own short tween, since there's no scroll position to hang it on.
// ─────────────────────────────────────────────

import { buildAccordionView } from './mobile.js';
import { openProjectLb }      from './lightbox.js';
import { clearLines }         from './search.js';

const SIZE = 420; // matches the mark's native viewBox
const MAX_SCALE = 3.5;        // scale at zero distance (mouse right on the centre)
const PUSH_DIST = 170;        // svg user-units a neighbour is pushed at full growth
const INFLUENCE_RADIUS = 150; // svg user-units — proximity effect fades to 0 past this
const HOVER_CUTOFF = 0.02;    // hub scroll progress past which hover-growth stops reacting
const SMALL_LOOK_AT = 0.6;    // progress past which the mark swaps to the plain docked look
const DOCK_SIZE = 40;         // px — docked corner mark size, matches #top-right-stack sizing
const DOCK_MARGIN_TOP = 16, DOCK_MARGIN_RIGHT = 20;

// Landing background: one of these, picked at random on every load. Drop the
// image file in media/landing-bg/ and add its filename here — same manually
// curated pattern as PROJECTS in projects.js, so there's no build step.
const BG_IMAGES = [
  'img-1924.webp',
  'structure-up.webp',
  'pose-test.webp',
];
const MAGNIFY = 1.45; // lens zoom factor for the circle magnifiers

// The background filename picked for this load — shared by #landing-bg and the
// per-circle magnifiers so the lens shows the same image it sits over.
let currentBg = null;

// Same path data as media/icons/LOGO.svg (three petals + centre dot).
const ZONES = [
  { d: 'M164.26,23.392c21.179,-27.227 60.479,-32.138 87.706,-10.958c27.227,21.179 32.138,60.479 10.958,87.706c-21.179,27.227 -60.479,32.138 -87.706,10.958c-27.227,-21.179 -32.138,-60.479 -10.958,-87.706Z',   label: 'spatial', target: { view: 'list',   category: 'spatial' } },
  { d: 'M315.148,226.786c31.955,-12.99 68.445,2.408 81.435,34.363c12.99,31.955 -2.408,68.445 -34.363,81.435c-31.955,12.99 -68.445,-2.408 -81.435,-34.363c-12.99,-31.955 2.408,-68.445 34.363,-81.435Z', label: 'coding',  target: { view: 'list',   category: 'coding' } },
  { d: 'M21.168,272.999c4.728,-34.169 36.308,-58.072 70.477,-53.343c34.169,4.728 58.072,36.308 53.343,70.477c-4.728,34.169 -36.308,58.072 -70.477,53.343c-34.169,-4.728 -58.072,-36.308 -53.343,-70.477Z',   label: 'objects', target: { view: 'list',   category: 'objects' } },
  { d: 'M149.877,200.788c4.728,-34.169 36.308,-58.072 70.477,-53.343c34.169,4.728 58.072,36.308 53.343,70.477c-4.728,34.169 -36.308,58.072 -70.477,53.343c-34.169,-4.728 -58.072,-36.308 -53.343,-70.477Z', label: 'archive', target: { view: 'canvas' } },
];

const SVG_NS = 'http://www.w3.org/2000/svg';

let viewToggleBtn, topLeftStack, landingHost, hubScroll, scrollHint;
let dockEl, svgEl, magLayer;
let magLoopActive = false;
let startMagLoop = () => {}; // assigned in buildLogo once the lenses exist

let hubProgress = 0;   // 0 = landing, 1 = fully docked/list
let tweenActive = false; // true while enterCanvas/returnToLandingFromCanvas's own tween owns progress
let lastMouse = null;
let zones = [];

const clamp01 = v => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;

function resetZoneOffsets() {
  svgEl.querySelectorAll('.logo-zone').forEach(g => {
    g.style.transform = '';
    const fill = g.querySelector('.logo-zone-fill');
    if (fill) fill.style.transform = '';
    const rim = g.querySelector('.logo-zone-rim');
    if (rim) rim.style.transform = '';
    const text = g.querySelector('text');
    if (text) text.style.fill = '';
  });
}

// ── Continuous logo-dock positioning (0 = landing centre, 1 = corner) ─────
function applyHubProgress(progress) {
  hubProgress = progress;

  if (dockEl) {
    if (progress <= 0) {
      // Let the CSS rest state (clamp-sized, centred) govern exactly as it
      // does before any JS has run — keeps the two in permanent sync.
      dockEl.style.left = dockEl.style.top = '';
      dockEl.style.width = dockEl.style.height = '';
      dockEl.style.transform = '';
    } else {
      const vw = window.innerWidth, vh = window.innerHeight;
      const landSize = Math.min(380, Math.max(220, 0.46 * vw));
      const landLeft = vw / 2 - landSize / 2, landTop = vh / 2 - landSize / 2;
      const dockLeft = vw - DOCK_MARGIN_RIGHT - DOCK_SIZE, dockTop = DOCK_MARGIN_TOP;
      const size = lerp(landSize, DOCK_SIZE, progress);
      dockEl.style.transform = 'none';
      dockEl.style.width  = `${size}px`;
      dockEl.style.height = `${size}px`;
      dockEl.style.left = `${lerp(landLeft, dockLeft, progress)}px`;
      dockEl.style.top  = `${lerp(landTop,  dockTop,  progress)}px`;
    }
  }

  if (svgEl) {
    svgEl.classList.toggle('is-small', progress > SMALL_LOOK_AT);
    svgEl.classList.toggle('spinning', progress >= 0.999);
  }

  const bg = document.getElementById('landing-bg');
  if (bg) bg.style.opacity = String(1 - progress);

  if (magLayer) magLayer.style.opacity = String(Math.max(0, 1 - progress / 0.5));
  if (scrollHint) scrollHint.style.opacity = String(Math.max(0, 1 - progress * 6));

  if (progress > HOVER_CUTOFF && lastMouse) {
    lastMouse = null;
    resetZoneOffsets();
  }
}

// Reads actual scroll position → progress. Only meaningful while #hub-scroll
// is visible and being scrolled natively (landing ⇄ list); the canvas tween
// below drives applyHubProgress directly instead, bypassing this.
function updateHubProgress() {
  if (tweenActive || !hubScroll || !landingHost) return;
  const rect = landingHost.getBoundingClientRect();
  const progress = clamp01(-rect.top / window.innerHeight);
  applyHubProgress(progress);
  const isList = progress >= 0.999;
  document.body.classList.toggle('list-view', isList);
  document.body.classList.toggle('landing-view', !isList);
}

function tweenProgressTo(target, duration = 600) {
  tweenActive = true;
  const start = hubProgress, startTime = performance.now();
  function step(now) {
    const t = clamp01((now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    applyHubProgress(lerp(start, target, eased));
    if (t < 1) requestAnimationFrame(step);
    else tweenActive = false;
  }
  requestAnimationFrame(step);
}

// ── Hard-cut destination: the node canvas ("visual archive") ──────────────
function enterCanvas() {
  document.body.classList.remove('landing-view', 'list-view');
  tweenProgressTo(1, 600);
}

function returnToLandingFromCanvas() {
  // Order matters: #hub-scroll is display:none while neither class is set,
  // and scrollTop is a no-op on a display:none element — so it must become
  // visible again before we can zero its scroll position.
  document.body.classList.add('landing-view');
  document.body.classList.remove('list-view');
  hubScroll.scrollTop = 0;
  tweenProgressTo(0, 600);
}

// ── Scroll-to destinations within the hub (landing ⇄ list) ────────────────
function scrollToList() {
  hubScroll.scrollTo({ top: landingHost.offsetHeight, behavior: 'smooth' });
}

function scrollToLanding() {
  hubScroll.scrollTo({ top: 0, behavior: 'smooth' });
}

export function showLanding() {
  const inCanvas = !document.body.classList.contains('landing-view') && !document.body.classList.contains('list-view');
  if (inCanvas) returnToLandingFromCanvas();
  else scrollToLanding();
}

async function showList(category) {
  clearLines(); // old search-drawn lines, if any, shouldn't linger for whenever the canvas is next shown
  await buildAccordionView('desktop-list-view', { desktop: true, category });
}

// ── Build the logo hub + nav links, wire up navigation ────────────────────
export function initLanding({ viewToggleBtn: btn }) {
  viewToggleBtn  = btn;
  topLeftStack   = document.getElementById('top-left-stack');
  hubScroll      = document.getElementById('hub-scroll');
  landingHost    = document.getElementById('landing-view');

  buildBackground();
  buildNav();
  buildLogo();
  buildScrollHint();

  // Default list content — the complete project list, unfiltered, visible
  // the moment the user scrolls down without having clicked a category.
  buildAccordionView('desktop-list-view', { desktop: true, category: null });

  if (viewToggleBtn) {
    viewToggleBtn.addEventListener('click', () => enterCanvas());
  }

  hubScroll.addEventListener('scroll', onHubScroll, { passive: true });
  window.addEventListener('resize', updateHubProgress);
  applyHubProgress(0);
}

let scrollRafPending = false;
function onHubScroll() {
  if (scrollRafPending) return;
  scrollRafPending = true;
  requestAnimationFrame(() => {
    scrollRafPending = false;
    updateHubProgress();
  });
}

function buildBackground() {
  if (!landingHost || !BG_IMAGES.length || document.getElementById('landing-bg')) return;
  currentBg = BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)];
  const bg = document.createElement('div');
  bg.id = 'landing-bg';
  bg.style.backgroundImage = `url(media/landing-bg/${currentBg})`;
  landingHost.prepend(bg);
}

function buildScrollHint() {
  if (!landingHost || document.getElementById('landing-scroll-hint')) return;
  scrollHint = document.createElement('div');
  scrollHint.id = 'landing-scroll-hint';
  scrollHint.innerHTML = `
    <span>scroll</span>
    <svg viewBox="0 0 14 9" xmlns="${SVG_NS}"><path d="M1,1 L7,7 L13,1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  landingHost.appendChild(scrollHint);
}

function buildNav() {
  if (!topLeftStack || document.getElementById('landing-nav')) return;
  const nav = document.createElement('nav');
  nav.id = 'landing-nav';

  const projectsLink = document.createElement('a');
  projectsLink.href = '#'; projectsLink.textContent = 'projects';
  projectsLink.addEventListener('click', e => {
    e.preventDefault();
    showList(null);
    scrollToList();
  });

  const aboutLink = document.createElement('a');
  aboutLink.href = '#'; aboutLink.textContent = 'about';
  aboutLink.addEventListener('click', e => { e.preventDefault(); openProjectLb('about'); });

  const portfolioLink = document.createElement('a');
  portfolioLink.href = 'media/portfolio.pdf';
  portfolioLink.download = '';
  portfolioLink.textContent = 'portfolio';

  nav.append(projectsLink, aboutLink, portfolioLink);
  topLeftStack.appendChild(nav);
}

function buildLogo() {
  if (document.getElementById('landing-logo-dock')) return;

  // Always fixed, always a direct child of <body> — never reparented. Its
  // on-screen box is driven purely by applyHubProgress(), so it stays
  // visible and animatable through hard cuts (entering/leaving the canvas)
  // where an ancestor like #hub-scroll gets display:none — a child of a
  // hidden ancestor would vanish instantly, killing the fly-to-corner tween.
  dockEl = document.createElement('div');
  dockEl.id = 'landing-logo-dock';
  document.body.appendChild(dockEl);

  svgEl = document.createElementNS(SVG_NS, 'svg');
  svgEl.id = 'landing-logo';
  svgEl.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svgEl.innerHTML = `
    <defs>
      <linearGradient id="glass-rim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"  stop-color="#fff" stop-opacity="0.95"/>
        <stop offset="30%" stop-color="#fff" stop-opacity="0.08"/>
        <stop offset="65%" stop-color="#fff" stop-opacity="0"/>
        <stop offset="100%" stop-color="#fff" stop-opacity="0.3"/>
      </linearGradient>
    </defs>`;
  dockEl.appendChild(svgEl);

  // Magnifier layer: one HTML lens per circle, sitting between the background
  // and the SVG mark. Each lens shows the SAME background image magnified and
  // aligned to its circle, giving a real optical-lens distortion using only
  // background-image + transform — no SVG filters, canvas, or feImage, so it
  // works in every browser (Brave included). Stays nested in #landing-view
  // (unlike dockEl) since it's cosmetic and always fully faded out via
  // applyHubProgress well before the hub itself is ever hidden.
  magLayer = document.createElement('div');
  magLayer.id = 'zone-mag-layer';
  landingHost.appendChild(magLayer);

  zones = ZONES.map(zone => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.classList.add('logo-zone');

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', zone.d);
    path.classList.add('logo-zone-fill');
    g.appendChild(path);

    // Edge highlight — a gradient-stroked duplicate of the same shape,
    // sitting on top. Only meaningful in the big landing-hub look; swapped
    // out (stroke:none) once .is-small applies.
    const rim = document.createElementNS(SVG_NS, 'path');
    rim.setAttribute('d', zone.d);
    rim.classList.add('logo-zone-rim');
    g.appendChild(rim);

    svgEl.appendChild(g);

    // Per-circle magnifier: a clipped aperture (mag) holding a full-viewport
    // copy of the background (magBg) that's scaled up around this circle's
    // centre. updateMagnifiers() keeps its screen rect + zoom origin synced
    // to the SVG circle every frame.
    const mag = document.createElement('div');
    mag.className = 'zone-mag';
    const magBg = document.createElement('div');
    magBg.className = 'zone-mag-bg';
    if (currentBg) magBg.style.backgroundImage = `url(media/landing-bg/${currentBg})`;
    magBg.style.transform = `scale(${MAGNIFY})`;
    mag.appendChild(magBg);
    magLayer.appendChild(mag);

    // getBBox() needs the path actually laid out in the document, which it
    // is here (#landing-view sits under the opaque intro overlay, not
    // display:none), so this centres the label on the real blob shape
    // rather than a hand-guessed coordinate.
    const box = path.getBBox();
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', cx);
    text.setAttribute('y', cy);
    text.textContent = zone.label;
    g.appendChild(text);

    return { g, path, rim, text, mag, magBg, cx, cy, zone };
  });

  // ── Magnifier sync loop ────────────────────────────────────────────────
  // Runs every frame while the landing hub is visible, mapping each SVG
  // circle's live screen rect onto its lens. A continuous loop (rather than
  // event-driven) so it also tracks the CSS growth/push transitions and the
  // scroll-driven shrink/move after the mouse or scroll stop.
  function updateMagnifiers() {
    zones.forEach(({ path, mag, magBg }) => {
      const r = path.getBoundingClientRect();
      if (r.width < 1) { mag.style.display = 'none'; return; }
      mag.style.display = '';
      mag.style.left   = `${r.left}px`;
      mag.style.top    = `${r.top}px`;
      mag.style.width  = `${r.width}px`;
      mag.style.height = `${r.height}px`;
      // magBg is absolutely positioned inside `mag`, so its local (0,0) is
      // (r.left, r.top) in viewport space — shift it back by that amount so
      // its 100vw/100vh copy still lines up with the real background exactly
      // as if it were viewport-fixed, then zoom around the circle's centre
      // (still expressed in viewport px, since that offset cancels out).
      magBg.style.left = `${-r.left}px`;
      magBg.style.top  = `${-r.top}px`;
      magBg.style.transformOrigin = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
    });
  }
  startMagLoop = () => {
    if (magLoopActive) return;
    magLoopActive = true;
    const loop = () => {
      if (!document.body.classList.contains('landing-view') && !document.body.classList.contains('list-view')) {
        magLoopActive = false;
        return;
      }
      updateMagnifiers();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
  startMagLoop();

  // Continuous proximity reaction: each zone grows the nearer the mouse
  // gets to its centre (smoothstep falloff, zero past INFLUENCE_RADIUS),
  // and every other zone gets shoved away from it in proportion to how
  // much it has grown — several zones can be reacting at once as the
  // mouse crosses between them, rather than a single hard on/off hover.
  // Only live while the mark is still full-size (progress ~0) — once the
  // user starts scrolling, growth/push stop reacting (see applyHubProgress).
  let rafPending = false;
  function updateProximity(clientX, clientY) {
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const pt = svgEl.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const mouse = pt.matrixTransform(ctm.inverse());

    const growth = zones.map(({ cx, cy }) => {
      const dist = Math.hypot(mouse.x - cx, mouse.y - cy);
      const t = Math.max(0, 1 - dist / INFLUENCE_RADIUS);
      return t * t * (3 - 2 * t); // smoothstep
    });

    zones.forEach(({ path, rim, text }, i) => {
      const scale = 1 + (MAX_SCALE - 1) * growth[i];
      const scaleStr = scale === 1 ? '' : `scale(${scale})`;
      path.style.transform = scaleStr;
      rim.style.transform  = scaleStr;
      const fillA = 0.6 + (0.98 - 0.6) * growth[i];
      text.style.fill = `rgba(255,255,255,${fillA.toFixed(3)})`;
    });

    zones.forEach(({ g, cx, cy }, i) => {
      let px = 0, py = 0;
      zones.forEach((other, j) => {
        if (j === i || growth[j] === 0) return;
        const dx = cx - other.cx, dy = cy - other.cy;
        const dist = Math.hypot(dx, dy) || 1;
        px += (dx / dist) * PUSH_DIST * growth[j];
        py += (dy / dist) * PUSH_DIST * growth[j];
      });
      g.style.transform = (px === 0 && py === 0) ? '' : `translate(${px}px, ${py}px)`;
    });
  }

  // Listens on `document`, not landingHost: dockEl (holding the actual
  // circles) is a permanently fixed, never-reparented child of <body> (see
  // buildLogo above), so it's a SIBLING of #landing-view, not a descendant —
  // mouse movement over the circles themselves would never reach a listener
  // scoped to landingHost.
  document.addEventListener('mousemove', e => {
    if (hubProgress > HOVER_CUTOFF) return;
    lastMouse = { x: e.clientX, y: e.clientY };
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      if (lastMouse) updateProximity(lastMouse.x, lastMouse.y);
    });
  });
  document.documentElement.addEventListener('mouseleave', () => { lastMouse = null; resetZoneOffsets(); });

  zones.forEach(({ g, zone }) => {
    g.addEventListener('click', e => {
      if (hubProgress > 0.5) return; // tiny/docked: dockEl's own catch-all click handles it instead
      e.stopPropagation();
      if (zone.target.view === 'canvas') { enterCanvas(); return; }
      showList(zone.target.category);
      scrollToList();
    });
  });

  // Once docked, the individual petals are too small to target — clicking
  // anywhere on the mark returns to the landing hub.
  dockEl.addEventListener('click', () => {
    if (hubProgress > 0.5) showLanding();
  });

  // dockEl sits outside #hub-scroll's own DOM subtree (see buildLogo), so a
  // wheel gesture that lands exactly on one of the (pointer-events:auto)
  // circle shapes has no scrollable ancestor to fall back to natively —
  // forward it to the hub manually so scrolling never dead-zones under the
  // logo. Gaps between petals are pointer-events:none and pass straight
  // through to #hub-scroll's native scrolling underneath, unaffected.
  dockEl.addEventListener('wheel', e => {
    const inHub = document.body.classList.contains('landing-view') || document.body.classList.contains('list-view');
    if (!inHub) return; // canvas mode — let canvas.js's own wheel panning handle it
    e.preventDefault();
    hubScroll.scrollTop += e.deltaY;
  }, { passive: false });
}
