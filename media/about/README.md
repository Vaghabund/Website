# About Section Images

Place your profile/about images here.

**Expected files (place originals here):**
- `profile.jpg` - Top/main profile image (used on the left side)
- `profile2.jpg` - Underneath / draggable overlay image

**Best practice & optimization**
- Filename convention: use the names above — the site expects `media/about/profile.jpg` and `media/about/profile2.jpg`.
- Recommended formats: original .jpg/.png for edits, plus generated `.webp` and small variants for the web.

**Automatic optimization**
A helper script is included at `scripts/optimize-images.js` which will produce the following files for each original:
- `${"profile"}.webp` — WebP full quality
- `${"profile"}-small.jpg` — resized JPG (400px wide) for lists / small viewports
- `${"profile"}-small.webp` — resized WebP (400px wide)

To use it:
1. Install sharp: `npm install sharp` (or add `sharp` to your project dependencies)
2. Run: `node scripts/optimize-images.js`

This script does not overwrite your originals — it generates optimized copies alongside them.

After adding your real images, feel free to remove this README file.
