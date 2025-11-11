# 3D Banner Usage Guide

## Overview
The 3D banner system provides an interactive Three.js banner that can be added to any project page with cursor interaction and smooth animations.

## Features
- ✅ Cursor-following point light
- ✅ Smooth rotation based on mouse position (max 10°)
- ✅ Lerping for smooth transitions
- ✅ Full-width responsive design (500px height on desktop, 350px on mobile)
- ✅ Support for GLTF/GLB 3D models
- ✅ Fallback placeholder geometry

## Quick Start

### 1. Add to Project Data
In `script.js`, add 3D model properties to your project:

```javascript
{
    id: 1,
    title: 'My Project',
    // ... other properties
    model3D: 'models/mymodel.glb',  // Path to your 3D model
    model3DOptions: {                // Optional customization
        interactionType: 'cursor-follow',
        autoRotate: true,
        backgroundColor: 0xf8f8f8,
        modelScale: 1.5,
        maxRotation: 15,
        lerpFactor: 0.1
    }
}
```

### 2. Supported Model Formats
- `.glb` (recommended - binary GLTF)
- `.gltf` (JSON GLTF)
- If no model or error: displays placeholder geometry

### 3. Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `interactionType` | string | `'cursor-follow'` | Interaction mode: 'cursor-follow', 'rotate', 'tilt' |
| `height` | number | `500` | Banner height in pixels |
| `backgroundColor` | hex | `0xffffff` | Background color (Three.js color format) |
| `modelScale` | number | `1` | Scale multiplier for the model |
| `autoRotate` | boolean | `false` | Enable continuous rotation |
| `maxRotation` | number | `10` | Maximum rotation in degrees |
| `lerpFactor` | number | `0.1` | Smoothness of transitions (0-1) |

## Manual Usage (Standalone)

If you want to add a 3D banner to a custom HTML page:

### HTML:
```html
<!-- Container for 3D banner -->
<div id="my3DBanner" class="three-banner"></div>

<!-- Include Three.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>

<!-- Include banner module -->
<script src="threeBanner.js"></script>

<!-- Initialize -->
<script>
    window.init3DBanner('my3DBanner', 'path/to/model.glb', {
        autoRotate: true,
        backgroundColor: 0x000000
    });
</script>
```

## File Structure
```
Website/
├── threeBanner.js          # 3D banner module
├── models/                 # Place your 3D models here
│   ├── project1.glb
│   └── project2.glb
├── index.html             # Main page (includes CDN scripts)
├── script.js              # Main app logic
└── style.css              # Styles (.three-banner class)
```

## Tips
1. **Model Optimization**: Keep models under 5MB for good performance
2. **Testing**: Use placeholder geometry first, then add your model
3. **Lighting**: Adjust `backgroundColor` to match your site's theme
4. **Performance**: Set `lerpFactor` to 0.15+ for slower devices

## Troubleshooting

### Model not loading?
- Check console for errors
- Verify file path is correct
- Ensure model is in GLTF/GLB format
- Falls back to placeholder geometry automatically

### Banner not appearing?
- Verify container ID matches
- Check that Three.js CDN loaded (check console)
- Ensure `threeBanner.js` is loaded before initialization

### Performance issues?
- Reduce model polygon count
- Increase `lerpFactor` (makes movements less smooth but faster)
- Disable `autoRotate`
- Lower banner height

## Example Models (Free Resources)
- [Sketchfab](https://sketchfab.com/features/gltf) - Free GLTF models
- [Poly Haven](https://polyhaven.com/) - Free 3D assets
- [Three.js Examples](https://threejs.org/examples/) - Sample models
