class PortfolioApp {
    constructor() {
        this.expandedProject = null;
        this.selectedProject = null;
        this.logoAnimation = null;
        this.metaballAnimation = null;
        
        this.init();
    }
    
    init() {
        // Render projects
        this.renderProjects();
        this.renderArchiveGrid();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup video
        this.setupVideo();
        
        // Header name stretch removed — keep name static
        
        // Setup draggable image
        this.setupDraggableImage();
    }
    
    setupVideo() {
        const introVideo = document.getElementById('greyhoundVideo');
        if (introVideo) {
            // Ensure video is loaded before attempting to play
            const attemptPlay = () => {
                introVideo.play()
                    .then(() => {})
                    .catch(e => {
                        // Autoplay prevented, attempting with gesture
                        // On iOS, sometimes need to wait for user interaction
                        // But we can try again if metadata loads
                        if (introVideo.readyState >= 2) {
                            introVideo.play().catch(() => {});
                        }
                    });
            };
            
            // Try to play when ready
            if (introVideo.readyState >= 2) {
                attemptPlay();
            } else {
                introVideo.addEventListener('canplay', attemptPlay, { once: true });
            }
            
            // Click to toggle play/pause
            introVideo.addEventListener('click', () => {
                if (introVideo.paused) {
                    introVideo.play();
                } else {
                    introVideo.pause();
                }
            });
            
            // Resume play on visibility change (iOS Safari)
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && introVideo.paused) {
                    introVideo.play().catch(() => {});
                }
            });
        }
    }

    setupDraggableImage() {
        const draggable = document.getElementById('draggableImage');
        if (!draggable) return;
        
        // Prevent right-click context menu on both images
        const imageStack = draggable.parentElement;
        const allImages = imageStack.querySelectorAll('img');
        allImages.forEach(img => {
            img.addEventListener('contextmenu', (e) => e.preventDefault());
            img.addEventListener('dragstart', (e) => e.preventDefault());
        });
        
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        draggable.addEventListener('mousedown', dragStart);
        draggable.addEventListener('touchstart', dragStart);
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
        
        function dragStart(e) {
            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }
            
            if (e.target === draggable) {
                isDragging = true;
            }
        }
        
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                
                if (e.type === 'touchmove') {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }
                
                xOffset = currentX;
                yOffset = currentY;
                
                setTranslate(currentX, currentY, draggable);
            }
        }
        
        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }
        
        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }
    }
    
    updateNameStretch() {
        // No-op: header scaling removed. Ensure name has no transform or extra margin.
        const nameElement = document.getElementById('headerName');
        if (!nameElement) return;
        nameElement.style.transform = '';
        nameElement.style.display = '';
        nameElement.style.transformOrigin = '';
        nameElement.style.marginRight = '';
    }
    
    setupEventListeners() {
        // Logo click - show fullscreen animation (using delegation to handle deferred header rendering)
        document.addEventListener('click', (e) => {
            const logoContainer = e.target.closest('#logoContainer');
            if (logoContainer) {
                const onHome = window.location.pathname.toLowerCase().includes('index.html');
                if (onHome) {
                    // Only allow animation on desktop when on landing page
                    if (window.innerWidth > 768) {
                        this.showAnimationPopup();
                    }
                } else {
                    // Navigate back home from project or other pages
                    window.location.href = 'index.html';
                }
                return;
            }
            
            const closeBtn = e.target.closest('#closeButton');
            if (closeBtn) {
                this.closeAnimationPopup();
                return;
            }
        });

        // Simple header menu marker behavior
        const siteMenu = document.getElementById('siteMenu');
        if (siteMenu) {
            const links = Array.from(siteMenu.querySelectorAll('.menu-link'));
            const marker = document.getElementById('menuMarker');

            const updateMarkerTo = (linkEl) => {
                if (!linkEl || !marker) return;
                const linkRect = linkEl.getBoundingClientRect();
                const parentRect = marker.parentElement.getBoundingClientRect();
                const left = linkRect.left - parentRect.left;
                marker.style.transform = `translateX(${left}px)`;
                marker.style.width = `${linkRect.width}px`;
            };

            this.updateMenuMarker = (target) => {
                const activeLink = links.find(l => l.dataset.target === target) || links[0];
                links.forEach(l => l.classList.toggle('active', l === activeLink));
                updateMarkerTo(activeLink);
                // Toggle name capsule active state when 'about' is selected
                const nameCapsule = document.querySelector('.name-capsule');
                if (nameCapsule) {
                    nameCapsule.classList.toggle('active', target === 'about');
                }
            };

            // Click handlers removed - now handled in header.js for SPA navigation

            // Keep marker positioned on resize
            window.addEventListener('resize', () => {
                const active = links.find(l => l.classList.contains('active')) || links[0];
                updateMarkerTo(active);
            });
            // Initial marker state now handled in header.js
        }
    }
    
    renderProjects() {
        const projectList = document.getElementById('projectList');
        if (!projectList) return;
        projectList.innerHTML = '';
        
        projectsData.forEach(project => {
            const li = document.createElement('li');
            li.className = 'project-item';
            
            li.innerHTML = `
                <div class="project-header" data-project-id="${project.id}">
                    <div class="project-info-group">
                        <h3 class="project-title">${project.title}</h3>
                        <span class="project-subtitle">${project.subtitle}</span>
                    </div>
                    <span class="project-year">${project.year}</span>
                </div>

                <div class="project-details" data-project-details-id="${project.id}">
                    <div class="project-content">
                        <div class="project-description">
                            <p>${project.description}</p>
                            <a class="see-project-link" href="${project.detailPage || '#'}">
                                See project →
                            </a>
                        </div>
                        <div class="project-image">
                            <a href="${project.detailPage || '#'}" class="project-thumb">
                                <picture>
                                    <source type="image/webp" srcset="${project.image.replace(/\.(png|jpe?g)$/i, '.webp')}" />
                                    <img class="simple-img" src="${project.image}" alt="${project.title}" loading="lazy" />
                                </picture>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            
            projectList.appendChild(li);
            
            // Add event listener for project header
            const header = li.querySelector('.project-header');
            header.addEventListener('click', () => this.toggleProject(project.id));
        });
    }

    renderArchiveGrid() {
        const archiveGrid = document.querySelector('#archiveSection .projects-grid');
        if (!archiveGrid) return;

        archiveGrid.innerHTML = '';

        projectsData.forEach(project => {
            const card = document.createElement('a');
            card.className = 'project-card';
            card.href = project.detailPage || '#';
            card.setAttribute('aria-label', `${project.title} — ${project.subtitle}`);
            const cardImage = project.cardImage || project.thumbnailImage || project.image;
            const webpSource = cardImage ? cardImage.replace(/\.(png|jpe?g)$/i, '.webp') : '';

            card.innerHTML = `
                <div class="project-media">
                    <picture>
                        ${cardImage ? `<source type="image/webp" srcset="${webpSource}">` : ''}
                        ${cardImage ? `<img src="${cardImage}" alt="${project.title}" loading="lazy">` : ''}
                    </picture>
                </div>
                <div class="project-caption">
                    <span class="project-title">${project.title}</span>
                    <span class="project-meta">${project.subtitle}</span>
                </div>
            `;

            archiveGrid.appendChild(card);
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
        
        // Build project detail HTML (exclude PDFs from gallery; PDFs are exposed via Documents buttons)
        let galleryHTML = '';
        if (project.gallery && project.gallery.length > 0) {
            const imageItems = project.gallery.filter(img => !/\.pdf$/i.test(img));
            if (imageItems.length > 0) {
                galleryHTML = `
                    <div class="project-gallery">
                        <h3>Gallery</h3>
                        <div class="gallery-grid">
                                        ${imageItems.map((img, i) => {
                                            const thumb = img.replace(/\.(png|jpe?g|webp)$/i, '-thumb.jpg');
                                            const thumbWebp = img.replace(/\.(png|jpe?g|webp)$/i, '-thumb.webp');
                                            return `
                                                <div class="gallery-item">
                                                    <picture>
                                                        <source type="image/webp" srcset="${thumbWebp}" />
                                                        <img class="simple-img" src="${thumb}" data-full="${img}" data-index="${i}" alt="${project.title}" loading="lazy" />
                                                    </picture>
                                                </div>
                                            `;
                                        }).join('')}
                        </div>
                    </div>
                `;
            }
        }

            // Documents links for the side info section
            let docsHTML = '';
            if (project.map || project.thesis) {
                docsHTML = `
                    <div class="project-info-item">
                        <h4>Documents</h4>
                        <div class="project-docs">
                            ${project.map ? `<a class="project-link btn" href="${project.map}" target="_blank" rel="noopener noreferrer">Map (PDF)</a>` : ''}
                            ${project.thesis ? `<a class="project-link btn" href="${project.thesis}" target="_blank" rel="noopener noreferrer">Thesis (PDF)</a>` : ''}
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
        
        // Check if project has 3D model
        let banner3DHTML = '';
        if (project.model3D) {
            banner3DHTML = `
                <div class="three-banner" id="threeBanner-${project.id}"></div>
            `;
        }
        
        projectPage.innerHTML = `
            <div class="project-page-content container">
                <button class="back-button" id="backButton">← Back to Projects</button>
                
                <header class="project-page-header">
                    <h1 class="project-page-title">${project.title}</h1>
                    <p class="project-page-subtitle">${project.subtitle}</p>
                </header>
                
                <div class="project-page-body">
                    ${banner3DHTML}
                    
                    <div class="project-hero-image">
                        <picture>
                            <source type="image/webp" srcset="${(project.heroImage || project.image).replace(/\.(png|jpe?g)$/i, '.webp')}" />
                            <img class="simple-img" src="${project.heroImage || project.image}" alt="${project.title}" loading="lazy" />
                        </picture>
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
                            ${docsHTML}
                        </div>
                    </div>
                    
                    ${galleryHTML}
                </div>
            </div>
        `;
        
        // Show project page, hide projects list
        projectsContainer.style.display = 'none';
        projectPage.style.display = 'block';
        
        // Hide main page video intro
        const introVideoContainer = document.querySelector('.project-video-intro');
        if (introVideoContainer) introVideoContainer.style.display = 'none';
        
        // Remove video class to restore padding
        const portMain = document.getElementById('portfolioMain');
        if (portMain) portMain.classList.remove('with-video');

        if (this.updateMenuMarker) this.updateMenuMarker('projects');
        
        // Initialize 3D banner if model exists
        if (project.model3D && typeof window.init3DBanner === 'function') {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                const options = { ...(project.model3DOptions || {}) };
                // Override background color based on theme
                const isLight = document.body.getAttribute('data-theme') === 'light';
                options.backgroundColor = isLight ? 0xffffff : 0x000000;
                
                this.currentBanner = window.init3DBanner(
                    `threeBanner-${project.id}`,
                    project.model3D,
                    options
                );
            }, 100);
        }
        
        // Setup back button
        document.getElementById('backButton').addEventListener('click', () => {
            // Cleanup 3D banner before hiding
            if (this.currentBanner && typeof this.currentBanner.destroy === 'function') {
                this.currentBanner.destroy();
                this.currentBanner = null;
            }
            this.showProjects();
        });
        
        // Scroll to top
        window.scrollTo(0, 0);

        // Setup gallery lightbox interactions
        const lightboxEl = document.getElementById('lightbox');
        const lightboxImage = lightboxEl && lightboxEl.querySelector('.lightbox-image');
        const lightboxClose = lightboxEl && lightboxEl.querySelector('.lightbox-close');
        const lightboxPrev = lightboxEl && lightboxEl.querySelector('.lightbox-prev');
        const lightboxNext = lightboxEl && lightboxEl.querySelector('.lightbox-next');

        const galleryImgs = projectPage.querySelectorAll('.project-gallery .gallery-item img');
        const images = Array.from(galleryImgs).map(img => img.dataset.full || img.src.replace('-thumb',''));

        let currentIndex = 0;

        function showLightbox(idx) {
            if (!lightboxEl || !lightboxImage) return;
            currentIndex = idx;
            lightboxImage.src = images[currentIndex];
            lightboxEl.style.display = 'flex';
        }

        function closeLightbox() {
            if (!lightboxEl) return;
            lightboxEl.style.display = 'none';
            lightboxImage.src = '';
        }

        function nextImage() { showLightbox((currentIndex + 1) % images.length); }
        function prevImage() { showLightbox((currentIndex - 1 + images.length) % images.length); }

        // Attach click handlers
        galleryImgs.forEach((img, i) => {
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                showLightbox(i);
            });
        });

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });
        if (lightboxNext) lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });

        // click outside image to close
        const overlay = lightboxEl && lightboxEl.querySelector('.lightbox-overlay');
        if (overlay) overlay.addEventListener('click', closeLightbox);

        // keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightboxEl || lightboxEl.style.display !== 'flex') return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        });
    }
    
    showProjects() {
        const projectPage = document.getElementById('projectPage');
        const projectsContainer = document.getElementById('projectsContainer');

        if (!projectPage || !projectsContainer) {
            window.location.href = 'index.html';
            return;
        }
        
        projectPage.style.display = 'none';
        projectsContainer.style.display = 'block';
        
        // Show and play main page video intro
        const introVideoContainer = document.querySelector('.project-video-intro');
        if (introVideoContainer) {
            introVideoContainer.style.display = 'block';
            
            // Add video class to remove padding
            const portMain = document.getElementById('portfolioMain');
            if (portMain) portMain.classList.add('with-video');

            const introVideo = introVideoContainer.querySelector('video');
            if (introVideo) introVideo.play().catch(() => {});
        }

        if (this.updateMenuMarker) this.updateMenuMarker('projects');
        
        this.selectedProject = null;
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    showAnimationPopup() {
        const overlay = document.getElementById('animationOverlay');
        overlay.style.display = 'block';
        
        // Only initialize metaball animation on desktop (larger screens)
        if (window.innerWidth > 768) {
            this.metaballAnimation = new MetaballAnimation('metaballCanvas', 'cursorCanvas');
        }
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioApp;
}
