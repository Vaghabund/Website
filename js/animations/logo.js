// ============================================
// Logo Animation
// ============================================
class LogoAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.size = 40;
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        
        this.centerX = this.size / 2;
        this.centerY = this.size / 2;
        this.radius = 4;
        
        this.balls = [];
        this.animationId = null;
        this.lastTime = performance.now();
        
        this.init();
        this.animate();
    }
    
    init() {
        // Create 4 balls in orbital formation
        for(let i = 0; i < 4; i++) {
            const isCenter = i === 0;
            const angle = isCenter ? 0 : ((i - 1) / 3) * Math.PI * 2;
            this.balls.push({ 
                x: this.centerX, 
                y: this.centerY, 
                baseRadius: this.radius, 
                radius: this.radius, 
                isCenter, 
                orbitAngle: angle, 
                orbitRadius: 14,
                age: 0 
            });
        }
    }
    
    updateBall(ball, dt) {
        ball.age += dt;
        
        // Center ball subtle pulsing
        if(ball.isCenter) {
            ball.radius = ball.baseRadius + Math.sin(ball.age * 1.5) * 1;
        } else {
            // Slower orbital motion
            ball.orbitAngle += 0.008;
            ball.x = this.centerX + Math.cos(ball.orbitAngle) * ball.orbitRadius;
            ball.y = this.centerY + Math.sin(ball.orbitAngle) * ball.orbitRadius;
        }
    }
    
    draw() {
        // Clear with transparent background (was white)
        this.ctx.clearRect(0, 0, this.size, this.size);
        
        // Check current theme
        const theme = document.body.getAttribute('data-theme') || 'dark';
        const isDark = theme === 'dark';
        const color = isDark ? '255, 255, 255' : '0, 0, 0';
        
        // Draw balls with same style as main animation
        this.ctx.globalCompositeOperation = 'source-over';
        for(const b of this.balls) {
            // Add subtle glow
            this.ctx.shadowColor = `rgba(${color}, 0.4)`;
            this.ctx.shadowBlur = 6;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // Fill
            this.ctx.fillStyle = `rgba(${color}, 0.9)`;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Reset shadow for next iteration
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
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
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogoAnimation;
}
