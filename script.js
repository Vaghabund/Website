// ============================================
// Main Script - Portfolio Website Orchestrator
// ============================================
// This file imports and initializes all modules

// Import project data
// Note: Since we're using browser without module system,
// we'll load scripts in order via HTML script tags

// ============================================
// Initialize on page load
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    // Expose PortfolioApp class globally for SPA re-initialization
    window.PortfolioApp = PortfolioApp;
    
    // Initialize portfolio app instance
    window.portfolioApp = new PortfolioApp();

    // Initialize lightbox for any page-level galleries
    const initLB = () => {
        if (window.Lightbox) {
            window.siteLightbox = window.siteLightbox || new window.Lightbox();
            window.siteLightbox.init('.project-gallery .gallery-item img');
        }
    };
    // Initialize after DOM is ready
    initLB();
    // Also initialize after full load in case gallery renders later
    window.addEventListener('load', initLB);
});
