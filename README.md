# Joel Tenenberg — Portfolio

A canvas-based portfolio. Each project lives as a single draggable node on a pannable, zoomable canvas. Clicking a node opens a project lightbox with images, prose, detail fields, and an optional 3D model viewer. A semantic search bar lets visitors find work by concept, keyword, or feeling.

No build step. Vanilla JS ES modules, single HTML file.

---

## Architecture overview

```
index.html          HTML shell — DOM structure, lightbox scaffolding
main.js             Entry point — detects mobile/desktop, orchestrates init
projects.js         Project registry — id, title, canvas position
style.css           All styles
embeddings.json     Pre-computed 768-dim search vectors (generated)
generate-embeddings.js  Node script to regenerate embeddings

js/
  state.js          Shared mutable state and DOM refs (the hub)
  canvas.js         Pan, zoom, drag — desktop only
  nodes.js          Node builders, project card logic
  lightbox.js       Image lightbox, project lightbox, model viewer trigger
  three-viewer.js   Three.js 3D model viewer (lazy-loaded)
  search.js         Semantic search, autocomplete, SVG lines
  mobile.js         Mobile accordion and desktop list view
  dom.js            DOM creation helpers
  layout.js         Canvas constants, Fibonacci spiral geometry
  utils.js          Markdown parsing, fetch wrappers, frontmatter parser
  footer.js         Footer and Impressum modal

media/
  projects/{id}/    One folder per project, including about/
  search-keywords.md  Autocomplete keyword list
  icons/            Site header SVG and other UI icons
```

---

## Module reference

### `js/state.js` — shared state hub
All stateful modules import from here. No side effects.

| Export | Type | Description |
|---|---|---|
| `IS_MOBILE` | bool | Computed once at load (`max-width:600px` or coarse pointer in landscape) |
| `MIN_ZOOM` | number | `0.2` |
| `MAX_ZOOM` | number | `3.0` |
| `INITIAL_ZOOM` | number | `0.6` |
| `state` | object | Live mutable state: `zoom`, `pan {x,y}`, `searchActive`, `keywordList`, `activeSuggestion`, `lineScores` |
| `canvasRoot` | Element | `#canvas-root` |
| `lineSvg` | Element | `#line-overlay` |
| `inputWrap` | Element | `#input-wrap` |
| `inputEl` | Element | `#query-input` |
| `suggestionEl` | Element | `#query-suggestion` |
| `sendBtn` | Element | `#send-btn` |
| `loadDot` | Element | `#loading-dot` |
| `nodePositions` | object | `nodeKey → { el, imgIndex? }` — written by nodes.js, read by search.js |
| `projectDataById` | object | `id → { project, detail, texts, images, hasDetail, modelSrc }` |
| `projectNodeById` | object | `id → DOM element` |

---

### `js/layout.js` — geometry and positioning
Pure functions, no imports.

| Export | Type | Description |
|---|---|---|
| `CANVAS_CX` | number | Canvas centre X (2000px) |
| `CANVAS_CY` | number | Canvas centre Y (1500px) |
| `SZ` | object | Node sizes: `SZ.project = { w: 230, h: 190 }` |

---

### `js/canvas.js` — pan / zoom / drag
Desktop only. No exports — all side effects run at module evaluation.

- **Pan:** Mousedown on empty canvas begins drag. Mouseup ends. Canvas gets `.dragging` class during drag.
- **Zoom:** Wheel → exponential zoom (`zoom * exp(-deltaY * 0.001)`), world point under cursor stays fixed. Skipped in list view and inside overlay containers.
- **Touch pinch:** Two-finger pinch drives the same `doZoom()`.
- **`applyTransform()`** — Sets `translate(panX, panY) scale(zoom)` on `#canvas-root` and calls `redrawLines()`.
- RAF-throttled; `rafPending` flag prevents stacked frames.
- Overlay guard selectors: `#project-lightbox, #model-lightbox, #impressum-lightbox, #plb-inner` — interactions inside these never pan or zoom the canvas.

---

### `js/nodes.js` — node builders
| Export | Description |
|---|---|
| `makeNode(cls, label, w, h, options)` → `{nodeEl, content}` | Creates a draggable/resizable node shell with a title bar and body div. `options.resizable` (default true), `options.aspect` for locked ratio. |
| `buildProjectNode(p, detail, texts, images)` | Creates one project card on the canvas. Stores data in `projectDataById`. Shows first image as thumbnail + image count badge. Click opens project lightbox. Registers in `nodePositions` and `projectNodeById`. |

Internals:
- **Node drag:** Mousedown on `.node-bar` → drag updates position in canvas coords (accounting for zoom). Click suppressed if mouse moved >4px.
- **Node resize:** Mousedown on `.node-resize` → resize, optional aspect ratio, min 80×40px.
- `placeCentered(el, cx, cy, w, h)` — centres node at canvas coords (cx, cy).
- `queueCacheDims(node)` — batches `offsetWidth/Height` reads into next RAF.

---

### `js/lightbox.js` — image and project modals
| Export | Description |
|---|---|
| `openImgLb(imgs, i)` | Opens image lightbox at index i. Arrow keys / prev/next navigate. Escape or backdrop closes. |
| `openProjectLb(projectId)` | Opens project detail lightbox. Reads from `projectDataById`. |

Project lightbox layout:
- Desktop (≥860px): two-column — images left, text + detail fields right.
- Mobile (<860px): single column, images then text.
- Detail fields rendered: year, role, timeline, tools, links (from `detail.md` frontmatter).
- If `modelSrc` is set, shows "Open 3D Model" button → calls `openModelLb()`.
- All lightboxes close on Escape. Close buttons wired at module load.

---

### `js/three-viewer.js` — 3D model viewer
| Export | Description |
|---|---|
| `loadThree()` | Lazy-loads and caches Three.js + GLTFLoader + OrbitControls. Returns promise. |
| `openModelLb(src)` | Opens `#model-lightbox`, creates WebGL renderer, loads .glb, starts render loop. |
| `closeModelLb()` | Closes modal, cancels animation frame, disposes renderer and geometry. |

Scene setup: perspective camera 45°, ambient light 1.5 + two directional lights (2.5 and 1.0), OrbitControls with auto-rotate (0.8°/frame), damping 0.07, zoom enabled, pan disabled. Model is auto-centred and scaled to fit (2.2× bounding sphere). Tone mapping: ACES filmic, exposure 1.4, sRGB output.

---

### `js/search.js` — semantic search and autocomplete
| Export | Description |
|---|---|
| `init()` | Loads Transformers.js, fetches `embeddings.json`, enables input. Returns promise. |
| `bindSearchEvents()` | Wires input, send button, keyboard handlers. |
| `refreshSuggestion()` | Updates `#query-suggestion` ghost text from `state.keywordList`. |
| `redrawLines()` | Clears and redraws search result SVG lines (canvas → screen coord conversion). |
| `clearLines()` | Resets `state.lineScores`, hides lines, resets send button. |
| `syncSendButtonState()` | Sets send button to → or × depending on `state.searchActive`. |

Search flow:
1. Input text embedded with `bge-base-en-v1.5` int8 (CDN, lazy-loaded).
2. Cosine similarity computed against all vectors in `embeddings.json`.
3. Results filtered: score ≥ 0.25 × max score.
4. Lines drawn as cubic Bézier paths from input box to rect edge of each matching node.
5. Line weight: `sqrt(score) ^ 1.8` drives stroke-width and opacity.
6. Paths animated via `stroke-dasharray` with 40ms stagger per line.

Coordinate helpers:
- `c2s(cx, cy)` — canvas coords → screen coords using `state.pan` and `state.zoom`.
- `rectEdgePoint(rx, ry, rw, rh, tx, ty)` — point on rect edge closest to target.

Autocomplete:
- Keywords fetched from `media/search-keywords.md`, stored in `state.keywordList`.
- Shift accepts current ghost suggestion.

---

### `js/mobile.js` — mobile accordion and list view
| Export | Description |
|---|---|
| `buildMobileView()` | Builds mobile accordion in `#mobile-view`. |
| `buildAccordionView(containerId)` | Generic accordion builder, reused for `#desktop-list-view`. |

- One accordion item per project. Only one open at a time.
- Content lazy-loaded on first expand: images, description text, detail fields.
- Desktop list view uses the same accordion, shown when view-toggle pressed.
- About item fetches `media/about/bio.md` + `profile-small.webp`.

---

### `js/dom.js` — DOM helpers
| Export | Description |
|---|---|
| `el(tag, cls, txt)` | Creates element with optional class and text content. |
| `cacheDims(e)` | Stores `offsetWidth/Height` as `_cw/_ch` on the element. |
| `queueCacheDims(node)` | Batches `cacheDims` calls in next RAF. |
| `place(node, x, y)` | Appends node to `#canvas-root` at canvas position (x, y). |
| `placeCentered(node, cx, cy, w, h)` | Same, centred at (cx, cy). |

---

### `js/utils.js` — text processing and fetch wrappers
| Export | Description |
|---|---|
| `stripMd(txt)` | Removes YAML frontmatter, headers, bold, links, lists. Returns plain text. |
| `fetchMdBody(id)` | Fetches `media/projects/{id}/description.md`, strips markdown. |
| `parseKeywordMd(txt)` | Parses keyword list (one per line, removes list markers, deduplicates). |
| `fetchKeywords()` | Fetches and parses `media/search-keywords.md`. |
| `parseFrontmatter(txt)` | Regex-based YAML frontmatter parser. Handles scalars, inline arrays, and lists of `{label, url}` objects. |
| `fetchDetail(id)` | Fetches `media/projects/{id}/detail.md`, returns parsed frontmatter object. |

---

### `js/footer.js` — footer and impressum
No imports. Self-contained. `buildFooter()` creates the footer DOM (Instagram link, dynamic copyright year, Impressum button) and the `#impressum-lightbox` with TMG § 5 legal text.

---

## DOM structure (index.html)

| ID | Purpose |
|---|---|
| `site-header` | Fixed top-left: logo + intro text |
| `canvas-root` | 8000×4000px transformed canvas, holds all nodes |
| `dot-grid` | SVG background grid (same size as canvas) |
| `line-overlay` | Fixed viewport SVG for search result lines |
| `input-wrap` | Search bar container (fixed, bottom-centre) |
| `query-input` | Text input |
| `query-suggestion` | Ghost-text autocomplete overlay |
| `send-btn` | → / × toggle button |
| `loading-dot` | Pulse animation while embedder loads |
| `no-results` | "nothing found" message |
| `view-toggle` | Canvas ↔ list view toggle button |
| `desktop-list-view` | Accordion list (desktop) |
| `mobile-view` | Accordion list (mobile) |
| `lightbox` | Image viewer modal |
| `project-lightbox` | Project detail modal |
| `plb-inner` | Project modal scroll container |
| `model-lightbox` | Three.js 3D model modal |
| `mlb-canvas-wrap` | WebGL renderer target |
| `site-footer` | Footer (copyright, links, impressum button) |
| `impressum-lightbox` | Legal info modal |

Node classes on canvas: `.node`, `.node-bar`, `.node-bar-label`, `.node-resize`, `.node-image`, `.node-project`, `.image-stack`, `.image-count`.

---

## Data files

### `projects.js`
Array of `{ id, title, x, y }`. `x` and `y` are set to 0 for randomly-placed projects; `main.js` assigns a random position within a 300px radius of canvas centre at load time. Fixed positions (non-zero `x`/`y`) are used as-is.

### `embeddings.json`
```json
{
  "project-id::project": [0.057, 0.054, ...],
  ...
}
```
768-element Float32 vectors, one per project. Key format: `{id}::project`. Generated by `generate-embeddings.js`, consumed by `search.js` in the browser.

### `media/projects/{id}/`

| File | Purpose |
|---|---|
| `embedding.md` | Plain prose (~250–450 tokens). The **only** text fed to the embedder — write it as a dense keyword summary of what the project is, does, uses, and means. |
| `description.md` | Prose shown in the project lightbox. Any length; markdown is stripped before display. |
| `detail.md` | YAML frontmatter: `year`, `role`, `timeline`, `tools` (array), `links` (array of `{label, url}`), `images` (array of paths), `model` (glb path), `texts` (array of `{file, label}`). |
| `images/*.webp` | Project images. First image = thumbnail on the canvas node. |
| `models/*.glb` | Optional 3D model file. |
| `documents/` | Optional PDFs or downloads linked from `detail.md`. |

### `media/search-keywords.md`
One keyword per line (markdown list format). Autocomplete source. No embedding regeneration needed when edited.

---

## Coordinate systems

| Space | Range | Notes |
|---|---|---|
| Canvas space | 0–8000 × 0–4000px | Node positions stored here |
| Screen space | 0–vw × 0–vh | Search lines drawn here |
| Conversion | `screen = pan + canvas * zoom` | `c2s()` in search.js |
| Inverse | `canvas = (screen - pan) / zoom` | Used for node drag |

---

## Initialisation sequence (desktop)

1. `main.js` assigns random positions (uniform disk, max radius 300px from canvas centre) to all projects without a fixed position.
2. Dynamically imports `canvas.js`, `search.js`, `nodes.js`, `lightbox.js`, `utils.js` in parallel.
3. Each module's side effects run (pan/zoom handlers, lightbox close buttons, etc.).
4. Fetches `detail.md` and images for all projects; calls `buildProjectNode()` for each.
5. Builds desktop accordion (`buildAccordionView`), wires view-toggle button.
6. Calls `search.init()` → loads Transformers.js CDN, fetches `embeddings.json`.
7. Calls `search.bindSearchEvents()`, enables input.
8. Calls `buildFooter()`.

Mobile path: skip steps 1–2 and 4–8, call `buildMobileView()` then `buildFooter()`. Canvas, search, and lightboxes are not loaded on mobile.

---

## Adding a new project

1. Create `media/projects/your-id/` with `embedding.md`, `description.md`, `detail.md`, and an `images/` folder.
2. Add an entry to `projects.js` (`x: 0, y: 0` for auto spiral placement).
3. Run `node generate-embeddings.js` to update `embeddings.json`.
4. Commit `projects.js`, `embeddings.json`, and the new `media/projects/your-id/` folder.

Serve locally with any static server (e.g. `npx serve .`). No build step.

---

## Search model

- **Offline (embeddings generation):** `bge-base-en-v1.5` fp32, via `@xenova/transformers` in Node.js. Run once per change to `embedding.md` files.
- **Browser (query embedding):** `bge-base-en-v1.5` int8 quantized, via `@huggingface/transformers` CDN. Lazy-loaded on first search, then browser-cached.
- Both sides produce 768-dim vectors in the same embedding space. Max sequence length: 512 tokens — keep `embedding.md` under ~450 tokens to avoid truncation.
