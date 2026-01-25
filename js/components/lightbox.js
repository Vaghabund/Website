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
        
        // Overlay click no longer closes; use close button or Escape
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.lightboxEl || this.lightboxEl.style.display !== 'flex') return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.prev();
        });

        // Click-based navigation on the image: left half = prev, right half = next
        if (this.lightboxImage) {
            this.lightboxImage.addEventListener('click', (e) => {
                if (!this.images || this.images.length === 0) return;
                e.stopPropagation(); // prevent content click from firing twice
                const rect = this.lightboxImage.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const mid = rect.width / 2;
                if (x < mid) {
                    this.prev();
                } else {
                    this.next();
                }
            });
        }

        // Extend clickable area to full content width
        const content = this.lightboxEl && this.lightboxEl.querySelector('.lightbox-content');
        if (content) {
            content.addEventListener('click', (e) => {
                // ignore clicks on close button
                if (e.target.closest('.lightbox-close')) return;
                if (!this.images || this.images.length === 0) return;
                const rect = content.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const mid = rect.width / 2;
                if (x < mid) {
                    this.prev();
                } else {
                    this.next();
                }
            });

            // Cursor feedback across full width
            content.addEventListener('mousemove', (e) => {
                const rect = content.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const mid = rect.width / 2;
                content.style.cursor = x < mid ? 'w-resize' : 'e-resize';
            });
            content.addEventListener('mouseleave', () => {
                content.style.cursor = 'default';
            });
        }
    }
    
    init(gallerySelector) {
        const galleryImgs = document.querySelectorAll(gallerySelector);
        this.images = Array.from(galleryImgs).map(img => img.dataset.full || img.src.replace('-thumb',''));
        
        // Clear previous listeners by cloning if needed to avoid duplicates on re-init
        galleryImgs.forEach((img) => {
            const clone = img.cloneNode(true);
            if (img.parentNode) {
                img.parentNode.replaceChild(clone, img);
            }
        });

        const finalImgs = document.querySelectorAll(gallerySelector);
        this.images = Array.from(finalImgs).map(img => img.dataset.full || img.src.replace('-thumb',''));

        finalImgs.forEach((img, i) => {
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

// Ensure global exposure for browser usage
if (typeof window !== 'undefined') {
    window.Lightbox = Lightbox;
}
