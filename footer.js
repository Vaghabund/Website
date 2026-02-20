(function(){
    const footerMarkup = `
<footer class="section section--footer">
    <div class="footer-rule"></div>
    <div class="container">
        <div class="footer-content">
            <nav class="footer-links" aria-label="Footer navigation">
                <a href="https://github.com/Vaghabund" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub</a>
                <a href="https://www.instagram.com/vaghabund/" target="_blank" rel="noopener noreferrer" class="footer-link">Instagram</a>
            </nav>
            <div id="themeToggle" class="theme-toggle-capsule pill" aria-label="Theme toggle">
                <div id="themeMarker" class="theme-inner" aria-hidden="true"></div>
                <div class="theme-btn" data-theme="dark" title="Dark"></div>
                <div class="theme-btn" data-theme="light" title="Light"></div>
            </div>
            <nav class="footer-links" aria-label="Footer navigation">
                <a href="mailto:joel@tenenberg.net" class="footer-link">Contact</a>
                <a href="impressum.html" class="footer-link">Impressum</a>
            </nav>
        </div>
    </div>
</footer>`;

    window.renderSharedFooter = function(container) {
        if (!container) return;
        container.innerHTML = footerMarkup;
        container.classList.add('footer-loaded');
        setTimeout(() => initThemeToggle(), 0);
    };

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('sharedFooter');
        if (container && !container.classList.contains('footer-loaded')) {
            renderSharedFooter(container);
        } else if (!document.querySelector('.section--footer')) {
            const temp = document.createElement('div');
            temp.innerHTML = footerMarkup;
            document.body.appendChild(temp.firstElementChild);
            initThemeToggle();
        }
    });

    function initThemeToggle() {
        const themeBtns = document.querySelectorAll('.theme-btn');
        const themeMarker = document.getElementById('themeMarker');
        const body = document.body;

        const updateThemeMarker = (activeBtn) => {
            if (!activeBtn || !themeMarker) return;
            const btnRect = activeBtn.getBoundingClientRect();
            const parentRect = themeMarker.parentElement.getBoundingClientRect();
            const left = btnRect.left - parentRect.left;
            themeMarker.style.transform = `translateX(${left}px)`;
            themeMarker.style.width = `${btnRect.width}px`;
        };

        const setTheme = (theme, animate = true) => {
            const normalized = theme === 'dark' ? 'dark' : 'light';
            body.setAttribute('data-theme', normalized);
            localStorage.setItem('portfolio-theme', normalized);

            themeBtns.forEach(btn => {
                const isActive = btn.dataset.theme === normalized;
                btn.classList.toggle('active', isActive);
                if (isActive) updateThemeMarker(btn);
            });

            if (!animate) {
                body.style.transition = 'none';
                setTimeout(() => body.style.transition = '', 100);
            }

            window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: normalized } }));
        };

        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => setTheme(btn.dataset.theme));
        });

        // Initial theme: always dark, unless saved preference exists
        const saved = localStorage.getItem('portfolio-theme');
        const initial = saved ? saved : 'dark';
        setTheme(initial, false);

        window.addEventListener('resize', () => {
            const active = Array.from(themeBtns).find(b => b.classList.contains('active'));
            if (active) updateThemeMarker(active);
        });
    }
})();
