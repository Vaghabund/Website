// ─────────────────────────────────────────────────────────────────────────────
// Project registry
//
// HOW TO ADD A PROJECT:
//   1. Create media/projects/<id>/
//   2. Add these files:
//        embedding.md    — curated search text (200–400 words, plain prose)
//        description.md  — text node prose (displayed in lightbox)
//        detail.md       — frontmatter: year, role, timeline, tools, links, images
//   3. Run: node generate-embeddings.js
//   4. Add an entry below (just id, title, x, y)
//   5. Commit
//
// FIELDS:
//   id    — matches the media/projects/<id>/ folder name exactly
//   title — displayed in the title node
//   x, y  — canvas anchor (0,0 = auto spiral layout; non-zero = fixed position)
// ─────────────────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    id: 'about',
    title: 'Joel Tenenberg',
    x: 2600,
    y: 2000,
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
];

export default PROJECTS;
