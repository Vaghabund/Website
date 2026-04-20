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
//   x, y  — canvas anchor (0,0 = spiral layout; about uses a fixed offset)
// ─────────────────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    id: 'about',
    title: 'Joel Tenenberg',
    x: 1400,
    y: 900,
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
];

export default PROJECTS;
