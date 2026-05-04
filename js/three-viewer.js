// ─────────────────────────────────────────────
// Three.js model viewer.
// Three.js and its loaders are imported lazily
// on first use so they don't block page load.
// ─────────────────────────────────────────────

// Cached Three.js modules — loaded once on first interaction.
let threeCache = null;

export async function loadThree() {
  if (threeCache) return threeCache;
  const THREE            = await import('three');
  const { GLTFLoader }   = await import('three/addons/loaders/GLTFLoader.js');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  threeCache = { THREE, GLTFLoader, OrbitControls };
  return threeCache;
}

// ── Shared model lightbox ─────────────────────────────────────────────────
const modelLightbox = document.getElementById('model-lightbox');
const mlbCanvasWrap = document.getElementById('mlb-canvas-wrap');

let mlbRenderer = null, mlbControls = null, mlbRaf = null;

export function closeModelLb() {
  modelLightbox.classList.remove('open');
  // Stop rendering while the lightbox is hidden.
  if (mlbRaf) { cancelAnimationFrame(mlbRaf); mlbRaf = null; }
}

function disposeMlb() {
  if (mlbRaf)      { cancelAnimationFrame(mlbRaf); mlbRaf = null; }
  if (mlbRenderer) { mlbRenderer.dispose(); mlbRenderer = null; }
  mlbControls = null;
  mlbCanvasWrap.innerHTML = '';
}

export async function openModelLb(src) {
  // Dispose any previous session before starting a new one.
  disposeMlb();
  modelLightbox.classList.add('open');

  const { THREE, GLTFLoader, OrbitControls } = await loadThree();
  const W = mlbCanvasWrap.offsetWidth  || 600;
  const H = mlbCanvasWrap.offsetHeight || 600;

  const canvas = document.createElement('canvas');
  mlbCanvasWrap.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(W, H);
  renderer.setClearColor(0x080808, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  mlbRenderer = renderer;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 1000);
  camera.position.set(0, 0, 3);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const d1 = new THREE.DirectionalLight(0xffffff, 2.5); d1.position.set(3,  4,  3); scene.add(d1);
  const d2 = new THREE.DirectionalLight(0xffffff, 1.0); d2.position.set(-3, -2, -2); scene.add(d2);

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = true; controls.enablePan = false;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.8;
  controls.enableDamping = true; controls.dampingFactor = 0.07;
  mlbControls = controls;

  new GLTFLoader().load(src, gltf => {
    const obj = gltf.scene;
    const box = new THREE.Box3().setFromObject(obj);
    obj.position.sub(box.getCenter(new THREE.Vector3()));
    obj.scale.multiplyScalar(2.2 / box.getSize(new THREE.Vector3()).length());
    scene.add(obj);
  }, undefined, err => console.warn('GLB load error', src, err));

  function render() { mlbRaf = requestAnimationFrame(render); controls.update(); renderer.render(scene, camera); }
  render();
}

// Wire close button and backdrop click once at module load.
document.getElementById('mlb-close').onclick = closeModelLb;
modelLightbox.addEventListener('click', e => { if (e.target === modelLightbox) closeModelLb(); });
