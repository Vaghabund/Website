// ─────────────────────────────────────────────
// Three.js model viewer — mounted inline in the project lightbox's left
// column, behind a "3D Model" tab (see buildDesktopProjectLayout).
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

// ── Inline model viewer (embedded in project lightbox left column) ─────────
let inlineRenderer = null, inlineControls = null, inlineRaf = null;

export function disposeInlineModel() {
  if (inlineRaf)      { cancelAnimationFrame(inlineRaf); inlineRaf = null; }
  if (inlineRenderer) { inlineRenderer.dispose(); inlineRenderer = null; }
  inlineControls = null;
}

export async function mountInlineModel(src, container) {
  disposeInlineModel();
  const { THREE, GLTFLoader, OrbitControls } = await loadThree();
  const W = container.offsetWidth  || 400;
  const H = container.offsetHeight || 400;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  inlineRenderer = renderer;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 1000);
  camera.position.set(0, 0, 3);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const d1 = new THREE.DirectionalLight(0xffffff, 2.5); d1.position.set(3, 4, 3); scene.add(d1);
  const d2 = new THREE.DirectionalLight(0xffffff, 1.0); d2.position.set(-3, -2, -2); scene.add(d2);

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = true; controls.enablePan = false;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.8;
  controls.enableDamping = true; controls.dampingFactor = 0.07;
  inlineControls = controls;

  new GLTFLoader().load(src, gltf => {
    const obj = gltf.scene;
    const box = new THREE.Box3().setFromObject(obj);
    obj.position.sub(box.getCenter(new THREE.Vector3()));
    obj.scale.multiplyScalar(2.2 / box.getSize(new THREE.Vector3()).length());
    scene.add(obj);
  }, undefined, err => console.warn('GLB load error', src, err));

  function render() { inlineRaf = requestAnimationFrame(render); controls.update(); renderer.render(scene, camera); }
  render();
}
