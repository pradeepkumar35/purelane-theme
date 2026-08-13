if (!window.purelaneProof) {
  window.purelaneProof = true;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init(root) {
    const scope = root || document;
    const rot = scope.querySelector('[data-purelane-rot]');
    if (!rot) return;

    const slides = Array.from(rot.querySelectorAll('[data-purelane-slide]'));
    if (slides.length < 2) return;

    const dots = Array.from(rot.querySelectorAll('.purelane-rot__dot'));
    const capB = rot.querySelector('.purelane-rot__cap b');
    const capS = rot.querySelector('.purelane-rot__cap span');
    let i = 0;
    let timer = null;

    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-on', k === i));
      dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
      if (capB && slides[i]) capB.textContent = slides[i].getAttribute('data-name');
      if (capS && slides[i]) capS.textContent = slides[i].getAttribute('data-note');
    }

    function play() {
      if (timer || reduce) return;
      timer = setInterval(() => show(i + 1), 2900);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    if (!reduce) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) play();
            else stop();
          });
        },
        { threshold: 0.25 }
      );
      io.observe(rot);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('shopify:section:reorder', (event) => init(event.target));
}