# Joel Tenenberg — Portfolio

A canvas-based portfolio. Each project lives as a single draggable node on a pannable, zoomable canvas. Clicking a node opens a project lightbox with images, prose, detail fields, and an optional 3D model viewer.

No build step. Vanilla JS ES modules, single HTML file.

---

## Architecture overview

```
index.html          HTML shell — DOM structure, lightbox scaffolding
main.js             Entry point — detects mobile/desktop, orchestrates init
projects.js         Project registry — id, title, canvas position
style.css           All styles

scripts/
  optimize-images.js      Node script to process/rename raw project images

js/
  state.js          Shared mutable state and DOM refs (the hub)
  canvas.js         Pan, zoom, drag — desktop only
  nodes.js          Node builders, project card logic
  theme-lines.js    Hover-triggered project connection lines on the canvas
  lightbox.js       Image lightbox, project lightbox, model viewer trigger
  three-viewer.js   Three.js 3D model viewer (lazy-loaded)
  view-switch.js    Node canvas ⇄ project index toggle (a crossfade)
  list.js           Project index — left-bound list + detail pane (desktop), wordmark + menu + project pages (mobile)
  dom.js            DOM creation helpers
  layout.js         Canvas/node-size constants
  utils.js          Markdown parsing, fetch wrappers, frontmatter parser
  footer.js         Footer and Impressum modal
  intro.js          Boot intro canvas animation
  favicon-spin.js   Spinning tab favicon

media/
  projects/{id}/    One folder per project, including about/
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
| `INITIAL_ZOOM` | number | `0.8` |
| `state` | object | Live mutable state: `zoom`, `pan {x,y}` |
| `canvasRoot` | Element | `#canvas-root` |
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
- **`applyTransform()`** — Sets `translate(panX, panY) scale(zoom)` on `#canvas-root`.
- RAF-throttled; `rafPending` flag prevents stacked frames.
- Overlay guard selectors: `#project-lightbox, #impressum-lightbox, #plb-inner` — interactions inside these never pan or zoom the canvas.

---

### `js/nodes.js` — node builders
| Export | Description |
|---|---|
| `makeNode(cls, label, w, h, options)` → `{nodeEl, content}` | Creates a draggable/resizable node shell with a title bar and body div. `options.resizable` (default true), `options.aspect` for locked ratio. |
| `registerProjectData(p, detail, texts, images)` | Resolves `modelSrc`/`hasDetail` and stores the entry in `projectDataById` — everything `openProjectLb()` needs, with no canvas node. Used directly for `about`. |
| `buildProjectNode(p, detail, texts, images)` | Calls `registerProjectData`, then creates the project card on the canvas. Shows first image as thumbnail + image count badge. Click opens project lightbox. Registers in `projectNodeById`. |

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
- If `modelSrc` is set, an "3D Model" tab swaps the gallery for an inline viewer via `mountInlineModel()`.
- All lightboxes close on Escape. Close buttons wired at module load.

---

### `js/three-viewer.js` — 3D model viewer
| Export | Description |
|---|---|
| `loadThree()` | Lazy-loads and caches Three.js + GLTFLoader + OrbitControls. Returns promise. |
| `mountInlineModel(src, container)` | Creates a WebGL renderer in `container`, loads the .glb, starts the render loop. Mounted in the project lightbox's left column behind a "3D Model" tab. |
| `disposeInlineModel()` | Cancels the animation frame and disposes the renderer. Called when the tab is switched away or the lightbox closes. |

Scene setup: perspective camera 45°, ambient light 1.5 + two directional lights (2.5 and 1.0), OrbitControls with auto-rotate (0.8°/frame), damping 0.07, zoom enabled, pan disabled. Model is auto-centred and scaled to fit (2.2× bounding sphere). Tone mapping: ACES filmic, exposure 1.4, sRGB output.

---

### `js/list.js` — project index
| Export | Description |
|---|---|
| `buildProjectList(containerId)` | Desktop. Builds the year-grouped index and detail pane in `#desktop-list-view`; returns `{ activateDefault }`, which opens the first project on the list's first visit. |
| `buildMobileList()` | Mobile. Builds the wordmark header, home page, full-screen menu and project pages in `#mobile-view`. |

**Desktop** — a left-bound index (`.idx`) of uppercase titles grouped under year headings, with the selected project in a pane (`.idx-detail`) on the right. The first project is open from the start. The pane scrolls independently of the index.

**Mobile** — a big text wordmark with a burger button. The burger opens a full-screen version of the same index (plus About and Contact); picking a project replaces the page under the wordmark with that project. The route is the hash — `''` is home, `#<id>` is a project — written with `pushState`, so Back steps through what you looked at and projects can be linked directly. The bio is the `about` entry, labelled "About" here; Contact is the `Email` link from `media/projects/about/detail.md`; the home page text is `#site-header-intro`.

Both platforms:
- A project is rendered by `buildDesktopProjectLayout()` — the same builder the project lightbox uses, so it reads identically wherever it opens. CSS on `.idx-content` strips the modal-only bits (the `82vh` cap and the two inner scrollers) so content flows inline; the mobile layout stacks via the existing `max-width: 860px` rule.
- Content is rebuilt on every selection, not cached: an inline 3D viewer and autoplaying videos can't safely be left running in a hidden section. A newer selection supersedes one still loading.
- Projects are grouped by `detail.year`, newest first; a project with no year goes in an unheaded group.
- The "about" bio is authored like any other project but is routed differently per platform: on desktop it has no canvas node and no index entry, and is reached only through the top-bar `#about-link` (which opens it in the project lightbox); on mobile it sits in the menu.

Classes: `.idx`, `.idx-group`, `.idx-year`, `.idx-item`, `.idx-detail`, `.idx-project`, `.idx-title`, `.idx-content` (shared); `.m-head`, `.m-mark`, `.m-burger`, `.m-menu`, `.m-main`, `.m-home*` (mobile).

---

### `js/view-switch.js` — node canvas ⇄ index
| Export | Description |
|---|---|
| `initViewSwitch()` | Builds the index, wires the `#view-toggle` buttons, adds the corner brand mark. |

The node canvas is the default view; `body.list-view` swaps in `#desktop-list-view`. Switching is a plain crossfade: the index is always laid out and just faded and hidden, and the canvas does the reverse. `visibility` is delayed by the fade length on the way out, so a hidden view also drops out of painting and hit-testing. The index's first project is opened lazily on the first visit, so staying on the canvas never loads its images.

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
| `theme-line-overlay` | SVG for the hover-triggered project connection lines (see `js/theme-lines.js`) |
| `top-bar` | Top-centre bar holding the view toggle and the about link |
| `view-toggle` | Nodes/list segmented toggle |
| `about-link` | Opens the bio in the project lightbox |
| `logo-mark` | Decorative spinning corner mark (built from JS, `pointer-events:none`) |
| `desktop-list-view` | Project index (desktop) — grid of index + detail pane |
| `mobile-view` | Wordmark, menu and project pages (mobile) |
| `lightbox` | Image viewer modal |
| `project-lightbox` | Project detail modal |
| `plb-inner` | Project modal scroll container |
| `site-footer` | Footer (copyright, links, impressum button) |
| `impressum-lightbox` | Legal info modal |

Node classes on canvas: `.node`, `.node-bar`, `.node-bar-label`, `.node-resize`, `.node-image`, `.node-project`, `.image-stack`, `.image-count`.

---

## Data files

### `projects.js`
Array of `{ id, title, x, y }`. `x` and `y` are set to 0 for auto-placed projects; `main.js` spaces those evenly around a 250px-radius ring at canvas centre. Fixed positions (non-zero `x`/`y`) are used as-is. `about` is the one entry with no `x`/`y` at all — it never becomes a node, so `main.js` filters it out of the ring layout entirely rather than letting it consume a slot.

### `media/projects/{id}/`

| File | Purpose |
|---|---|
| `description.md` | Prose shown in the project lightbox. Any length; markdown is stripped before display. |
| `detail.md` | YAML frontmatter: `year`, `role`, `timeline`, `tools` (array), `links` (array of `{label, url}`), `images` (array of paths), `model` (glb path), `texts` (array of `{file, label}`). |
| `images/*.webp` | Project images. First image = thumbnail on the canvas node. |
| `models/*.glb` | Optional 3D model file. |
| `documents/` | Optional PDFs or downloads linked from `detail.md`. |

---

## Coordinate systems

| Space | Range | Notes |
|---|---|---|
| Canvas space | 0–8000 × 0–4000px | Node positions stored here |
| Inverse | `canvas = (screen - pan) / zoom` | Used for node drag |

---

## Initialisation sequence (desktop)

1. `main.js` places every canvas project without a fixed position evenly around a ring (radius 250px from canvas centre), then nudges apart any that still overlap. `about` is excluded from this set.
2. Dynamically imports `canvas.js`, `utils.js`, `nodes.js`, `lightbox.js`, `view-switch.js` in parallel.
3. Each module's side effects run (pan/zoom handlers, lightbox close buttons, etc.).
4. Calls `initViewSwitch()` — wires the view toggle, builds the corner brand mark, and builds the index up front via `buildProjectList`.
5. Fetches `detail.md` and images for every project. `about` gets `registerProjectData()` only — enough for the lightbox to open it, but no canvas node; every other project gets `buildProjectNode()`.
6. Calls `buildFooter()`.

Mobile path: skip steps 1–2 and 4–6, call `buildMobileList()` then `buildFooter()`. Canvas and lightboxes are not loaded on mobile.

---

## Adding a new project

See [CLAUDE.md](CLAUDE.md) for the step-by-step fast path.
