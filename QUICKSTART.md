# HTML-Only Website - Quick Start Guide

## 🚀 Getting Started

The HTML-only version is ready to use! Simply open the main file:

### File to Open
```
index-html-only.html
```

### Opening Methods

**Option 1: Direct (Simplest)**
- Double-click `index-html-only.html`
- Opens in your default browser
- All navigation works locally

**Option 2: Local Server (Recommended)**
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```
Then visit: `http://localhost:8000/index-html-only.html`

## 📁 Files Structure

```
Website/
├── index-html-only.html    ← START HERE (main page)
├── project-1.html          (Photogrammetry project)
├── project-2.html          (Beta project)
├── project-3.html          (Gamma project)
├── project-4.html          (Delta project)
├── README-HTML-ONLY.md     (detailed documentation)
├── COMPARISON.md           (comparison with original)
└── QUICKSTART.md          (this file)
```

## ✨ What Works

✅ View all 4 projects
✅ Navigate between pages
✅ View project galleries
✅ Read project details
✅ Download CV
✅ View PDF documents
✅ Responsive mobile design
✅ Works without JavaScript
✅ Works on any browser

## ❌ What's Different

No JavaScript means these features are removed:
- Metaball animations
- 3D models
- Interactive lightbox
- Draggable images
- Single-page navigation

## 🎯 Key Features

| Feature | Status |
|---------|--------|
| Portfolio listing | ✅ Static HTML |
| Project pages | ✅ 4 separate pages |
| Images | ✅ All preserved |
| About section | ✅ Full content |
| CV download | ✅ Working link |
| Mobile friendly | ✅ Responsive |
| Fast loading | ✅ ~48KB total |

## 📱 Browser Support

Works on **ALL** browsers:
- ✅ Chrome, Firefox, Safari, Edge (all versions)
- ✅ Internet Explorer 11
- ✅ Mobile browsers
- ✅ Older browsers
- ✅ Text browsers (lynx, links)
- ✅ Works with JavaScript disabled

## 🔗 Navigation

```
index-html-only.html (Home)
    ↓
[Click on any project]
    ↓
project-1.html (Detail page)
    ↓
[Click "← Back to Projects" or "Joel Tenenberg"]
    ↓
Back to index-html-only.html
```

## 📝 Content Included

**Main Page:**
- Header with name and logo
- Subtitle: "Creative Developer & Designer"
- Introduction text
- 4 project listings
- About section with 2 photos
- CV download button

**Each Project Page:**
- Back navigation
- Project title and subtitle
- Hero image
- Overview, Challenge, Solution sections
- Role, Timeline, Technologies
- Project gallery (multiple images)
- PDF document links (for project 1)

## 🎨 Styling

- **Font**: Elza (loaded from Fontshare)
- **Colors**: Black, white, grays
- **Layout**: CSS Grid + Flexbox
- **Responsive**: Breakpoint at 768px

## 💡 Tips

1. **For Best Experience**: Use a local server (images load better)
2. **For Quick View**: Just double-click the file
3. **For Sharing**: Send the entire folder (keeps image links working)
4. **For Hosting**: Upload all files to web server

## 🔧 Customization

To edit content:
1. Open HTML files in any text editor
2. Find the text you want to change
3. Edit directly in HTML
4. Save and refresh browser

Example:
```html
<!-- Find this -->
<h1 class="project-title">Project Title</h1>

<!-- Change to -->
<h1 class="project-title">My New Project</h1>
```

## 📚 More Information

- **README-HTML-ONLY.md** - Full documentation
- **COMPARISON.md** - Compare with original version
- **Original site** - See `index.html` for JavaScript version

## ❓ Troubleshooting

**Images not loading?**
- Make sure `media/` folder is in same directory
- Use local server instead of direct file opening

**Fonts look different?**
- Internet connection needed for Fontshare font
- Default system font used as fallback

**Links not working?**
- Check all HTML files are in same directory
- File names are case-sensitive

**Page looks broken on mobile?**
- Clear browser cache
- Check viewport meta tag is present

## 🎉 You're Done!

The HTML-only website is complete and ready to use. Enjoy the simplicity!

---

**Need the interactive version?** Check out `index.html` for the full JavaScript experience.
