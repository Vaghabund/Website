// ─────────────────────────────────────────────
// Spinning favicon. Redraws media/icons/LOGO.svg onto an
// offscreen canvas each tick, rotated, and swaps the
// <link rel="icon"> href to the resulting PNG data URL.
// ─────────────────────────────────────────────

const SIZE         = 64;    // canvas px — browser downscales to the tab's actual icon size
const ROTATION_MS  = 10000; // full turn — matches the docked logo's spin (see .spinning in style.css)
const FRAME_MS     = 80;    // ~12.5fps; smooth enough at favicon size, cheap on CPU

const link = document.querySelector('link[rel="icon"]');
if (link) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.src = 'media/icons/LOGO.svg';
  img.onload = () => {
    link.type = 'image/png';
    const start = performance.now();
    setInterval(() => {
      const angle = ((performance.now() - start) % ROTATION_MS) / ROTATION_MS * 360;
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      ctx.translate(SIZE / 2, SIZE / 2);
      ctx.rotate(angle * Math.PI / 180);
      ctx.drawImage(img, -SIZE / 2, -SIZE / 2, SIZE, SIZE);
      ctx.restore();
      link.href = canvas.toDataURL('image/png');
    }, FRAME_MS);
  };
}
