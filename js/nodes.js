// ─────────────────────────────────────────────
// Canvas node builders.
// makeNode wraps content in a draggable/resizable
// node shell; the build* functions create each
// specific node type and place it on the canvas.
// ─────────────────────────────────────────────

import { state, clusterNodes, nodePositions, projectDataById, projectNodeById } from './state.js';
import { SZ, satPos }                                from './layout.js';
import { el, place, placeCentered }                  from './dom.js';
import { redrawClusterCurves }                       from './clusters.js';
import { redrawLines }                               from './search.js';
import { openImgLb, openTxtLb, openProjectLb }      from './lightbox.js';
import { openModelLb, loadThree }                    from './three-viewer.js';

// ── Shared node shell ─────────────────────────────────────────────────────
// Returns { nodeEl, content } where content is where the node's body goes.
export function makeNode(cls, label, clusterId, w, h, { resizable = true, aspect = null } = {}) {
  const nodeEl = el('div', `node ${cls}`);
  nodeEl.style.width = w + 'px';
  if (h) nodeEl.style.height = h + 'px';
  nodeEl._clusterId = clusterId;

  const bar = el('div', 'node-bar');
  bar.appendChild(el('span', 'node-bar-label', label));
  nodeEl.appendChild(bar);

  const content = el('div', 'node-content');
  nodeEl.appendChild(content);

  const resizeHandle = resizable ? el('div', 'node-resize') : null;
  if (resizeHandle) nodeEl.appendChild(resizeHandle);

  // Per-node drag via bar — suppresses click propagation if the mouse moved.
  bar.addEventListener('mousedown', e => {
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startL = parseInt(nodeEl.style.left), startT = parseInt(nodeEl.style.top);
    let moved = false;
    function onMove(e) {
      if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 4) moved = true;
      nodeEl.style.left = Math.round(startL + (e.clientX - startX) / state.zoom) + 'px';
      nodeEl.style.top  = Math.round(startT + (e.clientY - startY) / state.zoom) + 'px';
      redrawClusterCurves();
      redrawLines();
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      if (moved) nodeEl.addEventListener('click', e => e.stopPropagation(), { once: true, capture: true });
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  if (!resizeHandle) return { nodeEl, content };

  // Resize via bottom-right dot.
  resizeHandle.addEventListener('mousedown', e => {
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startW = nodeEl.offsetWidth, startH = nodeEl.offsetHeight;
    let moved = false;
    function onMove(e) {
      if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 4) moved = true;
      const newW = Math.max(80, startW + (e.clientX - startX) / state.zoom);
      const ar   = aspect ?? nodeEl._aspect ?? null;
      const newH = ar ? newW * ar : Math.max(40, startH + (e.clientY - startY) / state.zoom);
      nodeEl.style.width  = Math.round(newW) + 'px';
      nodeEl.style.height = Math.round(newH) + 'px';
      nodeEl._cw = Math.round(newW); nodeEl._ch = Math.round(newH);
      redrawClusterCurves();
      if (nodeEl._refreshText) nodeEl._refreshText();
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      if (moved) nodeEl.addEventListener('click', e => e.stopPropagation(), { once: true, capture: true });
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  return { nodeEl, content };
}

// ── Image node ────────────────────────────────────────────────────────────
export function buildImageNode(p, images, rects, slotIndex, totalSlots) {
  if (!images?.length) return;
  const sat      = satPos(p, slotIndex, 'image', totalSlots);
  const srcs     = images; // paths already resolved by caller
  const thumbSrc = src => src.replace(/(\.\w+)$/, '-small.webp');

  const { nodeEl, content } = makeNode('node-image', 'images', p.id, SZ.image.w, SZ.image.h, { aspect: null });
  const stack = el('div', 'image-stack');
  const img   = document.createElement('img');
  img.src = thumbSrc(srcs[0]); img.alt = ''; img.loading = 'lazy';
  let currentIndex = 0;

  function showImage(idx) { currentIndex = idx; img.src = thumbSrc(srcs[idx]); }

  // Snap node to the natural aspect ratio of the first image once it loads.
  img.addEventListener('load', () => {
    if (img.naturalWidth && img.naturalHeight) {
      const ar = img.naturalHeight / img.naturalWidth;
      nodeEl._aspect = ar;
      const newH = Math.round(nodeEl.offsetWidth * ar);
      nodeEl.style.height = newH + 'px';
      nodeEl._ch = newH;
      redrawClusterCurves();
    }
  }, { once: true });

  stack.appendChild(img);
  if (srcs.length > 1) stack.appendChild(el('div', 'image-count', String(srcs.length)));
  content.appendChild(stack);
  nodeEl.addEventListener('click', e => { e.stopPropagation(); openImgLb(srcs, currentIndex); });

  // Register per-image search keys so search lines can point to individual images.
  srcs.forEach((src, idx) => {
    const fileName = src.split('/').pop().replace(/\.\w+$/, '');
    nodePositions[`${p.id}::image::${fileName}`] = { el: nodeEl, imgIndex: idx, showImage };
  });

  placeCentered(nodeEl, sat.x, sat.y, SZ.image.w, SZ.image.h);
  rects.push({ x: sat.x - SZ.image.w / 2, y: sat.y - SZ.image.h / 2, w: SZ.image.w, h: SZ.image.h });
  clusterNodes[p.id].satellites.push({ el: nodeEl, ox: sat.x - p.x, oy: sat.y - p.y, w: SZ.image.w, h: SZ.image.h });
}

// ── Text node ─────────────────────────────────────────────────────────────
export function buildTextNode(p, label, fullText, rects, slotIndex, totalSlots) {
  const sat = satPos(p, slotIndex, 'text', totalSlots);
  const { nodeEl, content } = makeNode('node-text', label, p.id, SZ.text.w, SZ.text.h, { aspect: 4/3 });
  const body   = el('div', 'text-body');
  const toggle = el('span', 'text-toggle');
  content.appendChild(body);
  content.appendChild(toggle);

  // Dynamically show full text or truncated depending on available content height.
  function refreshText() {
    const BAR_H = 20, PAD = 26;
    const available = nodeEl.offsetHeight - BAR_H - PAD;
    body.textContent = fullText;
    const lineH = parseFloat(getComputedStyle(body).lineHeight) || 18;
    const fits  = body.scrollHeight <= available + lineH; // one line tolerance
    if (fits) {
      body.textContent = fullText;
      toggle.textContent = ''; toggle.style.display = 'none';
    } else {
      // Binary-search the character count that fits.
      let lo = 0, hi = fullText.length;
      while (hi - lo > 4) {
        const mid = (lo + hi) >> 1;
        body.textContent = fullText.slice(0, mid) + '…';
        if (body.scrollHeight <= available) lo = mid; else hi = mid;
      }
      body.textContent = fullText.slice(0, lo) + '…';
      toggle.style.display = ''; toggle.textContent = 'read more';
    }
  }

  // Debounce so refreshText only runs after a resize drag settles.
  let refreshTimer = null;
  function scheduleRefresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(refreshText, 16); }

  nodeEl.style.cursor = 'pointer';
  nodeEl.addEventListener('click', e => { e.stopPropagation(); openTxtLb(label, fullText); });
  nodeEl._refreshText = scheduleRefresh;
  requestAnimationFrame(refreshText);

  const nodeKey = `${p.id}::${label.toLowerCase().replace(/\s+/g, '-')}`;
  nodeEl._nodeKey = nodeKey;
  nodePositions[nodeKey] = { el: nodeEl };

  placeCentered(nodeEl, sat.x, sat.y, SZ.text.w, SZ.text.h);
  rects.push({ x: sat.x - SZ.text.w / 2, y: sat.y - SZ.text.h / 2, w: SZ.text.w, h: SZ.text.h });
  clusterNodes[p.id].satellites.push({ el: nodeEl, ox: sat.x - p.x, oy: sat.y - p.y, w: SZ.text.w, h: SZ.text.h });
}

// ── Detail node ───────────────────────────────────────────────────────────
export function buildDetailNode(p, detail, rects, slotIndex, totalSlots) {
  const sat   = satPos(p, slotIndex, 'detail', totalSlots);
  const tools = Array.isArray(detail.tools) ? detail.tools : [];
  const links = Array.isArray(detail.links) ? detail.links : [];
  const { nodeEl, content } = makeNode('node-detail', 'detail', p.id, SZ.detail.w, null, { resizable: false });

  [
    detail.year     && ['Year',     detail.year],
    detail.role     && ['Role',     detail.role],
    detail.timeline && ['Timeline', detail.timeline],
    tools.length    && ['Tools',    tools.join(', ')],
  ].filter(Boolean).forEach(([lbl, val]) => {
    const row = el('div', 'detail-row');
    row.appendChild(el('div', 'detail-label', lbl));
    row.appendChild(el('div', 'detail-value', val));
    content.appendChild(row);
  });

  if (links.length) {
    const row = el('div', 'detail-row');
    row.appendChild(el('div', 'detail-label', 'Links'));
    links.forEach(lnk => {
      const a = document.createElement('a');
      a.href = lnk.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.className = 'detail-link'; a.textContent = lnk.label;
      a.addEventListener('click', e => e.stopPropagation());
      row.appendChild(a);
    });
    content.appendChild(row);
  }

  if (content.children.length) {
    placeCentered(nodeEl, sat.x, sat.y, SZ.detail.w, SZ.detail.h);
    rects.push({ x: sat.x - SZ.detail.w / 2, y: sat.y - SZ.detail.h / 2, w: SZ.detail.w, h: SZ.detail.h });
    clusterNodes[p.id].satellites.push({ el: nodeEl, ox: sat.x - p.x, oy: sat.y - p.y, w: SZ.detail.w, h: SZ.detail.h });
  }
}

// ── 3D Model node ─────────────────────────────────────────────────────────
export function buildModelNode(p, modelPath, rects, slotIndex, totalSlots) {
  if (!modelPath) return;
  const isAbsolute = /^https?:\/\//i.test(modelPath);
  const src = isAbsolute
    ? modelPath
    : modelPath.startsWith('media/')
      ? modelPath
      : `media/projects/${p.id}/${modelPath}`;

  const sat = satPos(p, slotIndex, 'model', totalSlots);
  const W = SZ.model.w, H = SZ.model.h;
  const CW = W, CH = H - 20; // subtract bar height

  const { nodeEl, content } = makeNode('node-model', '3d model', p.id, W, H, { aspect: 3/4 });
  const hint = el('div', 'model-hint', 'click to open');
  content.appendChild(hint);

  nodeEl.addEventListener('click', e => {
    if (e.target.closest('.node-bar')) return;
    e.stopPropagation();
    openModelLb(src);
  });

  placeCentered(nodeEl, sat.x, sat.y, W, H);
  rects.push({ x: sat.x - W/2, y: sat.y - H/2, w: W, h: H });
  clusterNodes[p.id].satellites.push({ el: nodeEl, ox: sat.x - p.x, oy: sat.y - p.y, w: W, h: H });

  // Inline Three.js preview — loaded lazily and paused when off-screen.
  loadThree().then(({ THREE, GLTFLoader, OrbitControls }) => {
    requestAnimationFrame(() => {
      const CW2 = content.offsetWidth  || CW;
      const CH2 = content.offsetHeight || CH;

      const canvas = document.createElement('canvas');
      content.insertBefore(canvas, hint);

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(CW2, CH2);
      canvas.style.position = 'absolute'; canvas.style.top = '0'; canvas.style.left = '0';
      renderer.setClearColor(0x0a0a0a, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, CW2 / CH2, 0.01, 1000);
      camera.position.set(0, 0, 3);

      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      const d1 = new THREE.DirectionalLight(0xffffff, 2.5); d1.position.set(3,  4,  3); scene.add(d1);
      const d2 = new THREE.DirectionalLight(0xffffff, 1.0); d2.position.set(-3, -2, -2); scene.add(d2);

      const controls = new OrbitControls(camera, canvas);
      controls.enableZoom = false; controls.enablePan = false;
      controls.autoRotate = true; controls.autoRotateSpeed = 1.2;
      controls.enableDamping = true; controls.dampingFactor = 0.08;

      new GLTFLoader().load(src, gltf => {
        const obj = gltf.scene;
        const box = new THREE.Box3().setFromObject(obj);
        obj.position.sub(box.getCenter(new THREE.Vector3()));
        obj.scale.multiplyScalar(2.2 / box.getSize(new THREE.Vector3()).length());
        scene.add(obj);
      }, undefined, err => console.warn('GLB load error', src, err));

      // Pause RAF loop when the node scrolls out of the viewport.
      let raf = null;
      function startRender() {
        if (raf) return;
        function loop() { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); }
        loop();
      }
      function stopRender() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) startRender(); else stopRender(); },
        { threshold: 0 }
      );
      observer.observe(nodeEl);
    });
  });
}

// ── Project node (title + image preview) ─────────────────────────────────
export function buildProjectNode(p, detail, texts, images) {
  const W = SZ.project.w, H = SZ.project.h;
  const { nodeEl, content } = makeNode('node-image node-project', p.title, p.id, W, H, { resizable: false });

  const stack     = el('div', 'image-stack');
  const img       = document.createElement('img');
  const imageSrcs = images.length ? images : ['media/logo/joel-logo.webp'];
  img.src = imageSrcs[0]; img.alt = `${p.title} preview`; img.loading = 'lazy';
  stack.appendChild(img);
  if (imageSrcs.length > 1) stack.appendChild(el('div', 'image-count', String(imageSrcs.length)));
  content.appendChild(stack);

  function showImage(idx) { img.src = imageSrcs[Math.max(0, Math.min(idx, imageSrcs.length - 1))]; }

  nodeEl.addEventListener('click', e => {
    if (e.target.closest('.node-bar')) return;
    e.stopPropagation();
    openProjectLb(p.id);
  });

  placeCentered(nodeEl, p.x, p.y, W, H);
  nodePositions[`${p.id}::project`] = { el: nodeEl, showImage, imgIndex: 0 };
  projectNodeById[p.id] = nodeEl;

  const modelSrc = detail.model
    ? (/^https?:\/\//i.test(detail.model)
        ? detail.model
        : detail.model.startsWith('media/')
          ? detail.model
          : `${detail._aboutBase ? 'media/about' : `media/projects/${p.id}`}/${detail.model}`)
    : null;

  const hasDetail = !!(detail.year || detail.role || detail.timeline || detail.tools?.length || detail.links?.length);

  projectDataById[p.id] = { project: p, detail, texts, images: imageSrcs, hasDetail, modelSrc };
}
