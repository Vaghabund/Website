// ─────────────────────────────────────────────
// Footer and Impressum lightbox.
// Self-contained — appended to <body> at runtime.
// ─────────────────────────────────────────────

const IMPRESSUM_TEXT = `Angaben gemäß § 5 TMG

Joel Tenenberg

Kontakt
E-Mail: joel@tenenberg.net

Haftungsausschluss
Die Inhalte dieser Seite wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird keine Gewähr übernommen.`;

export function buildFooter() {
  const footer = document.createElement('footer');
  footer.id = 'site-footer';
  footer.innerHTML = `
    <span class="footer-socials">
      <a href="https://www.instagram.com/vaghabund/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">Instagram</a>
    </span>
    <span class="footer-copy">© Joel Tenenberg ${new Date().getFullYear()}</span>
    <button class="footer-impressum">Impressum</button>
  `;
  document.body.appendChild(footer);

  const lb = document.createElement('div');
  lb.id = 'impressum-lightbox';
  lb.innerHTML = `
    <div id="imp-inner">
      <div id="imp-title">Impressum</div>
      <div id="imp-body"></div>
    </div>
    <button id="imp-close">&#x2715;</button>
  `;
  document.body.appendChild(lb);
  document.getElementById('imp-body').textContent = IMPRESSUM_TEXT;

  footer.querySelector('.footer-impressum').onclick = () => lb.classList.add('open');
  document.getElementById('imp-close').onclick       = () => lb.classList.remove('open');
  lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('open'); });
}
