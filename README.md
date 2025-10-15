# Joel Tenenberg - Portfolio Website

A lightweight, modern portfolio website featuring an interactive metaball animation and project showcase.

## Features

- 🎨 Clean, minimalist design with professional typography
- 🌊 Interactive metaball canvas animation (click the logo to view fullscreen)
- 📱 Fully responsive layout that works on all devices
- ⚡ Lightweight vanilla JavaScript - no framework dependencies
- 🎯 Portfolio project showcase with expandable details
- 🖼️ Detailed project pages with galleries and information

## Structure

The website is built with pure HTML, CSS, and JavaScript:

- `index.html` - Main HTML structure with header, portfolio, and animation overlay
- `style.css` - Comprehensive styling with modern design patterns
- `script.js` - All interactive functionality including:
  - Logo animation (small orbital metaballs in header)
  - Fullscreen metaball animation with physics simulation
  - Portfolio project list with expand/collapse
  - Project detail page navigation
  - Smooth animations and transitions

## How to Run

### Option 1: Simple File Opening
Simply open `index.html` in your web browser.

### Option 2: Local Server (Recommended)
For the best experience with all features, serve through a local server:

**Using Python:**
```bash
python -m http.server 8000
```

**Using Node.js:**
```bash
npx http-server -p 8000
```

Then open http://localhost:8000 in your browser.

## Portfolio Content

The site showcases multiple projects with:
- Project titles, subtitles, and years
- Expandable descriptions with images
- Detailed project pages including:
  - Overview, challenge, and solution sections
  - Role, timeline, and technologies used
  - Live site links
  - Project galleries

## Customization

To customize the portfolio:

1. **Update Projects**: Edit the `projectsData` array in `script.js` to add/modify projects
2. **Change Colors**: Modify CSS variables and colors in `style.css`
3. **Adjust Fonts**: Update the font imports at the top of `style.css`
4. **Modify Animation**: Tweak metaball physics in the `MetaballAnimation` class

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 Classes
- CSS Grid and Flexbox
- requestAnimationFrame

## Architecture

Built with clean, maintainable code:
- **Object-oriented design** with ES6 classes
- **Modular structure** separating concerns (animation, navigation, UI)
- **Event-driven architecture** for user interactions
- **No dependencies** - pure vanilla JavaScript

Enjoy the portfolio! 🎉