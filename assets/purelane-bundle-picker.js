(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pickers = {}; // sectionId -> instance

  function parseTiers(json) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return {};
    }
  }

  class BundlePicker {
    constructor(root) {
      this.root = root;
      this.sectionId = root.dataset.sectionId;
      this.tiers = parseTiers(root.dataset.tiers || '{}');
      this.count = 0;
      this.variantId = null;
      this.selected = new Set(); // product ids
      this.grid = root.querySelector('[data-picker-grid]');
      this.title = root.querySelector('[data-picker-title]');
      this.hint = root.querySelector('[data-picker-hint]');
      this.countEl = root.querySelector('[data-picker-count]');
      this.submit = root.querySelector('[data-picker-submit]');
      this.items = [...this.grid.querySelectorAll('[data-picker-item]')];
      this.items.forEach((item) => {
        item.addEventListener('click', () => this.toggle(item));
      });
      this.root.querySelector('[data-picker-close]').addEventListener('click', () => this.close());
      this.root.querySelector('[data-picker-backdrop]').addEventListener('click', () => this.close());
      this.submit.addEventListener('click', () => this.addToCart());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.root.hidden) this.close();
        if (e.key === 'Tab' && !this.root.hidden) this.trapFocus(e);
      });
    }

    trapFocus(e) {
      const focusables = [...this.root.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')]
        .filter((el) => !el.disabled && !el.hidden && getComputedStyle(el).display !== 'none');
      if (!focusables.length) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || !this.root.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !this.root.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }

    open({ count, variantId, preselect = [] } = {}) {
      this.count = count || 0;
      this.variantId = variantId || this.tiers[String(count)] || null;
      this.selected = new Set(preselect);
      this.items.forEach((item) => {
        if (this.selected.has(item.dataset.productId)) {
          item.classList.add('is-selected');
          item.setAttribute('aria-selected', 'true');
        } else {
          item.classList.remove('is-selected');
          item.setAttribute('aria-selected', 'false');
        }
      });
      this.render();
      this.root.hidden = false;
      this.lastFocused = document.activeElement;
      document.body.style.overflow = 'hidden';
      const first = this.grid.querySelector('[data-picker-item]');
      if (first) first.focus();
    }

    close() {
      this.root.hidden = true;
      document.body.style.overflow = '';
      if (this.lastFocused && this.lastFocused.focus) {
        this.lastFocused.focus();
      }
    }

    toggle(item) {
      const id = item.dataset.productId;
      if (this.selected.has(id)) {
        this.selected.delete(id);
      } else {
        if (this.selected.size >= this.count) return; // enforce max
        this.selected.add(id);
      }
      item.classList.toggle('is-selected', this.selected.has(id));
      item.setAttribute('aria-selected', String(this.selected.has(id)));
      this.render();
    }

    render() {
      const n = this.selected.size;
      const label = this.count ? `${n} of ${this.count} selected` : `${n} selected`;
      this.countEl.textContent = label;
      this.title.textContent = `Pick ${this.count} products`;
      this.hint.textContent = `Choose any ${this.count} products. They will be added as one ${this.count}-product bundle.`;
      this.submit.disabled = n !== this.count;
      if (n === this.count) {
        this.submit.textContent = `Add bundle to cart · ${this.submit.dataset.price || 'flat price'}`;
      } else {
        this.submit.textContent = `Add to cart`;
      }
    }

    addToCart() {
      if (this.selected.size !== this.count || !this.variantId) return;
      const formData = new FormData();
      formData.append('id', this.variantId);
      formData.append('quantity', 1);
      let i = 1;
      for (const id of this.selected) {
        const item = this.items.find((it) => it.dataset.productId === id);
        const name = item ? item.dataset.title : id;
        formData.append(`properties[Pick ${i}]`, name);
        i++;
      }
      const drawer = document.querySelector('cart-drawer');
      if (drawer) {
        formData.append(
          'sections',
          drawer.getSectionsToRender().map((section) => section.id)
        );
        formData.append('sections_url', window.location.pathname);
      }
      const button = this.submit;
      const original = button.textContent;
      button.disabled = true;
      button.textContent = 'Adding…';
      fetch('/cart/add.js', {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
        .then((res) => res.json())
        .then((response) => {
          if (response.status) throw new Error(response.description || response.message || 'add failed');
          this.close();
          if (typeof publish === 'function') {
            publish('cart-update', { source: 'purelane-bundle-picker', cartData: response });
          }
          if (drawer) {
            drawer.renderContents(response);
          } else {
            window.location.href = '/cart';
          }
        })
        .catch((err) => {
          button.textContent = 'Try again';
          button.disabled = false;
          console.error('Purelane bundle add error', err);
        })
        .finally(() => {
          button.textContent = original;
        });
    }
  }

  function init(root) {
    if (!root || root.__purelanePicker) return;
    root.__purelanePicker = new BundlePicker(root);
    pickers[root.dataset.sectionId || 'default'] = root.__purelanePicker;
  }

  function wireTierButtons(root) {
    root.querySelectorAll?.('[data-picker-open]').forEach((btn) => {
      if (btn.__purelaneWired) return;
      btn.__purelaneWired = true;
      btn.addEventListener('click', () => {
        const tier = btn.closest('[data-purelane-tier]');
        const bundles = btn.closest('[data-purelane-bundles]');
        if (!tier || !bundles) return;
        const picker = pickers[bundles.dataset.sectionId || 'default'];
        if (picker) picker.open({ count: Number(tier.dataset.count), variantId: tier.dataset.variantId || null });
      });
    });
  }

  function wireComboButtons(root) {
    root.querySelectorAll?.('[data-combo-open]').forEach((btn) => {
      if (btn.__purelaneComboWired) return;
      btn.__purelaneComboWired = true;
      btn.addEventListener('click', () => {
        let preselect = [];
        try {
          preselect = JSON.parse(btn.dataset.preselect || '[]').map(String);
        } catch (e) {
          preselect = [];
        }
        // Combos live in a different section; open the first picker on the page.
        const picker = Object.values(pickers)[0];
        if (picker) picker.open({ count: Number(btn.dataset.count), preselect });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-purelane-picker]').forEach(init);
    document.querySelectorAll('[data-purelane-bundles]').forEach(wireTierButtons);
    document.querySelectorAll('[data-purelane-combos]').forEach(wireComboButtons);
  });

  document.addEventListener('shopify:section:load', (event) => {
    event.target.querySelectorAll?.('[data-purelane-picker]').forEach(init);
    wireTierButtons(event.target);
    wireComboButtons(event.target);
  });

  // Combos (a different section) open the picker via a global event.
  document.addEventListener('purelane:open-picker', (event) => {
    const picker = pickers[event.detail?.sectionId] || Object.values(pickers)[0];
    if (picker) picker.open(event.detail);
  });
})();
