# Metaball Web Animation

A beautiful, interactive metaball animation created with HTML5 Canvas and JavaScript.

## Features

- 🌊 Smooth organic blob-like shapes that merge and separate
- 🖱️ Interactive mouse/touch controls - move your cursor to influence the metaballs
- 🎨 Vibrant gradient colors with screen blending effects
- 📱 Responsive design that works on desktop and mobile
- ⚡ Optimized performance with efficient rendering

## How to Run

### Option 1: Simple File Opening
Simply open `index.html` in your web browser.

### Option 2: Local Server (Recommended)
For the best experience, serve the files through a local server:

1. **Using Python (if installed):**
   ```bash
   cd "c:\Users\Joel\Metaball Web Animation"
   python -m http.server 8000
   ```
   Then open http://localhost:8000 in your browser.

2. **Using Node.js (if installed):**
   ```bash
   cd "c:\Users\Joel\Metaball Web Animation"
   npx http-server -p 8000
   ```
   Then open http://localhost:8000 in your browser.

3. **Using Live Server (VS Code extension):**
   If you have the Live Server extension in VS Code, right-click on `index.html` and select "Open with Live Server".

## How It Works

The animation creates multiple metaball objects that:
- Move around the canvas with physics-based motion
- Respond to mouse/touch input with attractive forces
- Render using radial gradients with screen blend mode for smooth merging effects
- Bounce off canvas edges with realistic physics
- Scale dynamically based on mouse proximity

## Files

- `index.html` - Main HTML structure
- `style.css` - Styling and responsive design
- `script.js` - Animation logic and metaball physics
- `README.md` - This documentation

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 Classes
- requestAnimationFrame

## Customization

You can easily customize the animation by modifying:
- Number of metaballs (adjust `numBalls` calculation in `createMetaballs()`)
- Colors (modify the `colors` array in `createMetaballs()`)
- Physics parameters (velocity, friction, mouse force in `Metaball.update()`)
- Visual effects (gradient stops, blend modes in `animate()`)

Enjoy your metaball animation! 🎉