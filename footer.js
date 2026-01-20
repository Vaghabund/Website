(function(){
    const footerMarkup = `
<footer class="section section--footer">
    <div class="container">
        <div id="themeToggle" class="theme-toggle-capsule pill" aria-label="Theme toggle">
            <div id="themeMarker" class="theme-inner" aria-hidden="true"></div>
            <div class="theme-btn" data-theme="dark" title="Dark"></div>
            <div class="theme-btn" data-theme="light" title="Light"></div>
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

        // Initial theme: saved or system preference (dark/light only)
        const saved = localStorage.getItem('portfolio-theme');
        const initial = saved ? saved : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(initial, false);

        window.addEventListener('resize', () => {
            const active = Array.from(themeBtns).find(b => b.classList.contains('active'));
            if (active) updateThemeMarker(active);
        });
    }
})();
