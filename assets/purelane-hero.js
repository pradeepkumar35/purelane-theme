(() => {
  const initHero = (root) => {
    if (!root || root.dataset.initialized === 'true') return;

    const slides = [...root.querySelectorAll('.purelane-hero__slide')];
    const dots = [...root.querySelectorAll('.purelane-hero__dot')];

    if (!slides.length || !dots.length) return;

    root.dataset.initialized = 'true';

    let current = 0;
    let timer;

    const showSlide = (index) => {
      current = index;

      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
      });

      dots.forEach((dot, i) => {
        const active = i === index;

        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    };

    const start = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      clearInterval(timer);

      timer = setInterval(() => {
        showSlide((current + 1) % slides.length);
      }, 5000);
    };

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showSlide(index);
        start();
      });
    });

    showSlide(0);
    start();

    document.addEventListener('shopify:section:unload', (event) => {
      if (event.detail?.sectionId === root.dataset.sectionId) {
        clearInterval(timer);
      }
    });
  };

  const initAll = () => {
    document
      .querySelectorAll('[data-purelane-hero]')
      .forEach(initHero);
  };

  document.addEventListener('DOMContentLoaded', initAll);

  document.addEventListener('shopify:section:load', (event) => {
    const section = document.getElementById(
      `PurelaneHero-${event.detail.sectionId}`
    );

    if (section) {
      initHero(section);
    }
  });
})();