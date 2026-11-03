/* Cute Store: bundles + mobile sticky add-to-cart */
(() => {
  if (window.csProductLoaded) return;
  window.csProductLoaded = true;
  const fmt = (cents) => {
    const f = window.cs_money_format || '{{amount}}';
    const n = (cents / 100);
    const grp = (s, sep) => s.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    const [i, d] = n.toFixed(2).split('.');
    const v = f.includes('no_decimals') ? grp(String(Math.round(n)), ',')
      : f.includes('comma') ? `${grp(i, '.')},${d}` : `${grp(i, ',')}.${d}`;
    return f.replace(/{{\s*\w+\s*}}/, v);
  };
  const live = typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined';

  document.querySelectorAll('[data-cs-bundles]').forEach((box) => {
    const qty = box.querySelector('[data-cs-qty]');
    let price = Number(box.dataset.price);
    const render = () => {
      box.querySelectorAll('.cs-bundle').forEach((l) => {
        const r = l.querySelector('input');
        const total = price * Number(r.value) * (1 - Number(r.dataset.discount) / 100);
        l.querySelector('[data-cs-bundle-price]').textContent = fmt(Math.round(total));
      });
    };
    box.addEventListener('change', (e) => { if (e.target.type === 'radio') qty.value = e.target.value; });
    const wanted = new URLSearchParams(location.search).get('bundle');
    const pre = wanted && box.querySelector(`input[value="${CSS.escape(wanted)}"]`);
    if (pre) { pre.checked = true; qty.value = pre.value; }
    if (live) {
      subscribe(PUB_SUB_EVENTS.variantChange, (d) => {
        if (d && d.data && d.data.variant) { price = d.data.variant.price; render(); }
      });
    }
    render();
  });

  const bar = document.querySelector('[data-cs-sticky]');
  if (bar) {
    if (live) subscribe(PUB_SUB_EVENTS.variantChange, (d) => {
      const v = d && d.data && d.data.variant;
      if (v) bar.querySelector('[data-cs-sticky-price]').textContent = fmt(v.price);
    });
    const target = document.querySelector('product-form .product-form__submit');
    const btn = bar.querySelector('[data-cs-sticky-btn]');
    if (target && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        const show = !e.isIntersecting && e.boundingClientRect.top < 0;
        bar.classList.toggle('cs-show', show);
        bar.setAttribute('aria-hidden', String(!show));
        btn.tabIndex = show ? 0 : -1;
      }).observe(target);
      btn.addEventListener('click', () => target.click());
    }
  }
})();
