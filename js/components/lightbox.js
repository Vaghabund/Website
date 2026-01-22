// ============================================
// Lightbox Component
// ============================================
class Lightbox {
    constructor() {
        this.lightboxEl = document.getElementById('lightbox');
        this.lightboxImage = this.lightboxEl && this.lightboxEl.querySelector('.lightbox-image');
        this.lightboxClose = this.lightboxEl && this.lightboxEl.querySelector('.lightbox-close');
        this.lightboxPrev = this.lightboxEl && this.lightboxEl.querySelector('.lightbox-prev');
        this.lightboxNext = this.lightboxEl && this.lightboxEl.querySelector('.lightbox-next');
        this.overlay = this.lightboxEl && this.lightboxEl.querySelector('.lightbox-overlay');
        
        this.images = [];
        this.currentIndex = 0;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        if (this.lightboxClose) {
            this.lightboxClose.addEventListener('click', () => this.close());
        }
        
        if (this.lightboxPrev) {
            this.lightboxPrev.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prev();
            });
        }
        
        if (this.lightboxNext) {
            this.lightboxNext.addEventListener('click', (e) => {
                e.stopPropagation();
                this.next();
            });
        }
        
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.lightboxEl || this.lightboxEl.style.display !== 'flex') return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.prev();
        });
    }
    
    init(gallerySelector) {
        const galleryImgs = document.querySelectorAll(gallerySelector);
        this.images = Array.from(galleryImgs).map(img => img.dataset.full || img.src.replace('-thumb',''));
        
        galleryImgs.forEach((img, i) => {
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                this.show(i);
            });
        });
    }
    
    show(index) {
        if (!this.lightboxEl || !this.lightboxImage) return;
        this.currentIndex = index;
        this.lightboxImage.src = this.images[this.currentIndex];
        this.lightboxEl.style.display = 'flex';
    }
    
    close() {
        if (!this.lightboxEl) return;
        this.lightboxEl.style.display = 'none';
        if (this.lightboxImage) {
            this.lightboxImage.src = '';
        }
    }
    
    next() {
        this.show((this.currentIndex + 1) % this.images.length);
    }
    
    prev() {
        this.show((this.currentIndex - 1 + this.images.length) % this.images.length);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Lightbox;
}
