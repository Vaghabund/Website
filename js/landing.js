// ─────────────────────────────────────────────
// Landing hub — the intermediate menu shown after the boot intro.
// The centre-dot logo is the visual archive; the three outer petals
// are (future) curated category views; "projects" / "about" / "portfolio"
// under the title box cover the rest. Also owns the desktop
// landing ↔ canvas ↔ list view state machine, and the logo's
// centre-stage ↔ top-right-corner docking animation.
// ─────────────────────────────────────────────

import { buildAccordionView } from './mobile.js';
import { openProjectLb }      from './lightbox.js';
import { clearLines }         from './search.js';

const SIZE = 420; // matches the mark's native viewBox
const MAX_SCALE = 3.5;        // scale at zero distance (mouse right on the centre)
const PUSH_DIST = 170;        // svg user-units a neighbour is pushed at full growth
const INFLUENCE_RADIUS = 150; // svg user-units — proximity effect fades to 0 past this

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

let viewToggleBtn, topLeftStack, topRightStack, landingHost;
let dockEl, svgEl, magLayer;
let magLoopActive = false;
let startMagLoop = () => {}; // assigned in buildLogo once the lenses exist

// ── FLIP: measure → relocate → invert → play ───────────────────────────────
// Moves `el` to wherever `relocate()` puts it in the DOM, but makes the move
// itself read as a smooth flight rather than a snap: it captures the
// on-screen box before and after, then animates the visual gap away.
function flipMove(el, relocate, duration = 700) {
  const first = el.getBoundingClientRect();
  el.style.transition = 'none';
  el.style.transform  = 'none';
  relocate();
  const last = el.getBoundingClientRect();
  const dx = first.left - last.left, dy = first.top - last.top;
  const sx = first.width / last.width, sy = first.height / last.height;
  el.style.transformOrigin = 'top left';
  el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  el.getBoundingClientRect(); // force reflow so the inverted start state paints
  requestAnimationFrame(() => {
    el.style.transition = `transform ${duration}ms cubic-bezier(.65,0,.35,1)`;
    el.style.transform  = 'translate(0px, 0px) scale(1, 1)';
  });
}

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

function dockLogo() {
  if (!dockEl || dockEl.dataset.docked === '1') return;
  dockEl.dataset.docked = '1';
  svgEl.classList.remove('spinning');
  resetZoneOffsets();
  flipMove(dockEl, () => topRightStack.prepend(dockEl));
  const onEnd = e => {
    if (e.target !== dockEl || e.propertyName !== 'transform') return;
    dockEl.removeEventListener('transitionend', onEnd);
    if (dockEl.dataset.docked === '1') svgEl.classList.add('spinning');
  };
  dockEl.addEventListener('transitionend', onEnd);
}

function undockLogo() {
  if (!dockEl || dockEl.dataset.docked !== '1') return;
  dockEl.dataset.docked = '0';
  svgEl.classList.remove('spinning');
  flipMove(dockEl, () => landingHost.appendChild(dockEl));
}

// ── View-state machine (landing / canvas / list) ──────────────────────────
// The title box is landing-only (shown/hidden purely via the body class in
// CSS) — it no longer physically moves between containers.
export function setDesktopViewMode(listMode) {
  const wasLanding = document.body.classList.contains('landing-view');
  if (wasLanding) dockLogo();
  document.body.classList.remove('landing-view');
  document.body.classList.toggle('list-view', listMode);
  if (viewToggleBtn) {
    viewToggleBtn.setAttribute('aria-pressed', listMode ? 'true' : 'false');
    viewToggleBtn.textContent = listMode ? 'visual archive' : 'list view';
  }
  if (listMode) clearLines();
}

export function showLanding() {
  setDesktopViewMode(false);
  document.body.classList.add('landing-view');
  undockLogo();
  startMagLoop(); // resume lens tracking (the loop self-stops when landing hides)
}

async function showList(category) {
  await buildAccordionView('desktop-list-view', { desktop: true, category });
  setDesktopViewMode(true);
}

// ── Build the logo hub + nav links, wire up navigation ────────────────────
export function initLanding({ viewToggleBtn: btn }) {
  viewToggleBtn  = btn;
  topLeftStack   = document.getElementById('top-left-stack');
  topRightStack  = document.getElementById('top-right-stack');
  landingHost    = document.getElementById('landing-view');

  buildBackground();
  buildNav();
  buildLogo();

  if (viewToggleBtn) {
    viewToggleBtn.addEventListener('click', () => {
      setDesktopViewMode(!document.body.classList.contains('list-view'));
    });
  }
}

function buildBackground() {
  if (!landingHost || !BG_IMAGES.length || document.getElementById('landing-bg')) return;
  currentBg = BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)];
  const bg = document.createElement('div');
  bg.id = 'landing-bg';
  bg.style.backgroundImage = `url(media/landing-bg/${currentBg})`;
  landingHost.prepend(bg);
}

function buildNav() {
  if (!topLeftStack || document.getElementById('landing-nav')) return;
  const nav = document.createElement('nav');
  nav.id = 'landing-nav';

  const projectsLink = document.createElement('a');
  projectsLink.href = '#'; projectsLink.textContent = 'projects';
  projectsLink.addEventListener('click', e => { e.preventDefault(); showList(null); });

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
  if (!landingHost || document.getElementById('landing-logo-dock')) return;

  // Wrapper handles WHERE the logo is (the FLIP fly-to-corner transform);
  // the svg inside handles the continuous idle spin once docked — kept on
  // separate elements so the two transforms don't fight each other.
  dockEl = document.createElement('div');
  dockEl.id = 'landing-logo-dock';
  dockEl.dataset.docked = '0';
  landingHost.appendChild(dockEl);

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
  // works in every browser (Brave included). Kept as a sibling of the dock
  // (not inside it) so the dock's spin/flip transforms don't turn the lenses'
  // position:fixed layers into a broken containing block.
  magLayer = document.createElement('div');
  magLayer.id = 'zone-mag-layer';
  landingHost.insertBefore(magLayer, dockEl);

  const zones = ZONES.map(zone => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.classList.add('logo-zone');

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', zone.d);
    path.classList.add('logo-zone-fill');
    g.appendChild(path);

    // Edge highlight — a gradient-stroked duplicate of the same shape,
    // sitting on top. Only meaningful in the landing-hub (glass) context;
    // docked it's invisible (stroke:none).
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
  // event-driven) so it also tracks the CSS growth/push transitions after the
  // mouse stops moving.
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
      if (!document.body.classList.contains('landing-view')) { magLoopActive = false; return; }
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

  let lastMouse = null;
  landingHost.addEventListener('mousemove', e => {
    if (dockEl.dataset.docked === '1') return;
    lastMouse = { x: e.clientX, y: e.clientY };
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      if (lastMouse) updateProximity(lastMouse.x, lastMouse.y);
    });
  });
  landingHost.addEventListener('mouseleave', () => { lastMouse = null; resetZoneOffsets(); });

  zones.forEach(({ g, zone }) => {
    g.addEventListener('click', e => {
      if (dockEl.dataset.docked === '1') return; // handled by the dock's own click handler instead
      // dockLogo() (called below) flips dockEl.dataset.docked to '1' before
      // this click finishes bubbling up to the dock's own listener, which
      // would otherwise read the just-set '1' and immediately undo the
      // navigation by treating it as a "click while docked" — stop it here.
      e.stopPropagation();
      if (zone.target.view === 'canvas') setDesktopViewMode(false);
      else showList(zone.target.category);
    });
  });

  // Once docked, the individual petals are too small to target — clicking
  // anywhere on the mark returns to the landing hub.
  dockEl.addEventListener('click', () => {
    if (dockEl.dataset.docked === '1') showLanding();
  });
}
