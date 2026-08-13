if (!window.purelaneReveal) {
  window.purelaneReveal = true;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(root) {
    const scope = root || document;
    const els = scope.querySelectorAll('.rv:not(.in)');
    if (reducedMotion) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  }

  document.addEventListener('DOMContentLoaded', () => init());

  document.addEventListener('shopify:section:load', (event) => {
    init(event.target);
  });

  document.addEventListener('shopify:section:reorder', (event) => {
    init(event.target);
  });
}