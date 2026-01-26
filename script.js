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
    
    // iOS video autoplay fix
    const initVideoAutoplay = () => {
        const video = document.getElementById('greyhoundVideo');
        if (video) {
            // Ensure video is muted and has playsinline for iOS
            video.muted = true;
            video.playsInline = true;
            
            // Attempt to play the video
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Autoplay was prevented, try to play on user interaction
                    const playOnInteraction = () => {
                        video.play().catch(() => {});
                    };
                    
                    // Add multiple interaction listeners for iOS
                    // Using { once: true } automatically removes listeners after first trigger
                    document.addEventListener('touchstart', playOnInteraction, { once: true, passive: true });
                    document.addEventListener('click', playOnInteraction, { once: true });
                    document.addEventListener('scroll', playOnInteraction, { once: true, passive: true });
                });
            }
        }
    };
    
    // Initialize video autoplay
    initVideoAutoplay();
    // Also try after full page load
    window.addEventListener('load', initVideoAutoplay);
});
