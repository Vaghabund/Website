# Project Media Organization

All project media is organized using a standardized folder structure for consistency and scalability.

## Structure

Each project gets its own folder organized by media type:

```
projects/
├── _template/                    # Copy this to start a new project
│   ├── description.md           # Project metadata and content
│   ├── README.md                # Setup instructions
│   ├── images/                  # All images
│   ├── videos/                  # Video files (optional)
│   ├── models/                  # 3D models (optional)
│   └── documents/               # PDFs, docs (optional)
│
└── your-project-name/           # Your actual projects
    ├── description.md           # REQUIRED: Project info
    ├── images/                  # All project images
    │   ├── hero.jpg            # Main banner image
    │   ├── thumbnail.jpg       # Portfolio card image
    │   └── gallery-*.jpg       # Gallery images
    ├── videos/                  # Optional
    ├── models/                  # Optional (.glb files)
    └── documents/               # Optional (PDFs)
```

## Quick Start: Adding a New Project

1. **Copy the template:**
   ```bash
   cp -r media/projects/_template media/projects/your-project-name
   ```

2. **Add your media files:**
   - Place images in `images/` folder
   - Place videos in `videos/` folder (if needed)
   - Place 3D models (.glb) in `models/` folder (if needed)
   - Place PDFs in `documents/` folder (if needed)

3. **Optimize images:**
   ```bash
   node scripts/optimize-media-images.js
   ```
   This auto-generates WebP, -small (800px), and -thumb (400px) variants

4. **Edit description.md:**
   - Update frontmatter (title, year, tags, etc.)
   - Write project description
   - List gallery images and documents

5. **Update script.js** to reference the new project (see documentation in template)

## Supported Formats

- **Images**: JPG, PNG, WebP, GIF
- **Videos**: MP4, WebM
- **3D Models**: GLB, GLTF
- **Documents**: PDF

## Image Naming Best Practices

- Use lowercase with hyphens: `building-analysis.jpg`
- Avoid spaces and special characters
- Use descriptive names: `hero.jpg`, `thumbnail.jpg`, `gallery-01.jpg`
- Original images go in `images/` - optimizer creates variants automatically

## Automatic Optimization

When you run `node scripts/optimize-media-images.js`, each original image gets:
- `.webp` version (better compression, modern format)
- `-small.{jpg,webp}` versions (800px wide for responsive design)
- `-thumb.{jpg,webp}` versions (400px wide for thumbnails)

You only need to maintain the original images - all variants are auto-generated!

## See Template

Check `_template/` folder for:
- Full README with detailed instructions
- Sample `description.md` with all available fields
- Proper folder structure to copy
