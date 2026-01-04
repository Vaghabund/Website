(function(){
    const headerMarkup = `
<header class="section section--header">
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
                <a href="index.html" class="menu-link" data-target="projects">Projects</a>
                <a href="about.html" class="menu-link" data-target="about">About</a>
                <a href="archive.html" class="menu-link" data-target="archive">Archive</a>
            </div>
        </nav>
        <div class="header-separator"></div>
    </div>
</header>`;

    window.renderSharedHeader = function(container) {
        if (!container) return;
        container.innerHTML = headerMarkup;
        container.classList.add('header-loaded');
    };

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('sharedHeader');
        if (container && !container.classList.contains('header-loaded')) {
            renderSharedHeader(container);
        }
    });
})();
