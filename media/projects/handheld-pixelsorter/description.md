A self-contained handheld device for making glitch art through live pixel sorting — point it at anything, capture, sort, and export.

Harpy runs on a Raspberry Pi 5 with a 7" touchscreen and no desktop environment, booting directly into a Rust-based sorting interface. The workflow is immediate: photograph a subject, select a sorting algorithm (horizontal, vertical, or diagonal), adjust the threshold slider to control how pixels break into segments, optionally tint by hue, crop, and export to USB. Results can be fed back as new inputs for deeper fragmentation. A UPS HAT makes it battery-powered and fully portable.

The entire application — hardware integration, image processing, session management, UI — is written in Rust using egui, cross-compiled for the Pi. It runs as a systemd service with auto-sleep after five minutes idle.
