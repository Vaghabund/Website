# Joel Tenenberg - HTML-Only Portfolio Website

A clean, static HTML-only version of the portfolio website. This version maintains the structure and content of the original website while removing all JavaScript dependencies.

## Overview

This HTML-only version has been created with the following characteristics:
- **Pure HTML & CSS**: No JavaScript required
- **Static Content**: All project information hardcoded in HTML
- **Preserved Structure**: Maintains the original layout and design aesthetic
- **Responsive Design**: Mobile-friendly with CSS media queries
- **Fast Loading**: Minimal dependencies, only uses external font

## Files

### Main Pages
- **index-html-only.html** - Home page with project listings and about section
- **project-1.html** - Operational Analysis of Photogrammetry (Master Thesis)
- **project-2.html** - Project Beta (UI/UX Design)
- **project-3.html** - Project Gamma (Mobile App)
- **project-4.html** - Project Delta (Brand Identity)

### Features Removed
The following JavaScript-dependent features have been removed:
- ❌ Metaball animations (logo and fullscreen)
- ❌ 3D model banners (Three.js)
- ❌ Dynamic project loading
- ❌ Lightbox image galleries
- ❌ Draggable images
- ❌ Interactive animations

### Features Retained
The following content and styling has been preserved:
- ✅ All project information and descriptions
- ✅ Project images and galleries
- ✅ About section with profile images
- ✅ Responsive layout
- ✅ Typography and color scheme
- ✅ Navigation between pages
- ✅ Download CV link
- ✅ PDF document links (thesis and map)

## How to Use

### Option 1: Direct File Opening
Simply open `index-html-only.html` in any modern web browser. All navigation links are relative and will work locally.

### Option 2: Local Server (Recommended)
For the best experience and to ensure all media files load correctly:

**Using Python:**
```bash
python -m http.server 8000
```

**Using Node.js:**
```bash
npx http-server -p 8000
```

Then navigate to http://localhost:8000/index-html-only.html

## Structure

```
/
├── index-html-only.html    # Main portfolio page
├── project-1.html          # Project detail page 1
├── project-2.html          # Project detail page 2
├── project-3.html          # Project detail page 3
├── project-4.html          # Project detail page 4
└── media/                  # All images and assets (unchanged)
    ├── logo/
    ├── about/
    └── projects/
```

## Styling

All CSS is embedded in each HTML file using `<style>` tags. The design system uses:
- **Font**: Elza from Fontshare (via @import)
- **Color Palette**: Black & white with gray tones
- **Layout**: CSS Grid and Flexbox
- **Responsive**: Media queries for mobile devices

## Browser Compatibility

Works in all modern browsers that support:
- CSS Grid
- CSS Flexbox
- HTML5 semantic elements
- Responsive images (srcset)

No JavaScript required, so works even with JavaScript disabled.

## Customization

To modify content:
1. Open the HTML files in any text editor
2. Edit the text content directly in the HTML
3. Update image paths in `src` and `srcset` attributes
4. Modify colors and spacing in the `<style>` section

## Differences from Original

| Feature | Original | HTML-Only |
|---------|----------|-----------|
| File Structure | index.html + script.js | index-html-only.html + project-*.html |
| Navigation | Single-page app | Multi-page static site |
| Projects | Dynamically loaded | Separate HTML pages |
| Animations | Canvas + JavaScript | None |
| 3D Models | Three.js | Removed |
| Image Gallery | Lightbox (JS) | Static grid |
| Size | ~2MB (with JS) | ~50KB (HTML only) |

## Performance

The HTML-only version is significantly lighter:
- No JavaScript parsing or execution
- No external library loading (except font)
- Faster initial page load
- Lower memory usage
- Better for older devices

## Future Enhancements

Possible improvements while maintaining HTML-only approach:
- Add CSS-only image hover effects
- Implement CSS-only modal dialogs
- Add print stylesheet
- Enhance accessibility with ARIA labels
- Add skip navigation links

---

**Note**: This version prioritizes simplicity and accessibility over interactive features. It's ideal for environments where JavaScript is disabled or restricted, or for users who prefer a lightweight browsing experience.
