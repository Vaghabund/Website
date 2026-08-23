// ─────────────────────────────────────────────────────────────────────────────
// Project registry
//
// HOW TO ADD A PROJECT: see CLAUDE.md ("Adding a new project") for the full
// recipe — folder layout, detail.md fields, image pipeline. Short version:
//   1. Create media/projects/<id>/ with description.md, embedding.md, detail.md
//   2. Drop raw images in images/, run: npm run optimize-images -- <id>
//   3. Add an entry below (just id, title, x, y)
//   4. Run: npm run embeddings
//   5. Commit
//
// FIELDS:
//   id       — matches the media/projects/<id>/ folder name exactly
//   title    — displayed in the title node
//   x, y     — canvas anchor (0,0 = auto spiral layout; non-zero = fixed position)
//   category — 'spatial' | 'coding' | 'objects' | null — which landing-hub
//              circle this project shows up under in the filtered list view.
//              Unassigned (null) projects only appear in the unfiltered list.
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
    category: null,
  },
  {
    id: 'vision-of-the-hybrid',
    title: 'Vision of the Hybrid',
    x: 0,
    y: 0,
    category: null,
  },
  {
    id: 'greyhound',
    title: 'Greyhound',
    x: 0,
    y: 0,
    category: null,
  },
  {
    id: 'handheld-pixelsorter',
    title: 'Handheld Pixelsorter',
    x: 0,
    y: 0,
    category: null,
  },
  {
    id: 'c4d2gs',
    title: 'C4D2GS',
    x: 0,
    y: 0,
    category: null,
  },
  {
    id: 'txt2mesh',
    title: 'Txt2Mesh',
    x: 0,
    y: 0,
    category: null,
  },
];

export default PROJECTS;
