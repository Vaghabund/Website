# 3D Banner System

A reusable Three.js-based 3D banner component with cursor interaction for project pages.

## Features

- **Cursor-following lighting**: Point light follows mouse position for dynamic lighting
- **Smooth rotation**: Model rotates based on cursor position with lerping for smooth transitions
- **Multiple interaction modes**: cursor-follow, rotate, tilt
- **Auto-rotation option**: Enable automatic model rotation
- **Responsive**: Adapts to container width
- **Fallback geometry**: Shows placeholder if model fails to load
- **Easy cleanup**: Proper memory management when navigating away

## Setup

### 1. Include Required Scripts

Add these scripts to your HTML (before closing `</body>` tag):

```html
<!-- Three.js CDN -->
<script src="https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.159.0/examples/js/loaders/GLTFLoader.js"></script>

<!-- 3D Banner Module -->
<script src="threeBanner.js"></script>
```

### 2. Add HTML Container

Add a container element where you want the 3D banner:

```html
<div class="three-banner" id="projectBanner"></div>
```

### 3. Initialize the Banner

```javascript
// Basic initialization
const banner = init3DBanner('projectBanner', 'models/your-model.glb');

// With options
const banner = init3DBanner('projectBanner', 'models/your-model.glb', {
    interactionType: 'cursor-follow',  // 'cursor-follow', 'rotate', 'tilt'
    height: 500,                       // Banner height in pixels
    backgroundColor: 0xf8f8f8,         // Hex color (0xRRGGBB)
    modelScale: 1,                     // Model scale multiplier
    autoRotate: true,                  // Enable auto-rotation
    maxRotation: 10,                   // Max rotation in degrees
    lerpFactor: 0.1                    // Smoothness (0-1, lower = smoother)
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `interactionType` | string | `'cursor-follow'` | Interaction mode: 'cursor-follow', 'rotate', 'tilt' |
| `height` | number | `500` | Banner height in pixels |
| `backgroundColor` | hex | `0xffffff` | Background color (hex format: 0xRRGGBB) |
| `modelScale` | number | `1` | Scale multiplier for the 3D model |
| `autoRotate` | boolean | `false` | Enable continuous auto-rotation |
| `maxRotation` | number | `10` | Maximum rotation angle in degrees for cursor interaction |
| `lerpFactor` | number | `0.1` | Interpolation factor for smooth transitions (0-1) |

## Usage in Dynamic Pages

For dynamically generated project pages (like in your current setup):

```javascript
// In your project data
const projectsData = [
    {
        id: 1,
        title: 'My Project',
        model3D: 'models/project1.glb',
        model3DOptions: {
            interactionType: 'cursor-follow',
            autoRotate: true,
            backgroundColor: 0xf8f8f8
        },
        // ... other project data
    }
];

// When showing project detail
if (project.model3D) {
    const banner = init3DBanner(
        `threeBanner-${project.id}`,
        project.model3D,
        project.model3DOptions || {}
    );
}
```

## Cleanup

When navigating away from a page with a 3D banner, properly clean up:

```javascript
if (banner) {
    banner.destroy();
}
```

## 3D Model Requirements

- **Format**: GLTF (.gltf) or GLB (.glb)
- **Recommended size**: < 5MB for web performance
- **Optimization**: Use tools like [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline) to compress models

### Recommended Tools for Creating/Converting Models

- **Blender**: Free 3D modeling software with GLTF export
- **Sketchfab**: Download models in GLTF format
- **glTF Viewer**: Test your models before integration

## Fallback Behavior

If no model is provided or the model fails to load, a stylish placeholder geometry (torus knot) will be displayed automatically.

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 15+)
- Mobile: ✅ Touch events supported

## Performance Tips

1. **Optimize models**: Keep polygon count reasonable (<100k triangles)
2. **Compress textures**: Use compressed texture formats (KTX2, Basis)
3. **Use Draco compression**: Reduce file size by 50-90%
4. **Lazy load**: Only initialize banner when visible (use Intersection Observer)

## Example: Standalone Project Page

See `project-example.html` for a complete standalone implementation.

## Troubleshooting

**Banner not showing:**
- Check browser console for errors
- Verify Three.js scripts are loaded before threeBanner.js
- Ensure container ID matches the one passed to init3DBanner

**Model not loading:**
- Check model path is correct
- Verify model file exists and is accessible
- Check browser console for loading errors
- Try opening model directly in browser

**Performance issues:**
- Reduce model polygon count
- Lower `lerpFactor` for less frequent updates
- Disable `autoRotate` if not needed
- Use smaller texture sizes

## License

Free to use in your projects.
