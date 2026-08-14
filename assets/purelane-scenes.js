(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scenes = [...document.querySelectorAll('#scenes .scene')];
  const stage = document.getElementById('scenes');
  const prod = document.querySelector('.purelane-hero__slides');

  if (!stage) return;

  let current = 0;
  let raf = null;
  let mx = 0;
  let my = 0;
  let zones = [];
  let stageVisible = true;

  const collectZones = () => {
    zones = [...document.querySelectorAll('[data-scene]')];
  };

  const setScene = (n) => {
    if (n === current) return;
    current = n;
    scenes.forEach((s, i) => {
      s.classList.toggle('on', i + 1 === n);
    });
    stage.setAttribute('data-d', String(n));
  };

  const pickScene = () => {
    const focus = window.scrollY + window.innerHeight * 0.5;
    let n = 1;

    for (let i = 0; i < zones.length; i += 1) {
      const top = zones[i].getBoundingClientRect().top + window.scrollY;
      if (top <= focus) {
        const v = parseInt(zones[i].getAttribute('data-scene'), 10);
        if (v) n = v;
      }
    }

    setScene(n);
  };

  const frame = () => {
    raf = null;
    const y = window.scrollY || window.pageYOffset;

    if (!reduce && stageVisible) {
      const wl = stage.querySelectorAll('.wl');
      const depths = [0.05, 0.09, 0.03, 0.02];

      wl.forEach((el, i) => {
        const d = depths[i] || 0.05;
        el.style.setProperty('--px', `${(mx * d * 130).toFixed(1)}px`);
        el.style.setProperty('--py', `${(-y * d + my * d * 90).toFixed(1)}px`);
      });

      if (prod) {
        const f = Math.min(y / 700, 1);
        prod.style.transform =
          `translate3d(${(mx * -16).toFixed(2)}px,` +
          `${(-f * 54 + my * -10).toFixed(2)}px,0) ` +
          `scale(${(1 - f * 0.06).toFixed(3)})`;
        prod.style.opacity = (1 - f * 0.55).toFixed(3);
      }
    }

    pickScene();
  };

  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  collectZones();
  onScroll();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  if (!reduce && window.matchMedia('(min-width: 1024px)').matches) {
    window.addEventListener(
      'mousemove',
      (e) => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
        onScroll();
      },
      { passive: true }
    );
  }

  if (!reduce && prod) {
    prod.style.filter = 'drop-shadow(0 38px 60px rgba(2,20,19,.64))';
  }

  const pauseTargets = () =>
    document.querySelectorAll(
      '.purelane-reviews__track, .purelane-ticker__track, .purelane-scenes .wl-a, .purelane-scenes .wl-b, .purelane-scenes .wl-c, .purelane-scenes .wl-s, .purelane-scenes .bub span'
    );

  const resumeAnims = (target) => {
    target.style.animationPlayState = '';
  };

  const pauseAnims = (target) => {
    target.style.animationPlayState = 'paused';
  };

  const animateIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          resumeAnims(entry.target);
        } else {
          pauseAnims(entry.target);
        }
      });
    },
    { rootMargin: '120px 0px 120px 0px' }
  );

  const observePauseTargets = () => {
    pauseTargets().forEach((el) => animateIO.observe(el));
  };

  const stageIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        stageVisible = entry.isIntersecting;
      });
    },
    { rootMargin: '200px 0px 200px 0px' }
  );
  stageIO.observe(stage);

  observePauseTargets();
  document.addEventListener('shopify:section:load', observePauseTargets);
  document.addEventListener('shopify:section:unload', observePauseTargets);
})();