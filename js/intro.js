// ─────────────────────────────────────────────
// Boot intro: the logo dissolves from heavily pixelated to crisp over 2s
// while spinning down to rest in its upright orientation.
// ─────────────────────────────────────────────

const DURATION  = 2000;
const SIZE      = 420;   // matches the mark's native viewBox
const MIN_GRID  = 6;     // pixelation block grid at t=0 (heavily blocky)
const MAX_GRID  = 150;   // grid at t=1 (effectively crisp at display size)
const SPIN_TURNS = 1.4;  // full rotations before settling at 0deg

// Same path data as media/icons/LOGO.svg (three petals + centre dot).
const LOGO_PATHS = [
  'M164.26,23.392c21.179,-27.227 60.479,-32.138 87.706,-10.958c27.227,21.179 32.138,60.479 10.958,87.706c-21.179,27.227 -60.479,32.138 -87.706,10.958c-27.227,-21.179 -32.138,-60.479 -10.958,-87.706Z',
  'M315.148,226.786c31.955,-12.99 68.445,2.408 81.435,34.363c12.99,31.955 -2.408,68.445 -34.363,81.435c-31.955,12.99 -68.445,-2.408 -81.435,-34.363c-12.99,-31.955 2.408,-68.445 34.363,-81.435Z',
  'M21.168,272.999c4.728,-34.169 36.308,-58.072 70.477,-53.343c34.169,4.728 58.072,36.308 53.343,70.477c-4.728,34.169 -36.308,58.072 -70.477,53.343c-34.169,-4.728 -58.072,-36.308 -53.343,-70.477Z',
  'M149.877,200.788c4.728,-34.169 36.308,-58.072 70.477,-53.343c34.169,4.728 58.072,36.308 53.343,70.477c-4.728,34.169 -36.308,58.072 -70.477,53.343c-34.169,-4.728 -58.072,-36.308 -53.343,-70.477Z',
];

// Gentler than a straight cubic/quint ease-out: keeps visible motion going
// deeper into the timeline instead of flattening out and looking stalled
// in the final second.
const easeOutPow = (t, p) => 1 - Math.pow(1 - t, p);
const easePixel  = t => easeOutPow(t, 1.6);
const easeSpin   = t => easeOutPow(t, 2.6);
const lerp = (a, b, t) => a + (b - a) * t;

function runIntro() {
  const overlay = document.getElementById('intro-overlay');
  const canvas  = document.getElementById('intro-canvas');
  if (!overlay || !canvas) return;
  const ctx = canvas.getContext('2d');

  // Full-resolution render of the mark, used as the pixelation source.
  const source = document.createElement('canvas');
  source.width = source.height = SIZE;
  const sctx = source.getContext('2d');
  sctx.fillStyle = '#fff';
  LOGO_PATHS.forEach(d => sctx.fill(new Path2D(d)));

  // Reused each frame: downscaled (averaged) then upscaled (nearest-neighbour)
  // to produce hard pixel blocks that shrink as the grid resolution grows.
  const tiny = document.createElement('canvas');
  const tctx = tiny.getContext('2d');

  const start = performance.now();

  function frame(now) {
    const t = Math.min(1, (now - start) / DURATION);

    const grid = Math.round(lerp(MIN_GRID, MAX_GRID, easePixel(t)));
    tiny.width = tiny.height = grid;
    tctx.imageSmoothingEnabled = true;
    tctx.drawImage(source, 0, 0, grid, grid);

    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tiny, 0, 0, SIZE, SIZE);

    const spin = lerp(SPIN_TURNS * 360, 0, easeSpin(t));
    canvas.style.transform = `rotate(${spin}deg)`;

    if (t < 1) {
      requestAnimationFrame(frame);
      return;
    }

    // Final frame: perfectly crisp and upright.
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(source, 0, 0);
    canvas.style.transform = 'rotate(0deg)';

    overlay.classList.add('intro-hidden');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  }

  requestAnimationFrame(frame);
}

runIntro();
