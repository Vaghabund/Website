# Joel Tenenberg — Portfolio

A canvas-based portfolio. Projects live as clusters of nodes on a pannable, zoomable canvas. A semantic search bar lets visitors find work by concept, keyword, or feeling.

---

## How it works

The canvas holds project **clusters**. Each cluster is a group of nodes orbiting a title node:

| Node | Source | Purpose |
|---|---|---|
| **Title** | `projects.js` | Anchor, draggable |
| **Text** | `description.md` (or listed in `detail.md`) | Prose, opens lightbox |
| **Image** | `detail.md` → `images:` | Stacked image cards, opens lightbox |
| **Detail** | `detail.md` frontmatter | Year, role, tools, links |
| **Model** | `detail.md` → `model:` | Interactive 3D viewer (GLB) |

Semantic search is powered by a local embedding model (`all-mpnet-base-v2`). Each project has a hand-written `embedding.md` that is the only text fed to the embedder — you control exactly what queries find this project.

---

## Adding a new project

### 1. Create the folder

```
media/projects/your-project-id/
```

The folder name becomes the project `id`. It must be lowercase, hyphenated, no spaces.

### 2. Add the files

```
media/projects/your-project-id/
  embedding.md       ← search text (200–400 words, plain prose)
  description.md     ← text node prose (shown in lightbox)
  detail.md          ← frontmatter: year, role, tools, links, images, model, texts
  images/            ← project images
  models/            ← optional .glb files
  documents/         ← optional PDFs
```

#### `embedding.md`

Plain prose, no markdown formatting. This is the **only** text the search model sees — write it like a dense keyword summary. Include:
- What the project **is** (medium, format, context)
- What it is **about** (themes, concepts, subject)
- How it was **made** (tools, methods, techniques)
- Where / when (institution, year)
- Specific words a visitor might search for

```
Master thesis at Universität der Künste Berlin, 2025. Investigates the
operational logic of photogrammetry. Keywords: 3D reconstruction, point
cloud, SfM, algorithms, computer vision, black box, critical theory.
```

#### `description.md`

The prose shown in the text node and its lightbox. Can be as long as you like — it scrolls. Markdown formatting is stripped before display so write in plain paragraphs.

#### `detail.md`

YAML frontmatter only. All fields are optional.

```yaml
---
year: "2025"
role: "Your Role"
timeline: "6 months"
tools:
  - Blender
  - Python
links:
  - label: "Project PDF"
    url: "media/projects/your-project-id/documents/file.pdf"
images:
  - images/01.jpg
  - images/02.jpg
texts:
  - file: description.md
    label: "Overview"
  - file: narrative.md
    label: "The Narrative"
model: "models/object.glb"
---
```

**`texts:`** — optional list of text nodes. Each entry creates one text node in the cluster. If omitted, `description.md` is used automatically as a single text node.

**`images:`** — paths relative to the project folder (`images/01.jpg`) or from the repo root (`media/projects/.../01.jpg`). First image is the thumbnail.

**`model:`** — path to a `.glb` file relative to the project folder. Renders an interactive 3D viewer node. Click the node to activate orbit controls (drag to rotate, scroll to zoom). Click outside or press Escape to deactivate.

### 3. Register the project

Add one entry to `projects.js`:

```js
{
  id: 'your-project-id',   // must match the folder name exactly
  title: 'Your Project Title',
  x: 0,   // leave 0 — spiral layout places it automatically
  y: 0,
},
```

The `about` project uses a fixed `x, y` offset. All other projects are placed in a golden-angle spiral around the search bar.

### 4. Generate embeddings

```bash
node generate-embeddings.js
```

Run this whenever you add a project or edit an `embedding.md`. Requires Node.js and will download the model (~400 MB) to `.model-cache/` on first run.

### 5. Commit

```bash
git add .
git commit -m "Add project: your-project-id"
git push
```

---

## Folder reference

```
/
  index.html              — page shell
  main.js                 — all canvas, cluster, and search logic
  style.css               — all styles
  projects.js             — project registry (id, title, x, y only)
  embeddings.json         — pre-computed search vectors (generated)
  generate-embeddings.js  — Node script to regenerate embeddings
  package.json            — dev dependency (@xenova/transformers)
  media/
    projects/
      _template/          — copy this when adding a new project
      about/              — bio and profile images for the about cluster
      your-project-id/
        embedding.md
        description.md
        detail.md
        images/
        models/
        documents/
```

---

## Development

Serve locally with any static server, e.g.:

```bash
npx serve .
```

No build step. The site is a single HTML page with vanilla JS modules.

---

## Search model

- **Offline (embeddings):** `all-mpnet-base-v2` fp32 via `@xenova/transformers` — runs once in Node when you call `generate-embeddings.js`
- **Browser (queries):** `all-mpnet-base-v2` int8 quantized (~25 MB) via `@huggingface/transformers` CDN — same vector space, loads in the visitor's browser on first visit and is then cached

Both sides must use the same model so query vectors and stored vectors are comparable.
