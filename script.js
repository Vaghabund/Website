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
});
