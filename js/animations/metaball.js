// ============================================
// Metaball Animation (Fullscreen)
// ============================================
class MetaballAnimation {
    constructor(canvasId, cursorCanvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cursorCanvas = document.getElementById(cursorCanvasId);
        this.cctx = this.cursorCanvas.getContext('2d');
        
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.cursorCanvas.width = this.width;
        this.cursorCanvas.height = this.height;
        
        this.balls = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseMoved = false;
        this.allowMouse = true;
        
        this.groupTransform = { x: 0, y: 0, scale: 1 };
        
        this.animationId = null;
        this.lastTime = performance.now();
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        const radius = 50;
        
        for(let i = 0; i < 4; i++) {
            const isCenter = i === 0;
            const angle = isCenter ? 0 : ((i - 1) / 3) * Math.PI * 2;
            this.balls.push({
                x: this.width / 2,
                y: this.height / 2,
                baseRadius: radius,
                radius,
                isCenter,
                orbitAngle: angle,
                orbitRadius: 120,
                age: 0,
                vx: 0,
                vy: 0
            });
        }
    }
    
    setupEventListeners() {
        this.resizeHandler = () => this.resize();
        this.moveHandler = (e) => this.onMove(e);
        this.touchMoveHandler = (e) => this.onTouchMove(e);
        this.pointerDownHandler = (e) => this.onPointerDown(e);
        this.dblClickHandler = (e) => this.onDblClick(e);
        this.keyDownHandler = (e) => this.onKeyDown(e);
        
        window.addEventListener('resize', this.resizeHandler);
        window.addEventListener('pointermove', this.moveHandler);
        this.canvas.addEventListener('pointerdown', this.pointerDownHandler);
        this.canvas.addEventListener('dblclick', this.dblClickHandler);
        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('touchmove', this.touchMoveHandler);
    }
    
    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        if(this.cursorCanvas) {
            this.cursorCanvas.width = this.width;
            this.cursorCanvas.height = this.height;
        }
    }
    
    onMove(e) {
        if(!this.allowMouse) return;
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.mouseMoved = true;
    }
    
    onTouchMove(e) {
        if(!this.allowMouse) return;
        const t = e.touches[0];
        this.mouseX = t.clientX;
        this.mouseY = t.clientY;
        this.mouseMoved = true;
    }
    
    onPointerDown(e) {
        const dx = e.clientX - this.mouseX;
        const dy = e.clientY - this.mouseY;
        if(Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        
        for(const b of this.balls) {
            const distX = e.clientX - b.x;
            const distY = e.clientY - b.y;
            const dist = Math.sqrt(distX * distX + distY * distY);
            if(dist < 150) {
                const force = 20;
                b.vx -= (distX / dist) * force;
                b.vy -= (distY / dist) * force;
            }
        }
    }
    
    onDblClick(e) {
        for(const b of this.balls) {
            const dx = e.clientX - b.x;
            const dy = e.clientY - b.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if(distance < 100) {
                const force = 30;
                b.vx += (dx / distance) * force;
                b.vy += (dy / distance) * force;
            }
        }
    }
    
    onKeyDown(e) {
        if(e.key === 'r' || e.key === 'R') {
            for(const b of this.balls) {
                b.x = this.width / 2 + (Math.random() - 0.5) * 10;
                b.y = this.height / 2 + (Math.random() - 0.5) * 10;
                b.vx = 0;
                b.vy = 0;
                b.age = 0;
            }
            this.mouseMoved = false;
        }
    }
    
    updateBall(ball, dt) {
        ball.age += dt;
        const cx = this.width / 2;
        const cy = this.height / 2;
        
        // Keep radius constant
        if(ball.isCenter) {
            ball.radius = ball.baseRadius;
        }
        
        // Initial formation / orbital behaviour for the first 2 seconds
        if(ball.age <= 2) {
            if(ball.isCenter) {
                // center just pulses
            } else {
                if(ball.age <= 1) {
                    // ease into orbit positions
                    const targetX = cx + Math.cos(ball.orbitAngle) * ball.orbitRadius;
                    const targetY = cy + Math.sin(ball.orbitAngle) * ball.orbitRadius;
                    ball.x += (targetX - ball.x) * 0.05;
                    ball.y += (targetY - ball.y) * 0.05;
                } else {
                    // follow orbital motion
                    ball.orbitAngle += 0.02;
                    ball.x = cx + Math.cos(ball.orbitAngle) * ball.orbitRadius;
                    ball.y = cy + Math.sin(ball.orbitAngle) * ball.orbitRadius;
                }
            }
        } else {
            // After intro, physics-based motion
            ball.x += ball.vx * 0.5;
            ball.y += ball.vy * 0.5;
            
            // Mouse interaction
            const dx = this.mouseX - ball.x;
            const dy = this.mouseY - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if(distance < 400) {
                const force = (400 - distance) / 400;
                ball.vx += (dx / distance) * force * 0.8;
                ball.vy += (dy / distance) * force * 0.8;
            }
            
            // Wall bouncing
            if(ball.x <= ball.radius) {
                ball.x = ball.radius;
                ball.vx = Math.abs(ball.vx) || 0.5;
            } else if(ball.x >= this.width - ball.radius) {
                ball.x = this.width - ball.radius;
                ball.vx = -Math.abs(ball.vx) || -0.5;
            }
            
            if(ball.y <= ball.radius) {
                ball.y = ball.radius;
                ball.vy = Math.abs(ball.vy) || 0.5;
            } else if(ball.y >= this.height - ball.radius) {
                ball.y = this.height - ball.radius;
                ball.vy = -Math.abs(ball.vy) || -0.5;
            }
        }
        
        // Friction
        ball.vx *= 0.99; // Reduced drag slightly
        ball.vy *= 0.99;
    }
    
    draw() {
        // Clear canvas completely
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Check current theme
        const theme = document.body.getAttribute('data-theme') || 'dark';
        const isDark = theme === 'dark';
        const color = isDark ? '255, 255, 255' : '0, 0, 0';
        
        // Apply group transform
        this.ctx.save();
        const gx = this.groupTransform.x;
        const gy = this.groupTransform.y;
        const gs = this.groupTransform.scale;
        this.ctx.translate(gx, gy);
        this.ctx.scale(gs, gs);
        
        // Metaballs with edge blur
        this.ctx.globalCompositeOperation = 'source-over';
        for(const b of this.balls) {
            this.ctx.shadowColor = `rgba(${color}, 0.4)`;
            this.ctx.shadowBlur = 40;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            this.ctx.fillStyle = `rgba(${color}, 0.95)`;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.restore();
        
        // Draw cursor
        this.cctx.clearRect(0, 0, this.width, this.height);
        if(this.mouseMoved && this.mouseX > 0 && this.mouseY > 0) {
            this.cctx.save();
            const g = this.cctx.createRadialGradient(this.mouseX, this.mouseY, 0, this.mouseX, this.mouseY, 15);
            g.addColorStop(0, `rgba(${color}, 0.6)`);
            g.addColorStop(0.5, `rgba(${color}, 0.2)`);
            g.addColorStop(1, `rgba(${color}, 0)`);
            this.cctx.fillStyle = g;
            this.cctx.beginPath();
            this.cctx.arc(this.mouseX, this.mouseY, 10, 0, Math.PI * 2);
            this.cctx.fill();
            this.cctx.restore();
        }
    }
    
    animate() {
        const t = performance.now();
        const dt = (t - this.lastTime) / 1000;
        this.lastTime = t;
        
        for(const b of this.balls) this.updateBall(b, dt);
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if(this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('resize', this.resizeHandler);
        window.removeEventListener('pointermove', this.moveHandler);
        this.canvas.removeEventListener('pointerdown', this.pointerDownHandler);
        this.canvas.removeEventListener('dblclick', this.dblClickHandler);
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('touchmove', this.touchMoveHandler);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetaballAnimation;
}
