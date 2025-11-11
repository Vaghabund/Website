# 3D Models Directory

Place your 3D model files (.glb or .gltf) in this directory.

## Recommended Format
- **GLB** (Binary GLTF) - Preferred for web, single file with embedded textures
- **GLTF** - JSON format with external resources

## File Naming
Use descriptive names that match your project IDs:
- `project1.glb`
- `project2.glb`
- `photogrammetry-thesis.glb`

## Free Model Resources
- [Sketchfab](https://sketchfab.com/) - Download free models in GLTF format
- [Poly Haven](https://polyhaven.com/models) - Free CC0 3D models
- [glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models) - Test models

## Model Optimization
Before adding models to your website, optimize them:

```bash
# Install gltf-pipeline
npm install -g gltf-pipeline

# Compress a model with Draco
gltf-pipeline -i input.glb -o output.glb -d
```

## Example Models for Testing
If you don't have models yet, the banner will show a placeholder geometry (stylish torus knot).
