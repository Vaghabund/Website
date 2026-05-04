// ─────────────────────────────────────────────
// Layout constants and positioning math.
// Pure functions — no DOM, no mutable state imports.
// ─────────────────────────────────────────────

// Canvas centre in canvas px
export const CANVAS_CX = 2000;
export const CANVAS_CY = 1500;

// Node sizes in canvas px (must match CSS widths + estimated heights)
export const SZ = {
  title:  { w: 220, h: 38  },
  image:  { w: 190, h: 154 },
  project:{ w: 230, h: 190 },
  text:   { w: 210, h: 373 },
  detail: { w: 148, h: 100 },
  model:  { w: 220, h: 220 },
};

// Fibonacci/golden-angle phyllotaxis spiral for project placement.
// Each project is placed at the golden angle further around, radius grows
// with sqrt(i) so density stays even.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.3999 rad
const FIB_RADIUS   = 620; // scale factor — increase to spread clusters further

export function fibPos(i) {
  const a = i * GOLDEN_ANGLE;
  const r = FIB_RADIUS * Math.sqrt(i + 1);
  return { x: CANVAS_CX + r * Math.cos(a), y: CANVAS_CY + r * Math.sin(a) };
}

// Seeded PRNG (mulberry32)
export function seededRand(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function strSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return h >>> 0;
}

// Satellite positioning — slots spread at equal angles around the title
// centre with seeded jitter to avoid mechanical regularity.
const GAP = 8; // canvas px between node edges

export function halfDiag(type) {
  return Math.sqrt(SZ[type].w ** 2 + SZ[type].h ** 2) / 2;
}

export function satPos(p, slotIndex, type, totalSlots) {
  const n      = Math.max(totalSlots, 3);
  const rand   = seededRand(strSeed(p.id + 'base'));
  const base   = rand() * 2 * Math.PI;
  const jitter = seededRand(strSeed(p.id + type + slotIndex));
  const angle  = base + slotIndex * (2 * Math.PI / n) + (jitter() - 0.5) * 0.3;
  const dist   = halfDiag('title') + halfDiag(type) + GAP;
  return {
    x: p.x + dist * Math.cos(angle),
    y: p.y + dist * Math.sin(angle),
  };
}
