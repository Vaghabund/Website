(function(){
    const headerMarkup = `
<header class="section section--header">
    <img src="media/logo/Name_bold.svg" alt="" class="header-background-logo" aria-hidden="true">
    <div class="container row row--header">
        <div class="col col--shrink">
            <div class="name-capsule pill">
                <div class="name-inner" aria-hidden="true"></div>
                <h1 class="header-name" id="headerName">
                    <img src="media/logo/Name.svg" alt="Joel Tenenberg" class="name-image">
                </h1>
            </div>
        </div>
        <div class="col col--shrink">
            <div class="logo-capsule pill" id="logoContainer">
                <img src="media/logo/LOGO.svg" alt="Logo" class="logo-image">
            </div>
        </div>
        <div class="col"></div>
        <nav id="siteMenu" class="col col--shrink col--menu" aria-label="Site navigation">
            <div id="mainMenu" class="menu-capsule pill">
                <div id="menuMarker" class="menu-inner" aria-hidden="true"></div>
                <a href="index.html" class="menu-link" data-target="projects" data-page="index">Projects</a>
                <a href="about.html" class="menu-link" data-target="about" data-page="about">About</a>
                <a href="archive.html" class="menu-link" data-target="archive" data-page="archive">Archive</a>
            </div>
        </nav>
        <div class="header-separator"></div>
    </div>
</header>`;

    window.renderSharedHeader = function(container) {
        if (!container) return;
        container.innerHTML = headerMarkup;
        container.classList.add('header-loaded');
        
        // Initialize SPA navigation after header is rendered
        setTimeout(() => initSPANavigation(), 0);
    };

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('sharedHeader');
        if (container && !container.classList.contains('header-loaded')) {
            renderSharedHeader(container);
        }
        
        // Scale header background logo to fit window width
        const scaleHeaderLogo = () => {
            const logo = document.querySelector('.header-background-logo');
            const header = document.querySelector('.section--header');
            if (logo && header) {
                const headerWidth = header.offsetWidth;
                const logoDisplayWidth = logo.offsetWidth; // Width after height: 100% is applied
                if (logoDisplayWidth > 0) {
                    const scale = headerWidth / logoDisplayWidth;
                    logo.style.transform = `translate(-50%, -50%) scaleX(${scale})`;
                }
            }
        };
        
        // Scale on load and resize
        const logo = document.querySelector('.header-background-logo');
        if (logo) {
            logo.addEventListener('load', scaleHeaderLogo);
            window.addEventListener('resize', scaleHeaderLogo);
            scaleHeaderLogo();
        }
        
        // Set active link based on current page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    });
    
    function initSPANavigation() {
        const menuLinks = document.querySelectorAll('.menu-link');
        const marker = document.getElementById('menuMarker');
        const siteMenu = document.getElementById('siteMenu');
        
        // Function to update marker position
        const updateMarkerTo = (linkEl) => {
            if (!linkEl || !marker || !siteMenu) return;
            const linkRect = linkEl.getBoundingClientRect();
            const menuRect = siteMenu.getBoundingClientRect();
            const left = Math.round(linkRect.left - menuRect.left);
            marker.style.transform = `translateX(${left}px)`;
            marker.style.width = `${Math.round(linkRect.width)}px`;
        };
        
        // Function to update active state and marker
        const updateActiveLink = (target) => {
            const activeLink = Array.from(menuLinks).find(l => l.dataset.target === target);
            if (activeLink) {
                menuLinks.forEach(l => l.classList.remove('active'));
                activeLink.classList.add('active');
                updateMarkerTo(activeLink);
                
                // Toggle name capsule active state when 'about' is selected
                const nameCapsule = document.querySelector('.name-capsule');
                if (nameCapsule) {
                    nameCapsule.classList.toggle('active', target === 'about');
                }
            }
        };
        
        menuLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const target = link.dataset.target;
                const href = link.getAttribute('href');
                
                // Don't navigate if already on this page
                if (link.classList.contains('active')) return;
                
                // Update active state and animate marker BEFORE transition
                updateActiveLink(target);
                
                // Slide out current content
                const main = document.querySelector('main');
                if (main) {
                    main.classList.add('page-exit');
                    
                    // Wait for exit animation
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Fetch new page content
                    try {
                        const response = await fetch(href);
                        const html = await response.text();
                        
                        // Parse the HTML
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const newMain = doc.querySelector('main');
                        
                        if (newMain) {
                            // Replace content
                            main.innerHTML = newMain.innerHTML;
                            main.className = newMain.className;
                            
                            // Trigger entrance animation
                            requestAnimationFrame(() => {
                                main.classList.add('page-enter');
                                requestAnimationFrame(() => {
                                    main.classList.remove('page-enter');
                                });
                            });
                            
                            // Update URL
                            history.pushState({ page: target }, '', href);
                            
                            // Re-initialize the portfolio app for the new page
                            if (window.PortfolioApp) {
                                window.portfolioApp = new window.PortfolioApp();
                            }
                        }
                    } catch (error) {
                        console.error('Navigation error:', error);
                        window.location.href = href; // Fallback to traditional navigation
                    }
                    
                    main.classList.remove('page-exit');
                }
            });
        });
        
        // Keep marker positioned on resize
        window.addEventListener('resize', () => {
            const active = Array.from(menuLinks).find(l => l.classList.contains('active'));
            if (active) updateMarkerTo(active);
        });
        
        // Initial marker position based on current page
        setTimeout(() => {
            const currentPage = window.location.pathname.toLowerCase();
            let target = 'projects';
            if (currentPage.includes('about.html')) {
                target = 'about';
            } else if (currentPage.includes('archive.html')) {
                target = 'archive';
            }
            updateActiveLink(target);
        }, 50);
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                window.location.reload(); // Simple fallback for back button
            }
        });
    }
})();
