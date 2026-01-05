# Project Template

This is a template folder for new projects. Copy this folder and rename it to your project's slug (lowercase, hyphens instead of spaces).

## Folder Structure

```
your-project-name/
├── description.md        # Project metadata and content (REQUIRED)
├── images/              # All project images
│   ├── hero.jpg         # Main hero/banner image
│   ├── thumbnail.jpg    # Card thumbnail (shows in portfolio grid)
│   └── gallery-*.jpg    # Additional gallery images
├── videos/              # Video files (optional)
│   ├── demo.mp4
│   └── process.webm
├── models/              # 3D models (optional)
│   ├── model.glb
│   └── preview.jpg      # Fallback preview image
└── documents/           # PDFs and documents (optional)
    ├── thesis.pdf
    └── presentation.pdf
```

## Setup Instructions

1. **Copy this template folder:**
   ```bash
   cp -r media/projects/_template media/projects/your-project-name
   ```

2. **Edit `description.md`:**
   - Update the frontmatter (title, year, tags, etc.)
   - Write your project description
   - List gallery images and documents

3. **Add your media files:**
   - Place original images in `images/` folder
   - Run the optimization script: `node scripts/optimize-media-images.js`
   - This will auto-generate WebP, -small (800px), and -thumb (400px) variants

4. **Add videos (if applicable):**
   - Place `.mp4` or `.webm` files in `videos/` folder
   - Reference them in your description.md

5. **Add 3D models (if applicable):**
   - Place `.glb` files in `models/` folder
   - Update `model3D` field in description.md frontmatter

6. **Add documents (if applicable):**
   - Place PDFs in `documents/` folder
   - List them in the description.md

## Image Naming Conventions

- `hero.jpg` - Main project banner (used in project detail page)
- `thumbnail.jpg` - Project card thumbnail (used in portfolio grid)
- `gallery-01.jpg`, `gallery-02.jpg`, etc. - Gallery images
- Avoid spaces in filenames (use hyphens or underscores)

## Optimization

The optimization script will automatically generate:
- `.webp` versions (modern format, smaller file size)
- `-small.{jpg,webp}` versions (800px wide for responsive design)
- `-thumb.{jpg,webp}` versions (400px wide for thumbnails)

**Run after adding new images:**
```bash
node scripts/optimize-media-images.js
```

## See Also

- Main media README: `/media/README.md`
- Project description template: `/media/projects/_template/description.md`
- About page template: `/media/about/bio-template.md`
