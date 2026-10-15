// ─────────────────────────────────────────────
// View switch — node canvas ⇄ project index.
//
// The boot intro hands straight over to the node canvas; a small toggle at
// the top of the screen is the only navigation between the two views.
// Switching is a plain crossfade (see body.list-view in style.css) — the list
// is a text index with no thumbnails, so there is nothing to fly between.
// ─────────────────────────────────────────────

import { buildProjectList }  from './list.js';
import { openProjectLb }      from './lightbox.js';

// Same path data as media/icons/LOGO.svg (three petals + centre dot).
const LOGO_PATHS = [
  'M164.26,23.392c21.179,-27.227 60.479,-32.138 87.706,-10.958c27.227,21.179 32.138,60.479 10.958,87.706c-21.179,27.227 -60.479,32.138 -87.706,10.958c-27.227,-21.179 -32.138,-60.479 -10.958,-87.706Z',
  'M315.148,226.786c31.955,-12.99 68.445,2.408 81.435,34.363c12.99,31.955 -2.408,68.445 -34.363,81.435c-31.955,12.99 -68.445,-2.408 -81.435,-34.363c-12.99,-31.955 2.408,-68.445 34.363,-81.435Z',
  'M21.168,272.999c4.728,-34.169 36.308,-58.072 70.477,-53.343c34.169,4.728 58.072,36.308 53.343,70.477c-4.728,34.169 -36.308,58.072 -70.477,53.343c-34.169,-4.728 -58.072,-36.308 -53.343,-70.477Z',
  'M149.877,200.788c4.728,-34.169 36.308,-58.072 70.477,-53.343c34.169,4.728 58.072,36.308 53.343,70.477c-4.728,34.169 -36.308,58.072 -70.477,53.343c-34.169,-4.728 -58.072,-36.308 -53.343,-70.477Z',
];

const SVG_NS = 'http://www.w3.org/2000/svg';

let toggleEl, list;
let isList = false;

export function initViewSwitch() {
  toggleEl = document.getElementById('view-toggle');

  // Built up front so the index is ready the moment it is first shown; its
  // first project only opens on that first visit (see activateDefault).
  buildProjectList('desktop-list-view').then(l => { list = l; if (isList) list.activateDefault(); });

  buildLogoMark();

  toggleEl?.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view === 'list'));
  });

  // The bio has no canvas node and no index entry — this link is its only way
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

function setView(wantList) {
  if (wantList === isList) return;
  isList = wantList;
  syncToggle();
  document.body.classList.toggle('list-view', isList);
  if (isList) list?.activateDefault();
}
