# 3D Banner - Quick Reference

## 🚀 Initialize Banner (Simple)

```javascript
init3DBanner('containerId', 'models/model.glb');
```

## 🎨 Initialize with Options

```javascript
init3DBanner('containerId', 'models/model.glb', {
    interactionType: 'cursor-follow',
    height: 500,
    backgroundColor: 0xf8f8f8,
    modelScale: 1,
    autoRotate: true,
    maxRotation: 10,
    lerpFactor: 0.1
});
```

## 📝 HTML Structure

```html
<!-- Container -->
<div class="three-banner" id="myBanner"></div>

<!-- Required Scripts (before closing </body>) -->
<script src="https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.159.0/examples/js/loaders/GLTFLoader.js"></script>
<script src="threeBanner.js"></script>
```

## 🎯 Project Data Example

```javascript
const projectsData = [
    {
        id: 1,
        title: 'My Project',
        model3D: 'models/project1.glb',  // Path to 3D model
        model3DOptions: {                 // Optional settings
            autoRotate: true,
            backgroundColor: 0xf8f8f8
        }
        // ... other project fields
    }
];
```

## 🧹 Cleanup

```javascript
if (banner) {
    banner.destroy();
}
```

## 🎮 Interaction Types

- `'cursor-follow'` - Model tilts + light follows cursor
- `'rotate'` - Model rotates based on cursor
- `'tilt'` - Model tilts only

## 🎨 Color Format

Use hexadecimal without the `#`:
- White: `0xffffff`
- Black: `0x000000`
- Light gray: `0xf8f8f8`
- Dark gray: `0x333333`

## 📏 Recommended Settings

### Subtle Interaction
```javascript
{
    maxRotation: 5,
    lerpFactor: 0.05,
    autoRotate: false
}
```

### Dynamic Interaction
```javascript
{
    maxRotation: 15,
    lerpFactor: 0.15,
    autoRotate: true
}
```

### Smooth & Elegant
```javascript
{
    maxRotation: 10,
    lerpFactor: 0.08,
    autoRotate: true
}
```

## 🐛 Troubleshooting

**Banner not showing?**
- Check Three.js is loaded before threeBanner.js
- Verify container ID matches

**Model not loading?**
- Check file path is correct
- Look in browser console for errors
- Placeholder will show if model fails

**Performance slow?**
- Reduce model polygon count
- Lower lerpFactor
- Disable autoRotate

## 📁 File Locations

- **Module**: `threeBanner.js`
- **Models**: `models/` directory
- **Docs**: `3D_BANNER_README.md`
- **Test**: `test-banner.html`
- **Example**: `project-example.html`

## ⚡ Quick Test

1. Open `test-banner.html` in browser
2. Move mouse over banner
3. See placeholder geometry respond

---

**Full documentation**: See `3D_BANNER_README.md`
