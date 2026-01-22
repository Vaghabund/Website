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
    // Initialize portfolio app
    window.portfolioApp = new PortfolioApp();
});
