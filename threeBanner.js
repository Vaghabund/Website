/**
 * 3D Banner Module
 * Reusable Three.js banner with cursor interaction
 */

class ThreeBanner {
    constructor(containerId, modelPath, options = {}) {
        this.containerId = containerId;
        this.modelPath = modelPath;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.error(`Container with ID "${containerId}" not found`);
            return;
        }
        
        // Options with defaults
        this.options = {
            interactionType: options.interactionType || 'cursor-follow', // 'cursor-follow', 'rotate', 'tilt'
            height: options.height || 500,
            backgroundColor: options.backgroundColor !== undefined ? options.backgroundColor : 0xffffff,
            modelScale: options.modelScale || 1,
            autoRotate: options.autoRotate !== undefined ? options.autoRotate : false,
            maxRotation: options.maxRotation || 10, // degrees
            lerpFactor: options.lerpFactor || 0.1
        };
        
        // Mouse tracking
        this.mouse = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        this.currentRotation = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.offsetWidth / this.options.height,
            0.1,
            1000
        );
        this.camera.position.z = 5;
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.offsetWidth, this.options.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Setup lights
        this.setupLights();
        
        // Load model
        this.loadModel();
        
        // Event listeners
        this.setupEventListeners();
        
        // Start animation loop
        this.animate();
    }
    
    setupLights() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);
        
        // Directional light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.directionalLight.position.set(5, 5, 5);
        this.scene.add(this.directionalLight);
        
        // Point light that follows cursor
        this.pointLight = new THREE.PointLight(0xffffff, 1, 100);
        this.pointLight.position.set(0, 0, 5);
        this.scene.add(this.pointLight);
        
        // Target position for point light (for lerping)
        this.targetLightPosition = { x: 0, y: 0, z: 5 };
    }
    
    loadModel() {
        // For demonstration, create a simple geometric object
        // Replace this with GLTFLoader for actual 3D models
        
        if (this.modelPath.endsWith('.gltf') || this.modelPath.endsWith('.glb')) {
            this.loadGLTFModel();
        } else {
            // Fallback: create a placeholder geometry
            this.createPlaceholderGeometry();
        }
    }
    
    loadGLTFModel() {
        const loader = new THREE.GLTFLoader();
        
        loader.load(
            this.modelPath,
            (gltf) => {
                this.model = gltf.scene;
                this.model.scale.set(
                    this.options.modelScale,
                    this.options.modelScale,
                    this.options.modelScale
                );
                
                // Center the model
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                this.model.position.sub(center);
                
                this.scene.add(this.model);
            },
            null, // progress callback - not needed
            (error) => {
                console.error('Error loading model:', error);
                this.createPlaceholderGeometry();
            }
        );
    }
    
    createPlaceholderGeometry() {
        // Create a stylish placeholder geometry
        const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.7,
            roughness: 0.2
        });
        this.model = new THREE.Mesh(geometry, material);
        this.scene.add(this.model);
    }
    
    setupEventListeners() {
        // Mouse move
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        });
        
        // Window resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    onResize() {
        const width = this.container.offsetWidth;
        const height = this.options.height;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    updateInteraction() {
        if (!this.model) return;
        
        const maxRot = THREE.MathUtils.degToRad(this.options.maxRotation);
        
        // Calculate target rotation based on mouse position
        this.targetRotation.y = this.mouse.x * maxRot;
        this.targetRotation.x = this.mouse.y * maxRot;
        
        // Lerp current rotation towards target
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * this.options.lerpFactor;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * this.options.lerpFactor;
        
        // Apply rotation to model
        if (this.options.interactionType === 'cursor-follow' || this.options.interactionType === 'tilt') {
            this.model.rotation.x = this.currentRotation.x;
            this.model.rotation.y = this.currentRotation.y;
        }
        
        // Auto rotate
        if (this.options.autoRotate) {
            this.model.rotation.y += 0.005;
        }
        
        // Update point light position (cursor-following light)
        this.targetLightPosition.x = this.mouse.x * 5;
        this.targetLightPosition.y = this.mouse.y * 5;
        
        this.pointLight.position.x += (this.targetLightPosition.x - this.pointLight.position.x) * this.options.lerpFactor;
        this.pointLight.position.y += (this.targetLightPosition.y - this.pointLight.position.y) * this.options.lerpFactor;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateInteraction();
        this.renderer.render(this.scene, this.camera);
    }
    
    destroy() {
        // Cleanup
        this.container.removeChild(this.renderer.domElement);
        this.renderer.dispose();
        if (this.model) {
            this.scene.remove(this.model);
        }
    }
}

// Export for use in other scripts
window.ThreeBanner = ThreeBanner;

/**
 * Initialize a 3D banner
 * @param {string} containerId - ID of the container element
 * @param {string} modelPath - Path to the 3D model file
 * @param {Object} options - Configuration options
 * @returns {ThreeBanner} Banner instance
 */
window.init3DBanner = function(containerId, modelPath, options = {}) {
    return new ThreeBanner(containerId, modelPath, options);
};
