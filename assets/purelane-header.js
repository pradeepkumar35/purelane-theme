if (!window.purelaneHeader) {
  window.purelaneHeader = true;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    const header = document.querySelector('[data-purelane-header]');
    const burger = document.querySelector('[data-purelane-burger]');
    const menu = document.querySelector('[data-purelane-navmenu]');
    const backdrop = document.querySelector('[data-purelane-backdrop]');
    const closeBtn = document.querySelector('[data-purelane-close]');

    /* ---------- header slide up ---------- */
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || window.pageYOffset;
        if (header) header.classList.toggle('is-up', y > 90);
        syncRail(y);
        ticking = false;
      });
    }

    /* ---------- rail progress sync ---------- */
    const railLinks = Array.from(document.querySelectorAll('[data-purelane-rail]'));
    const targets = railLinks.map((a) => {
      const href = a.getAttribute('href') || '#MainContent';
      const el =
        href === '#MainContent' || href === '#top'
          ? document.getElementById('MainContent')
          : document.querySelector(href);
      return { link: a, el };
    });

    function syncRail(y) {
      if (!railLinks.length) return;
      const mid = y + window.innerHeight * 0.42;
      let idx = 0;
      targets.forEach((t, i) => {
        if (t.el && t.el.getBoundingClientRect().top + y <= mid) idx = i;
      });
      targets.forEach((t, i) => t.link.classList.toggle('is-on', i === idx));
    }

    /* ---------- mobile menu ---------- */
    function setMenu(open) {
      if (!menu) return;
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (backdrop) backdrop.classList.toggle('is-open', open);
      if (burger) {
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) burger.setAttribute('aria-label', 'Close menu');
        else burger.setAttribute('aria-label', 'Menu');
      }
    }
    if (burger) {
      burger.addEventListener('click', () => {
        setMenu(!menu.classList.contains('is-open'));
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', () => setMenu(false));
    if (backdrop) backdrop.addEventListener('click', () => setMenu(false));
    menu
      .querySelectorAll('a')
      .forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });

    /* ---------- smooth scroll for anchor nav links ---------- */
    document.querySelectorAll('.purelane-navlinks a, .purelane-rail a').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        a.addEventListener('click', (e) => {
          const target = href === '#MainContent' || href === '#top' ? null : document.querySelector(href);
          if (!target) return; // let the browser do a native jump to top via #MainContent
          if (reduce) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', href);
        });
      }
    });

    /* ---------- cart drawer integration ---------- */
    const cartLink = document.querySelector('[data-purelane-cart]');
    if (cartLink) {
      cartLink.addEventListener('click', (e) => {
        const drawer = document.querySelector('cart-drawer');
        if (drawer) {
          e.preventDefault();
          drawer.open(cartLink);
        }
      });
    }

    const cartDot = document.querySelector('.purelane-ico__dot');
    if (cartDot && typeof subscribe === 'function') {
      subscribe('cart-update', (event) => {
        const count = event?.cartData?.item_count;
        if (typeof count !== 'number') return;
        cartDot.textContent = count;
        if (cartLink) cartLink.setAttribute('aria-label', `Cart, ${count} items`);
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}