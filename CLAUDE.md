# CLAUDE.md

Portfolio site for Joel Tenenberg — a canvas-based, no-build vanilla JS site.
See [README.md](README.md) for the module architecture.

## Adding a new project

This is the fast path — follow it exactly and a new project goes live with no
guesswork. `media/projects/_template/` has copy-paste starter files if you
want them, but everything you need to know is here.

1. **Create the folder.** `media/projects/<slug>/`, where `<slug>` is
   lowercase-hyphenated (`vision-of-the-hybrid`, not `Vision Of The Hybrid`).
   This exact string is the project's id everywhere else below.

2. **Write the three text files** (all plain files, no frontmatter except
   `detail.md`):
   - `description.md` — prose shown in the project's text lightbox. Plain
     paragraphs; markdown formatting is stripped before display.
   - `embedding.md` — 200–400 words of plain prose (no markdown) fed into
     semantic search as the *only* search text for this project. Cover what
     the project is, what it's about, how it was made, and words a visitor
     might search for.
   - `detail.md` — YAML-ish frontmatter, see field reference below.

3. **Add images.** Drop raw `.png`/`.jpg`/`.jpeg` files straight into
   `media/projects/<slug>/images/` — any filenames, including messy
   camera/screenshot exports. Then run:
   ```
   npm run optimize-images -- <slug>
   ```
   (omit `-- <slug>` to process every project at once). This:
   - Cleans up filenames — lowercases, strips spaces/odd characters, and
     renumbers generic capture names (`Screenshot 2026-...`, `IMG_1234`,
     `photo_...`) as `<slug>-01`, `<slug>-02`, etc.
   - Produces `<name>.webp` (full, max 1600px — used in the gallery/lightbox)
     and `<name>-small.webp` (max 400px — used for canvas node thumbnails).
   - Updates `detail.md`'s `images:` list to match, and appends any images
     not yet listed there.
   Requires `sharp` (`npm install` pulls it in as a devDependency).

4. **Optional media that lives outside the repo:** videos and 3D models
   (`.glb`) are large, so the existing projects host them externally (R2 in
   the examples below) and only store the URL in `detail.md`. Do the same
   unless the file is small.

5. **Register the project** in [projects.js](projects.js): add
   `{ id: '<slug>', title: '...', x: 0, y: 0 }` (`x`/`y` of `0,0` means
   auto-placed on the spiral; only set real coordinates to pin a fixed spot).

6. **Regenerate search embeddings:**
   ```
   npm run embeddings
   ```

7. Commit.

### `detail.md` field reference

All fields are optional except that `images:` (if present) must resolve to
files that actually exist.

| Field | Type | Notes |
|---|---|---|
| `year` | string | |
| `role` | string | |
| `timeline` | string | |
| `tools` | list | plain strings |
| `links` | list of `{label, url}` | rendered as buttons; a `.zip` url adds a download badge to the node |
| `images` | list | paths relative to the project folder, e.g. `images/foo.webp` |
| `texts` | list of `{file, label}` | extra text tabs beyond `description.md`; omit to default to a single "Overview" tab from `description.md` |
| `videos` | list of URLs | usually external-hosted |
| `model` | URL or path | `.glb` for the 3D viewer; usually external-hosted |
| `poster` | path | poster image for the first video |
| `silentVideos` | bool | mute autoplay videos |
| `firstImageAfterText` | bool | defers the first image to render after the text/info block instead of before it |
| `exhibitions` | list of strings | shown/printed history, e.g. `"UdK Rundgang, 2025"` |

### Naming convention

Lowercase, hyphenated, no spaces, no capitals — for the project slug and for
every image filename. `optimize-images.js` enforces this for images
automatically; keep it in mind if you ever add files by hand.
