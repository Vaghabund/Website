// ============================================
// Project Data
// ============================================
const projectsData = [
    {
        id: 1,
        title: 'Operational Analysis of Photogrammetry',
        subtitle: 'Master Thesis',
        year: '2025',
        description: 'A modern web application built with React and Node.js, featuring real-time collaboration and advanced data visualization.',
        fullDescription: 'Project Alpha represents a comprehensive solution for team collaboration in data-intensive environments. Built with modern web technologies, it provides real-time synchronization, advanced analytics, and intuitive user interfaces that make complex data accessible to all team members.',
        image: 'https://picsum.photos/400/250?random=1',
        thumbnailImage: 'https://picsum.photos/60/40?random=11',
        heroImage: 'https://picsum.photos/800/400?random=21',
        challenge: 'The main challenge was creating a system that could handle real-time data updates while maintaining performance and user experience across different devices and network conditions.',
        solution: 'We implemented a WebSocket-based architecture with optimistic updates and conflict resolution, paired with a responsive design system that adapts to various screen sizes and interaction methods.',
        role: 'Lead Developer & UI Designer',
        timeline: '4 months',
        technologies: ['TouchDesigner', 'Python', 'WebSocket', 'MongoDB'],
        liveUrl: 'https://example.com',
        gallery: [
            'https://picsum.photos/600/400?random=31',
            'https://picsum.photos/600/400?random=32'
        ]
    },
    {
        id: 2,
        title: 'Project Beta',
        subtitle: 'UI/UX Design',
        year: '2024',
        description: 'Complete redesign of a mobile banking application, focusing on accessibility and user experience improvements.',
        fullDescription: 'A comprehensive redesign of a banking application that serves over 50,000 users daily. The project focused on improving accessibility, streamlining user flows, and creating a more intuitive financial management experience.',
        image: 'https://picsum.photos/400/250?random=2',
        thumbnailImage: 'https://picsum.photos/60/40?random=12',
        heroImage: 'https://picsum.photos/800/400?random=22',
        challenge: 'The existing app had poor accessibility scores and complex navigation that confused users, particularly older demographics.',
        solution: 'Implemented a new design system with clear visual hierarchy, improved color contrast, and simplified user flows based on extensive user testing.',
        role: 'UX Designer & Researcher',
        timeline: '6 months',
        technologies: ['Figma', 'React Native', 'Accessibility Testing', 'User Research'],
        gallery: [
            'https://picsum.photos/600/400?random=33',
            'https://picsum.photos/600/400?random=34'
        ]
    },
    {
        id: 3,
        title: 'Project Gamma',
        subtitle: 'Mobile App',
        year: '2023',
        description: 'Cross-platform mobile application for fitness tracking with AI-powered workout recommendations.',
        fullDescription: 'An innovative fitness application that uses machine learning to provide personalized workout recommendations based on user behavior, fitness level, and goals.',
        image: 'https://picsum.photos/400/250?random=3',
        thumbnailImage: 'https://picsum.photos/60/40?random=13',
        heroImage: 'https://picsum.photos/800/400?random=23',
        challenge: 'Creating an AI system that could provide accurate, personalized fitness recommendations while maintaining user privacy and data security.',
        solution: 'Developed a federated learning system that processes user data locally while contributing to model improvements without compromising personal information.',
        role: 'Mobile Developer & ML Engineer',
        timeline: '8 months',
        technologies: ['React Native', 'TensorFlow', 'Python', 'Firebase', 'HealthKit'],
        gallery: [
            'https://picsum.photos/600/400?random=35',
            'https://picsum.photos/600/400?random=36'
        ]
    },
    {
        id: 4,
        title: 'Project Delta',
        subtitle: 'Brand Identity',
        year: '2023',
        description: 'Complete brand identity design for a sustainable fashion startup, including logo, packaging, and digital presence.',
        fullDescription: 'A comprehensive brand identity project for EcoThreads, a sustainable fashion startup committed to ethical manufacturing and environmental responsibility.',
        image: 'https://picsum.photos/400/250?random=4',
        thumbnailImage: 'https://picsum.photos/60/40?random=14',
        heroImage: 'https://picsum.photos/800/400?random=24',
        challenge: 'Creating a brand identity that communicates both premium quality and environmental consciousness in a crowded fashion market.',
        solution: 'Developed a minimalist design language with earth-tones and sustainable materials, paired with clear messaging about the brand\'s environmental impact.',
        role: 'Brand Designer & Art Director',
        timeline: '3 months',
        technologies: ['Adobe Creative Suite', 'Figma', 'Print Design', 'Web Design'],
        gallery: [
            'https://picsum.photos/600/400?random=37',
            'https://picsum.photos/600/400?random=38'
        ]
    }
];

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
        // Clear with white background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        this.ctx.fillRect(0, 0, this.size, this.size);
        
        // Draw balls with same style as main animation - solid black with blur
        this.ctx.globalCompositeOperation = 'source-over';
        for(const b of this.balls) {
            // Add blur effect
            this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // Solid black fill
            this.ctx.fillStyle = 'rgba(0,0,0,1)';
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
        
        // Center ball subtle pulsing
        if(ball.isCenter) {
            ball.radius = ball.baseRadius + Math.sin(ball.age * 2) * 5;
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
            
            if(distance < 250) {
                const force = (250 - distance) / 250;
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
        
        // Apply group transform
        this.ctx.save();
        const gx = this.groupTransform.x;
        const gy = this.groupTransform.y;
        const gs = this.groupTransform.scale;
        this.ctx.translate(gx, gy);
        this.ctx.scale(gs, gs);
        
        // Solid black metaballs with edge blur
        this.ctx.globalCompositeOperation = 'source-over';
        for(const b of this.balls) {
            this.ctx.shadowColor = 'rgba(0,0,0,0.9)';
            this.ctx.shadowBlur = 40;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            this.ctx.fillStyle = 'rgba(0,0,0,1)';
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
            const g = this.cctx.createRadialGradient(this.mouseX, this.mouseY, 0, this.mouseX, this.mouseY, 10);
            g.addColorStop(0, 'rgba(0,0,0,0.8)');
            g.addColorStop(0.7, 'rgba(0,0,0,0.3)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
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

// ============================================
// Portfolio App
// ============================================
class PortfolioApp {
    constructor() {
        this.expandedProject = null;
        this.selectedProject = null;
        this.logoAnimation = null;
        this.metaballAnimation = null;
        
        this.init();
    }
    
    init() {
        // Initialize logo animation
        this.logoAnimation = new LogoAnimation('logoCanvas');
        
        // Render projects
        this.renderProjects();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup header name stretch
        this.updateNameStretch();
        window.addEventListener('resize', () => this.updateNameStretch());
    }
    
    updateNameStretch() {
        const nameElement = document.getElementById('headerName');
        const headerContent = document.querySelector('.header-content');
        
        if(!nameElement || !headerContent) return;
        
        // Get the available width
        const headerWidth = headerContent.offsetWidth;
        const logoContainer = document.querySelector('.header-right');
        const logoWidth = logoContainer ? logoContainer.offsetWidth : 60;
        const gap = 20;
        const availableWidth = headerWidth - logoWidth - gap;
        
        // Get the natural width of the text
        nameElement.style.transform = 'scaleX(1)';
        const naturalWidth = nameElement.offsetWidth;
        
        // Calculate the scale factor
        const scaleX = availableWidth / naturalWidth;
        
        // Apply the transform
        nameElement.style.transform = `scaleX(${scaleX})`;
    }
    
    setupEventListeners() {
        // Header name click - go back to projects
        document.getElementById('headerName').addEventListener('click', () => {
            this.selectedProject = null;
            this.showProjects();
        });
        
        // Logo click - show fullscreen animation
        document.getElementById('logoContainer').addEventListener('click', () => {
            this.showAnimationPopup();
        });
        
        // Close button
        document.getElementById('closeButton').addEventListener('click', () => {
            this.closeAnimationPopup();
        });
    }
    
    renderProjects() {
        const projectList = document.getElementById('projectList');
        projectList.innerHTML = '';
        
        projectsData.forEach(project => {
            const li = document.createElement('li');
            li.className = 'project-item';
            
            li.innerHTML = `
                <div class="project-header" data-project-id="${project.id}" style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center;">
                    <h3 class="project-title" style="text-align: left; color: black; word-wrap: break-word;">${project.title}</h3>
                    <span class="project-subtitle" style="text-align: center; color: black;">${project.subtitle}</span>
                    <span class="project-year" style="text-align: right; color: black;">${project.year}</span>
                </div>

                <style>
                    @media (max-width: 768px) {
                        .project-header .project-subtitle {
                            display: none;
                        }
                        .project-header {
                            grid-template-columns: 1fr 1fr; /* Two columns: title and year */
                        }
                        .project-title {
                            text-align: left;
                        }
                        .project-year {
                            text-align: right; /* Ensure year stays right-aligned */
                            justify-self: end; /* Explicitly align to the right in the grid */
                        }
                    }
                </style>
                <div class="project-details" data-project-details-id="${project.id}">
                    <div class="project-content">
                        <div class="project-description">
                            <p>${project.description}</p>
                            <button class="see-project-link" data-see-project-id="${project.id}">
                                See project →
                            </button>
                        </div>
                        <div class="project-image">
                            <img src="${project.image}" alt="${project.title}" />
                        </div>
                    </div>
                </div>
            `;
            
            projectList.appendChild(li);
            
            // Add event listener for project header
            const header = li.querySelector('.project-header');
            header.addEventListener('click', () => this.toggleProject(project.id));
            
            // Add event listener for "See project" button
            const seeProjectBtn = li.querySelector('.see-project-link');
            seeProjectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showProjectDetail(project);
            });
        });
    }
    
    toggleProject(projectId) {
        const detailsElement = document.querySelector(`[data-project-details-id="${projectId}"]`);

        if (this.expandedProject === projectId) {
            // Collapse if already expanded
            detailsElement.classList.remove('expanded');
            this.expandedProject = null;
        } else {
            // Collapse any previously expanded tooltip
            if (this.expandedProject !== null) {
                const prevDetails = document.querySelector(`[data-project-details-id="${this.expandedProject}"]`);
                if (prevDetails) prevDetails.classList.remove('expanded');
            }

            // Expand the clicked tooltip
            detailsElement.classList.add('expanded');
            this.expandedProject = projectId;
        }
    }
    
    showProjectDetail(project) {
        this.selectedProject = project;
        
        const projectPage = document.getElementById('projectPage');
        const projectsContainer = document.getElementById('projectsContainer');
        
        // Build project detail HTML
        let galleryHTML = '';
        if(project.gallery && project.gallery.length > 0) {
            galleryHTML = `
                <div class="project-gallery">
                    <h3>Gallery</h3>
                    <div class="gallery-grid">
                        ${project.gallery.map(img => `<img src="${img}" alt="${project.title}" />`).join('')}
                    </div>
                </div>
            `;
        }
        
        let challengeHTML = '';
        if(project.challenge) {
            challengeHTML = `
                <h3>Challenge</h3>
                <p>${project.challenge}</p>
            `;
        }
        
        let solutionHTML = '';
        if(project.solution) {
            solutionHTML = `
                <h3>Solution</h3>
                <p>${project.solution}</p>
            `;
        }
        
        let liveUrlHTML = '';
        if(project.liveUrl) {
            liveUrlHTML = `
                <div class="project-info-item">
                    <h4>Links</h4>
                    <a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="project-link">
                        View Live Site →
                    </a>
                </div>
            `;
        }
        
        projectPage.innerHTML = `
            <button class="back-button" id="backButton">← Back to Projects</button>
            
            <div class="project-page-content">
                <header class="project-page-header">
                    <h1 class="project-page-title">${project.title}</h1>
                    <p class="project-page-subtitle">${project.subtitle}</p>
                </header>
                
                <div class="project-page-body">
                    <div class="project-hero-image">
                        <img src="${project.heroImage || project.image}" alt="${project.title}" />
                    </div>
                    
                    <div class="project-details-grid">
                        <div class="project-description-section">
                            <h3>Overview</h3>
                            <p>${project.fullDescription || project.description}</p>
                            
                            ${challengeHTML}
                            ${solutionHTML}
                        </div>
                        
                        <div class="project-info-section">
                            <div class="project-info-item">
                                <h4>Role</h4>
                                <p>${project.role || 'Full Stack Developer'}</p>
                            </div>
                            
                            <div class="project-info-item">
                                <h4>Timeline</h4>
                                <p>${project.timeline || '3 months'}</p>
                            </div>
                            
                            <div class="project-info-item">
                                <h4>Technologies</h4>
                                <ul class="tech-list">
                                    ${(project.technologies || ['React', 'Node.js', 'CSS']).map(tech => `<li>${tech}</li>`).join('')}
                                </ul>
                            </div>
                            
                            ${liveUrlHTML}
                        </div>
                    </div>
                    
                    ${galleryHTML}
                </div>
            </div>
        `;
        
        // Show project page, hide projects list
        projectsContainer.style.display = 'none';
        projectPage.style.display = 'block';
        
        // Setup back button
        document.getElementById('backButton').addEventListener('click', () => {
            this.showProjects();
        });
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    showProjects() {
        const projectPage = document.getElementById('projectPage');
        const projectsContainer = document.getElementById('projectsContainer');
        
        projectPage.style.display = 'none';
        projectsContainer.style.display = 'block';
        
        this.selectedProject = null;
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    showAnimationPopup() {
        const overlay = document.getElementById('animationOverlay');
        overlay.style.display = 'block';
        
        // Initialize metaball animation
        this.metaballAnimation = new MetaballAnimation('metaballCanvas', 'cursorCanvas');
    }
    
    closeAnimationPopup() {
        const overlay = document.getElementById('animationOverlay');
        overlay.style.display = 'none';
        
        // Destroy metaball animation
        if(this.metaballAnimation) {
            this.metaballAnimation.destroy();
            this.metaballAnimation = null;
        }
    }
}

// ============================================
// Initialize on page load
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    new PortfolioApp();
});
