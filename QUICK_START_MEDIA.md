# Quick Start: Media Organization

## What Changed?

Your media is now organized using **professional industry-standard structure**:

```
media/projects/YourProject/
├── description.md      # Project info (NEW!)
├── images/            # All images here (MOVED)
├── videos/            # Videos here (NEW)
├── models/            # 3D models (.glb) (NEW)
└── documents/         # PDFs here (MOVED)
```

## Adding a New Project (3 Steps)

### 1. Copy Template
```bash
cp -r media/projects/_template media/projects/my-new-project
```

### 2. Add Your Files
```
my-new-project/
├── images/         # Drop your images here
│   ├── hero.jpg
│   └── gallery-*.jpg
├── documents/      # Drop PDFs here (optional)
└── videos/         # Drop videos here (optional)
```

### 3. Optimize & Update
```bash
# Auto-generate responsive variants
node scripts/optimize-media-images.js

# Edit project info
nano media/projects/my-new-project/description.md

# Add to script.js (see template in script.js comments)
```

## What You Get

**Automatic image optimization creates:**
- `.webp` - Full quality (modern format, 30% smaller)
- `-small.{jpg,webp}` - 800px (tablets)
- `-thumb.{jpg,webp}` - 400px (mobile)

**You only maintain originals** - all variants auto-generated!

## Key Files

| File | Purpose |
|------|---------|
| `MEDIA_ORGANIZATION.md` | Complete guide (READ THIS!) |
| `media/projects/_template/` | Copy this for new projects |
| `media/projects/_template/description.md` | Project template with all fields |
| `media/about/bio-template.md` | Bio/about template |
| `scripts/optimize-media-images.js` | Image optimization script |

## Your Existing Project

✅ **OperationalAnalysisofPhotogrametry** has been reorganized:
- 66 images → `images/` folder
- 2 PDFs → `documents/` folder
- All paths updated in `script.js`
- `description.md` created

## Best Practices

**Naming:**
- ✅ `hero.jpg`, `gallery-01.jpg`, `building-exterior.jpg`
- ❌ `IMG_1234.jpg`, `My Photo.jpg` (no spaces!)

**Workflow:**
1. Add images to `images/` folder
2. Run `node scripts/optimize-media-images.js`
3. Use generated variants in responsive design

**Organization:**
- One folder per project
- Lowercase names with hyphens
- Keep videos under 20MB
- Optimize GLB files before adding

## Next Steps

1. ✅ Structure reorganized
2. ✅ Changes committed and pushed
3. ⬜ Review `MEDIA_ORGANIZATION.md` for full details
4. ⬜ Try adding a new project using the template
5. ⬜ Update your bio in `media/about/bio.md`

---

**Questions?** Check `MEDIA_ORGANIZATION.md` for detailed documentation.
