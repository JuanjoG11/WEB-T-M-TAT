// script.js
document.addEventListener('DOMContentLoaded', () => {
  const links = Array.from(document.querySelectorAll('.navbar a'));
  const sections = links
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  // Si el navegador admite scroll-behavior en CSS, ya tendremos smooth scroll.
  // Para los que no, activamos scrollIntoView con smooth.
  links.forEach(link => {
    link.addEventListener('click', e => {
      // Evita el salto brusco en navegadores antiguos
      if (!'scrollBehavior' in document.documentElement.style) {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  function highlightCurrent() {
    const triggerLine = window.innerHeight * 0.25; // 25 % del alto de ventana

    sections.forEach((sec, idx) => {
      const rect = sec.getBoundingClientRect();
      const inView = rect.top <= triggerLine && rect.bottom >= triggerLine;
      links[idx].classList.toggle('active', inView);
    });
  }

  // Resalta al cargar y al hacer scroll
  highlightCurrent();
  window.addEventListener('scroll', highlightCurrent, { passive: true });
});