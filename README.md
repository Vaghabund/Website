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

The website is built with pure HTML, CSS, and JavaScript in a modular architecture:

### JavaScript Modules
- `js/data/projects.js` - Project data and metadata
- `js/animations/logo.js` - Logo animation (orbital metaballs in header)
- `js/animations/metaball.js` - Fullscreen metaball animation with physics simulation
- `js/components/lightbox.js` - Image gallery lightbox component
- `js/app/portfolio.js` - Main portfolio application logic
- `script_new.js` - Application orchestrator and initialization

### CSS Modules
- `css/base/` - Variables, typography, and font definitions
- `css/layout/` - Base layout, header, and footer styles
- `css/components/` - Reusable components (navigation, buttons, projects, lightbox, etc.)
- `css/utilities/` - Helper classes and responsive breakpoints
- `style-new.css` - Main CSS import file

### Pages
- `index.html` - Portfolio showcase and project gallery
- `about.html` - About page with bio and CV download
- `impressum.html` - Legal information (Impressum)

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

1. **Update Projects**: Edit the `projectsData` array in `js/data/projects.js` to add/modify projects
2. **Change Colors**: Modify CSS variables in `css/base/variables.css`
3. **Adjust Fonts**: Update font definitions in `css/base/typography.css`
4. **Modify Animations**: Tweak physics in `js/animations/metaball.js` or `js/animations/logo.js`
5. **Customize Components**: Edit individual component files in `css/components/` or `js/components/`

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 Classes
- CSS Grid and Flexbox
- requestAnimationFrame

## Architecture

Built with clean, maintainable code:
- **Modular file structure** - Organized into logical directories for easy navigation
- **Separation of concerns** - Data, animations, components, and styling are isolated
- **Object-oriented design** with ES6 classes
- **Component-based CSS** - Each UI component has its own stylesheet
- **Event-driven architecture** for user interactions
- **No build dependencies** - Pure vanilla JavaScript with no bundlers required

Enjoy the portfolio! 🎉