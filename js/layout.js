// ─────────────────────────────────────────────
// Layout constants and positioning math.
// Pure functions — no DOM, no mutable state imports.
// ─────────────────────────────────────────────

// Canvas centre in canvas px
export const CANVAS_CX = 2000;
export const CANVAS_CY = 1500;

// Node sizes in canvas px (must match CSS widths + estimated heights)
export const SZ = {
  project: { w: 230, h: 190 },
};

// Fibonacci/golden-angle phyllotaxis spiral for project placement.
// Each project is placed at the golden angle further around, radius grows
// with sqrt(i) so density stays even.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.3999 rad
const FIB_RADIUS   = 620; // scale factor — increase to spread projects further

export function fibPos(i) {
  const a = i * GOLDEN_ANGLE;
  const r = FIB_RADIUS * Math.sqrt(i + 1);
  return { x: CANVAS_CX + r * Math.cos(a), y: CANVAS_CY + r * Math.sin(a) };
}
