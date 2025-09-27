class Metaball {
    constructor(x, y, radius, color, angle, initialForce, isCenter = false) {
        this.x = x;
        this.y = y;
        this.baseRadius = radius;
        this.radius = radius;
        this.color = color;
        this.isCenter = isCenter; // Flag for center ball
        
        // Initial explosion impulse
        this.vx = Math.cos(angle) * initialForce;
        this.vy = Math.sin(angle) * initialForce;
        
        this.targetX = x;
        this.targetY = y;
        this.mouseForce = 0;
        this.age = 0; // Track how long the ball has existed
        this.orbitAngle = angle; // For orbital motion
        this.orbitRadius = 120; // Distance from center for orbiting balls
    }

    reset(x, y, angle, initialForce, isCenter = false) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * initialForce;
        this.vy = Math.sin(angle) * initialForce;
        this.age = 0;
        this.mouseForce = 0;
        this.radius = this.baseRadius;
        this.isCenter = isCenter;
        this.orbitAngle = angle;
        this.transitionStart = null; // Reset transition timing
    }

    update(canvas, mouseX, mouseY, mouseMoved) {
        this.age += 0.016; // Roughly 60fps timing
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Phase 1: Intro animation (0-4 seconds)
        if (this.age <= 4) {
            if (this.isCenter) {
                // Center ball stays in place with gentle breathing motion
                this.radius = this.baseRadius + Math.sin(this.age * 2) * 5;
                // Very minimal movement to keep it alive
                this.vx *= 0.95;
                this.vy *= 0.95;
            } else {
                // Orbiting balls move outward then orbit
                if (this.age <= 1) {
                    // Move outward to orbit position
                    const targetX = centerX + Math.cos(this.orbitAngle) * this.orbitRadius;
                    const targetY = centerY + Math.sin(this.orbitAngle) * this.orbitRadius;
                    
                    this.x += (targetX - this.x) * 0.05;
                    this.y += (targetY - this.y) * 0.05;
                } else {
                    // Orbital motion around center
                    this.orbitAngle += 0.02; // Slow rotation speed
                    this.x = centerX + Math.cos(this.orbitAngle) * this.orbitRadius;
                    this.y = centerY + Math.sin(this.orbitAngle) * this.orbitRadius;
                }
            }
        }
        // Phase 2: Continue orbital motion until mouse moves
        else if (!mouseMoved) {
            if (this.isCenter) {
                // Center ball continues breathing
                this.radius = this.baseRadius + Math.sin(this.age * 2) * 5;
                this.vx *= 0.95;
                this.vy *= 0.95;
            } else {
                // Continue orbital motion
                this.orbitAngle += 0.02;
                this.x = centerX + Math.cos(this.orbitAngle) * this.orbitRadius;
                this.y = centerY + Math.sin(this.orbitAngle) * this.orbitRadius;
            }
        }
        // Phase 3: Transition to interactive (when mouse first moves)
        else if (this.age - this.transitionStart <= 1) {
            // Set transition start time if not set
            if (!this.transitionStart) {
                this.transitionStart = this.age;
                // Give all balls some initial velocity for natural transition
                this.vx = (Math.random() - 0.5) * 3;
                this.vy = (Math.random() - 0.5) * 3;
            }
            
            // Update position with velocity
            this.x += this.vx * 0.5;
            this.y += this.vy * 0.5;
            
            // Light friction during transition
            this.vx *= 0.95;
            this.vy *= 0.95;
        }
        // Phase 4: Interactive phase
        else {
            // Update position with velocity
            this.x += this.vx * 0.5;
            this.y += this.vy * 0.5;

            // Add some random movement for liveliness
            this.vx += (Math.random() - 0.5) * 0.1;
            this.vy += (Math.random() - 0.5) * 0.1;

            // Mouse interaction (only active in interactive phase)
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 250) {
                const force = (250 - distance) / 250;
                this.vx += (dx / distance) * force * 0.8;
                this.vy += (dy / distance) * force * 0.8;
                this.mouseForce = force;
            } else {
                this.mouseForce *= 0.95;
            }
        }

        // Wall bouncing (always active)
        if (this.x <= this.radius) {
            this.x = this.radius;
            this.vx = Math.abs(this.vx) || 0.5; // ensure it's moving away
        } else if (this.x >= canvas.width - this.radius) {
            this.x = canvas.width - this.radius;
            this.vx = -Math.abs(this.vx) || -0.5;
        }

        if (this.y <= this.radius) {
            this.y = this.radius;
            this.vy = Math.abs(this.vy) || 0.5;
        } else if (this.y >= canvas.height - this.radius) {
            this.y = canvas.height - this.radius;
            this.vy = -Math.abs(this.vy) || -0.5;
        }

        // Apply friction
        this.vx *= 0.98;
        this.vy *= 0.98;

        // Dynamic radius based on mouse interaction (only in interactive phase)
        if (mouseMoved && this.transitionStart && (this.age - this.transitionStart > 1)) {
            this.radius = this.baseRadius + this.mouseForce * 20;
        }
    }
}

class MetaballAnimation {
    constructor() {
        this.canvas = document.getElementById('metaballCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.metaballs = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseMoved = false; // Track if mouse has moved
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        this.resize();
        this.createMetaballs();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createMetaballs() {
        const colors = [
            'rgba(255, 255, 255, 0.9)',
            'rgba(220, 220, 220, 0.8)',
            'rgba(190, 190, 190, 0.8)',
            'rgba(160, 160, 160, 0.8)',
            'rgba(130, 130, 130, 0.8)'
        ];

        this.metaballs = [];
        
        // Center position for initial stack
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Create exactly 4 balls: 1 center + 3 orbiting
        for (let i = 0; i < 4; i++) {
            const isCenter = i === 0;
            let angle, initialForce;
            
            if (isCenter) {
                angle = 0;
                initialForce = 0;
            } else {
                // Evenly distribute the 3 orbiting balls
                angle = ((i - 1) / 3) * Math.PI * 2;
                initialForce = 0; // No initial force for intro animation
            }
            
            // Start all balls at center (with tiny random offset to prevent perfect overlap)
            const x = centerX + (Math.random() - 0.5) * 10;
            const y = centerY + (Math.random() - 0.5) * 10;
            const radius = 50;
            const color = colors[i % colors.length];
            
            this.metaballs.push(new Metaball(x, y, radius, color, angle, initialForce, isCenter));
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createMetaballs();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.mouseMoved = true; // Mark that mouse has moved
        });

        // Touch support for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.mouseX = touch.clientX;
            this.mouseY = touch.clientY;
            this.mouseMoved = true; // Mark that touch has moved
        });

        // Replay button functionality
        const replayButton = document.getElementById('replayButton');
        replayButton.addEventListener('click', () => {
            this.replayAnimation();
        });
    }

    replayAnimation() {
        // Reset mouse moved state
        this.mouseMoved = false;
        
        // Reset all metaballs to center for intro animation
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < this.metaballs.length; i++) {
            const ball = this.metaballs[i];
            const isCenter = i === 0;
            let angle, initialForce;
            
            if (isCenter) {
                angle = 0;
                initialForce = 0;
            } else {
                angle = ((i - 1) / 3) * Math.PI * 2;
                initialForce = 0;
            }
            
            const x = centerX + (Math.random() - 0.5) * 10;
            const y = centerY + (Math.random() - 0.5) * 10;
            
            ball.reset(x, y, angle, initialForce, isCenter);
        }
    }

    drawMetaballs() {
        const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        // Calculate metaball field for each pixel
        for (let x = 0; x < this.canvas.width; x += 2) {
            for (let y = 0; y < this.canvas.height; y += 2) {
                let sum = 0;
                let colorR = 0, colorG = 0, colorB = 0, colorA = 0;
                
                for (const ball of this.metaballs) {
                    const dx = x - ball.x;
                    const dy = y - ball.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        const influence = (ball.radius * ball.radius) / (distance * distance);
                        sum += influence;
                        
                        // Extract color components
                        const rgba = ball.color.match(/rgba?\(([^)]+)\)/)[1].split(',');
                        const weight = influence;
                        colorR += parseInt(rgba[0]) * weight;
                        colorG += parseInt(rgba[1]) * weight;
                        colorB += parseInt(rgba[2]) * weight;
                        colorA += parseFloat(rgba[3] || 1) * weight;
                    }
                }
                
                // If the sum exceeds threshold, draw the pixel
                if (sum > 1) {
                    const intensity = Math.min(sum / 3, 1);
                    const pixelIndex = (y * this.canvas.width + x) * 4;
                    
                    if (pixelIndex < data.length) {
                        data[pixelIndex] = colorR / sum * intensity;     // R
                        data[pixelIndex + 1] = colorG / sum * intensity; // G
                        data[pixelIndex + 2] = colorB / sum * intensity; // B
                        data[pixelIndex + 3] = Math.min(colorA / sum * intensity * 255, 255); // A
                        
                        // Fill neighboring pixels for smoother appearance
                        if (x + 1 < this.canvas.width) {
                            const nextIndex = (y * this.canvas.width + (x + 1)) * 4;
                            if (nextIndex < data.length) {
                                data[nextIndex] = data[pixelIndex];
                                data[nextIndex + 1] = data[pixelIndex + 1];
                                data[nextIndex + 2] = data[pixelIndex + 2];
                                data[nextIndex + 3] = data[pixelIndex + 3];
                            }
                        }
                    }
                }
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    animate() {
        // Clear canvas with a slight trail effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update metaballs
        for (const ball of this.metaballs) {
            ball.update(this.canvas, this.mouseX, this.mouseY, this.mouseMoved);
        }
        
        // Draw metaballs using a simpler approach for better performance
        this.ctx.globalCompositeOperation = 'screen';
        
        for (const ball of this.metaballs) {
            // Create gradient for each metaball
            const gradient = this.ctx.createRadialGradient(
                ball.x, ball.y, 0,
                ball.x, ball.y, ball.radius
            );
            
            gradient.addColorStop(0, ball.color);
            gradient.addColorStop(0.7, ball.color.replace(/0\.\d+/, '0.3'));
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Draw cursor as a small white dot
        if (this.mouseX > 0 && this.mouseY > 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.beginPath();
            this.ctx.arc(this.mouseX, this.mouseY, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the animation when the page loads
window.addEventListener('load', () => {
    new MetaballAnimation();
});