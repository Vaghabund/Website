// ─────────────────────────────────────────────────────────────────────────────
// Project registry
//
// HOW TO ADD A PROJECT: see CLAUDE.md ("Adding a new project") for the full
// recipe — folder layout, detail.md fields, image pipeline. Short version:
//   1. Create media/projects/<id>/ with description.md, detail.md
//   2. Drop raw images in images/, run: npm run optimize-images -- <id>
//   3. Add an entry below (just id, title, x, y)
//   4. Commit
//
// FIELDS:
//   id       — matches the media/projects/<id>/ folder name exactly
//   title    — displayed in the title node
//   x, y     — canvas anchor (0,0 = auto-placed on the ring; non-zero = pinned)
// ─────────────────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    // The bio. Never placed on the canvas and never given a list row on
    // desktop — it is opened from the top-bar "about" link (see
    // js/view-switch.js), so it carries no x/y. Mobile, which has no project
    // lightbox, still shows it as the last accordion row.
    id: 'about',
    title: 'Joel Tenenberg',
  },
  {
    id: 'operational-analysis-of-photogrammetry',
    title: 'Operational Analysis of Photogrammetry',
    x: 0,
    y: 0,
  },
  {
    id: 'vision-of-the-hybrid',
    title: 'Vision of the Hybrid',
    x: 0,
    y: 0,
  },
  {
    id: 'greyhound',
    title: 'Greyhound',
    x: 0,
    y: 0,
  },
  {
    id: 'handheld-pixelsorter',
    title: 'Handheld Pixelsorter',
    x: 0,
    y: 0,
  },
  {
    id: 'c4d2gs',
    title: 'C4D2GS',
    x: 0,
    y: 0,
  },
  {
    id: 'txt2mesh',
    title: 'Txt2Mesh',
    x: 0,
    y: 0,
  },
];

export default PROJECTS;
