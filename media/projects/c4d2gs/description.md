C4D2GS is a Cinema 4D plugin that bridges 3D scene authoring and Gaussian Splatting reconstruction. It generates synthetic COLMAP datasets directly from within Cinema 4D: camera rigs, image sequences, sparse point clouds, and pose files, without any manual export or reformatting step.

The pipeline runs entirely inside the plugin: select an object, configure the capture rig, and export a folder structure ready for direct ingestion by Gaussian Splatting tools like nerfstudio or instant-ngp. Surface normal visibility filtering excludes backfacing geometry so the synthetic captures more closely resemble real photographic input.

The project emerged from a need to prototype and test Gaussian Splat reconstructions on controlled 3D geometry, bypassing the physical capture stage entirely. Writing it required building a working understanding of the COLMAP data format, camera model math, and Cinema 4D's Python SDK simultaneously.

C4D2GS is free and available for download on GitHub, Gumroad, and directly from this site.
