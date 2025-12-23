# 📁 Professional Media Organization Guide

This document describes the professional media organization structure implemented in this repository.

## 🎯 Overview

All media assets are organized in the `/media` directory using a **type-based nested structure** for maximum scalability, clarity, and maintainability.

---

## 📂 Directory Structure

```
media/
├── logo/                          # Brand assets
│   └── LOGO.svg
│
├── about/                         # Bio/profile content
│   ├── profile.jpg               # Profile images
│   ├── profile2.jpg
│   ├── bio.md                    # Bio content (Markdown)
│   ├── bio-template.md           # Template with all fields
│   └── README.md                 # Documentation
│
├── projects/                      # All projects
│   ├── _template/                # 📋 Copy this for new projects
│   │   ├── description.md        # Project metadata template
│   │   ├── README.md             # Setup instructions
│   │   ├── images/               # Image files go here
│   │   ├── videos/               # Video files go here
│   │   ├── models/               # 3D models (.glb) go here
│   │   └── documents/            # PDFs/docs go here
│   │
│   └── [project-name]/           # Actual project folders
│       ├── description.md        # Project metadata & content
│       ├── images/               # All project images
│       │   ├── hero.jpg         # Main project image
│       │   ├── thumbnail.jpg    # Portfolio card thumbnail
│       │   ├── gallery-*.jpg    # Gallery images
│       │   └── ... (auto-generated variants)
│       ├── videos/               # Video files (optional)
│       ├── models/               # 3D models (optional)
│       └── documents/            # PDFs, docs (optional)
│
├── models/                        # Shared/global 3D models
│   └── shared-model.glb
│
└── cv/                           # Resume/CV
    └── resume.pdf
```

---

## 🚀 Quick Start: Adding a New Project

### 1️⃣ Copy the Template

```bash
cp -r media/projects/_template media/projects/your-project-name
```

Use **lowercase with hyphens** for project names:
- ✅ `operational-analysis`
- ✅ `3d-building-visualization`
- ❌ `Operational Analysis` (no spaces)
- ❌ `operational_analysis` (prefer hyphens)

### 2️⃣ Add Your Media Files

Place files in the appropriate folders:

```bash
your-project-name/
├── images/          # Add all images here
│   ├── hero.jpg    # Main banner image
│   └── gallery-*.jpg
├── videos/          # Add videos here (optional)
├── models/          # Add .glb files here (optional)
└── documents/       # Add PDFs here (optional)
```

**Supported formats:**
- Images: JPG, PNG, WebP, GIF
- Videos: MP4, WebM
- 3D Models: GLB, GLTF
- Documents: PDF

### 3️⃣ Optimize Images

Run the optimization script to auto-generate responsive variants:

```bash
node scripts/optimize-media-images.js
```

**This creates:**
- `image.webp` - Full quality WebP (better compression)
- `image-small.{jpg,webp}` - 800px wide (for tablets/small screens)
- `image-thumb.{jpg,webp}` - 400px wide (for thumbnails)

**You only maintain the original images** - all variants are auto-generated!

### 4️⃣ Edit `description.md`

Update the frontmatter (metadata) at the top:

```markdown
---
title: "Your Project Title"
subtitle: "Project Type"
year: "2025"
category: "Category"
tags: ["tag1", "tag2", "tag3"]
thumbnail: "images/thumbnail.jpg"
hero: "images/hero.jpg"
technologies: ["Tech 1", "Tech 2"]
---

# Your Project Title

Your project description goes here...
```

### 5️⃣ Update `script.js`

Add a new entry to the `projectsData` array in `/script.js`:

```javascript
{
    id: X, // Increment from last project
    title: 'Your Project Title',
    subtitle: 'Project Type',
    year: '2025',
    description: 'Short description...',
    fullDescription: 'Longer description...',
    image: 'media/projects/your-project-name/images/hero.jpg',
    thumbnailImage: 'media/projects/your-project-name/images/thumbnail.jpg',
    heroImage: 'media/projects/your-project-name/images/hero.jpg',
    model3D: 'media/projects/your-project-name/models/model.glb', // Optional
    technologies: ['Tech 1', 'Tech 2'],
    gallery: [
        'media/projects/your-project-name/images/gallery-01.jpg',
        'media/projects/your-project-name/images/gallery-02.jpg',
        'media/projects/your-project-name/documents/thesis.pdf'
    ]
}
```

---

## 📝 Markdown Content Templates

### Project Description Template

See `/media/projects/_template/description.md` for a complete template with:
- Frontmatter metadata
- Structured sections (Overview, Challenge, Solution, Process, Results)
- Image and document references

### Bio/About Template

See `/media/about/bio-template.md` for a bio template with:
- Personal information
- Professional background
- Skills and expertise
- Contact information

---

## 🖼️ Image Optimization Details

### Automatic Variants

The optimization script (`scripts/optimize-media-images.js`) automatically generates:

| Variant | Size | Quality | Use Case |
|---------|------|---------|----------|
| `.webp` | Full | 80% | Modern browsers, full quality |
| `-small.jpg` | 800px | 80% | Responsive design, tablets |
| `-small.webp` | 800px | 80% | Responsive design, modern browsers |
| `-thumb.jpg` | 400px | 72% | Thumbnails, mobile |
| `-thumb.webp` | 400px | 72% | Thumbnails, modern browsers |

### What Gets Optimized

- ✅ All `.jpg`, `.jpeg`, `.png` files in `/media`
- ✅ Recursively processes all subdirectories
- ✅ Skips already-generated variants (won't duplicate)
- ❌ Skips `documents/`, `_template/` folders
- ❌ Skips files already containing `-small`, `-thumb`, `.webp`

### Re-running Optimization

Safe to run multiple times:
```bash
node scripts/optimize-media-images.js
```

It will skip already-optimized images and only process new ones.

---

## 🎨 Best Practices

### File Naming

**DO:**
- ✅ `hero.jpg` - Descriptive, lowercase
- ✅ `gallery-01.jpg` - Numbered series
- ✅ `building-exterior.jpg` - Hyphens for spaces
- ✅ `profile-photo.jpg` - Clear purpose

**DON'T:**
- ❌ `IMG_1234.jpg` - Not descriptive
- ❌ `My Photo.jpg` - Contains spaces
- ❌ `photo_final_FINAL_v2.jpg` - Confusing versions
- ❌ `Ärchitecture.jpg` - Special characters

### Image Sizes

**Recommended original sizes:**
- Hero images: 1920px - 2400px wide
- Gallery images: 1200px - 1920px wide
- Thumbnails: Use auto-generated variants
- Profile photos: 800px - 1200px

**File size targets (after optimization):**
- Hero: 200-500 KB (WebP), 300-800 KB (JPG)
- Gallery: 150-400 KB (WebP), 200-600 KB (JPG)
- Thumbnails: Auto-generated at optimal sizes

### Project Organization

**Each project should have:**
1. ✅ `description.md` - Project metadata and content
2. ✅ At least 1 hero image in `images/`
3. ✅ At least 1 thumbnail image in `images/`
4. ✅ Gallery images showcasing the project
5. ⚠️ Videos (optional) - Keep under 20MB each
6. ⚠️ 3D models (optional) - Optimize GLB files
7. ⚠️ Documents (optional) - PDFs under 10MB

---

## 🔧 Maintenance & Updates

### Adding Images to Existing Project

1. Add new images to `images/` folder
2. Run: `node scripts/optimize-media-images.js`
3. Update `gallery` array in `script.js`

### Updating Bio/About

Edit `/media/about/bio.md` directly. Use `/media/about/bio-template.md` as reference.

### Adding Videos

1. Place video in `videos/` folder
2. Reference in `description.md` or `script.js`
3. Keep videos under 20MB (or host externally)

### Adding 3D Models

1. Optimize `.glb` file (use gltf-pipeline or similar)
2. Place in `models/` folder
3. Add preview image (fallback)
4. Update `model3D` field in `script.js`

---

## 📚 Documentation Files

- `/MEDIA_ORGANIZATION.md` - This file (main guide)
- `/media/README.md` - Media directory overview
- `/media/projects/README.md` - Project organization guide
- `/media/projects/_template/README.md` - Template setup instructions
- `/media/about/README.md` - About section guide
- `/script.js` - See top comments for media structure

---

## ✅ Checklist: Adding a New Project

- [ ] Copy `_template/` to new project name
- [ ] Add images to `images/` folder
- [ ] Run optimization script
- [ ] Edit `description.md` with project info
- [ ] Add videos (if applicable)
- [ ] Add 3D models (if applicable)
- [ ] Add documents/PDFs (if applicable)
- [ ] Update `script.js` with new project entry
- [ ] Test gallery and image loading
- [ ] Commit and push to repository

---

## 🎓 Why This Structure?

### ✅ Advantages

1. **Scalable** - Handles 1 project or 100 projects easily
2. **Organized** - Clear separation by media type
3. **Efficient** - Automatic optimization for all images
4. **Maintainable** - Easy to find and update assets
5. **Professional** - Industry-standard organization
6. **Flexible** - Optional folders (videos, models, docs)
7. **Future-proof** - Easy to extend with new media types

### 🆚 vs. Flat Structure

**Flat:** `project/image1.jpg, image2.jpg, video.mp4, doc.pdf, model.glb`
- Gets messy with 10+ files
- Hard to find specific media types
- No clear organization

**Nested (Current):** `project/images/, videos/, models/, documents/`
- Clean and organized
- Easy to navigate
- Clear media type separation

---

## 🔗 Related Resources

- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
- [Responsive Images Guide](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [WebP Format Info](https://developers.google.com/speed/webp)
- [GLB/GLTF 3D Models](https://www.khronos.org/gltf/)

---

**Last Updated:** 2025-12-23
**Structure Version:** 2.0 (Nested Type-Based)
