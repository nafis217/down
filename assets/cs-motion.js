/* Cute Store: scroll reveals. Elements with .cs-reveal / .cs-pop fade in once. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = document.querySelectorAll('.cs-reveal, .cs-pop');
  if (reduce || !('IntersectionObserver' in window) || getComputedStyle(root).getPropertyValue('--cs-motion').trim() === '0') {
    els.forEach((el) => el.classList.add('cs-in'));
    return;
  }
  root.classList.add('cs-js');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('cs-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  els.forEach((el) => io.observe(el));
})();

/* Reviews carousel: scroll-snap, buttons, keyboard, auto-advance pausing on touch/hover/focus */
document.querySelectorAll('[data-cs-carousel]').forEach((root) => {
  const track = root.querySelector('[data-cs-track]');
  const step = () => (track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 16 : 300);
  const go = (dir) => {
    const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    if (dir > 0 && end) track.scrollTo({ left: 0, behavior: 'smooth' });
    else track.scrollBy({ left: dir * step(), behavior: 'smooth' });
  };
  root.querySelector('[data-cs-prev]').addEventListener('click', () => go(-1));
  root.querySelector('[data-cs-next]').addEventListener('click', () => go(1));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (root.dataset.autoplay !== 'true' || reduce) return;
  let paused = false;
  ['pointerdown', 'touchstart', 'mouseenter', 'focusin'].forEach((ev) => root.addEventListener(ev, () => (paused = true), { passive: true }));
  ['mouseleave', 'focusout'].forEach((ev) => root.addEventListener(ev, () => (paused = false)));
  setInterval(() => { if (!paused && !document.hidden) go(1); }, 5000);
});

/* Demo video: play only while visible, tap button to unmute */
document.querySelectorAll('[data-cs-video]').forEach((box) => {
  const v = box.querySelector('video');
  if (!v) return;
  const btn = box.querySelector('.cs-video__sound');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.4 }).observe(box);
  }
  btn?.addEventListener('click', () => {
    v.muted = !v.muted;
    btn.textContent = v.muted ? '🔇' : '🔊';
    btn.setAttribute('aria-pressed', String(!v.muted));
    btn.setAttribute('aria-label', v.muted ? 'Turn sound on' : 'Turn sound off');
  });
});

/* Stickers tilt with pointer (desktop) or scroll (touch) */
document.querySelectorAll('[data-cs-tilt]').forEach((sec) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const stickers = sec.querySelectorAll('[data-cs-sticker]');
  let raf = 0;
  const set = (x, y) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => stickers.forEach((s, i) => {
      const k = (i + 1) * 6;
      s.style.setProperty('--tx', `${x * k}px`);
      s.style.setProperty('--ty', `${y * k}px`);
    }));
  };
  if (matchMedia('(hover: hover)').matches) {
    sec.addEventListener('pointermove', (e) => {
      const r = sec.getBoundingClientRect();
      set((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
    });
  } else {
    addEventListener('scroll', () => set(0, Math.sin(scrollY / 120)), { passive: true });
  }
});

/* Add-to-cart: fly thumbnail into cart icon, bump count */
(() => {
  if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  subscribe(PUB_SUB_EVENTS.cartUpdate, (ev) => {
    if (ev.source !== 'product-form' && ev.source !== 'cs-card') return;
    const cart = document.querySelector('#cart-icon-bubble');
    const src = (ev.trigger && ev.trigger.closest('.cs-card-p') && ev.trigger.closest('.cs-card-p').querySelector('img')) || document.querySelector('product-info .product__media img, .product__media-item img');
    if (!cart || !src) return;
    const a = src.getBoundingClientRect();
    const b = cart.getBoundingClientRect();
    const fly = document.createElement('img');
    fly.src = src.currentSrc || src.src;
    fly.alt = '';
    fly.className = 'cs-fly';
    fly.style.left = `${a.left + a.width / 2 - 30}px`;
    fly.style.top = `${a.top + a.height / 2 - 30}px`;
    document.body.append(fly);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    fly.animate(
      [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: 0.3 }],
      { duration: 700, easing: 'cubic-bezier(.5,-0.2,.7,.4)' }
    ).onfinish = () => {
      fly.remove();
      cart.classList.remove('cs-bump');
      void cart.offsetWidth;
      cart.classList.add('cs-bump');
    };
  });
})();

/* Add to cart from product cards and the cart-drawer upsell (AJAX, then re-render the drawer) */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cs-add],[data-cs-upsell]');
  if (!btn || btn.disabled) return;
  const cart = document.querySelector('cart-drawer');
  if (!cart) { location.href = window.routes.cart_url; return; }
  const id = btn.dataset.csAdd || btn.dataset.csUpsell;
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Adding...';
  const body = new FormData();
  body.append('id', id);
  body.append('quantity', 1);
  body.append('sections', cart.getSectionsToRender().map((s) => s.id));
  body.append('sections_url', window.location.pathname);
  fetch(window.routes.cart_add_url, { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/javascript' }, body })
    .then((r) => r.json())
    .then((r) => {
      if (r.status) { btn.textContent = 'Unavailable'; setTimeout(() => (btn.textContent = label), 2000); return; }
      cart.renderContents(r);
      if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cs-card', productVariantId: id, cartData: r, trigger: btn });
      }
      btn.textContent = label;
    })
    .catch(() => { btn.textContent = label; })
    .finally(() => { btn.disabled = false; });
});

/* Exit-intent email popup: desktop only, once */
(() => {
  const pop = document.querySelector('[data-cs-exit]');
  if (!pop || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  try { if (localStorage.getItem('cs-exit-seen')) return; } catch (_) {}
  const close = () => { pop.classList.remove('cs-open'); pop.setAttribute('aria-hidden', 'true'); };
  const open = () => {
    pop.classList.add('cs-open'); pop.setAttribute('aria-hidden', 'false');
    try { localStorage.setItem('cs-exit-seen', '1'); } catch (_) {}
    pop.querySelector('input,button').focus();
    document.removeEventListener('mouseout', onOut);
  };
  const onOut = (e) => { if (e.clientY <= 0 && !e.relatedTarget) open(); };
  setTimeout(() => document.addEventListener('mouseout', onOut), 8000);
  pop.querySelector('.cs-exit__close').addEventListener('click', close);
  pop.addEventListener('click', (e) => { if (e.target === pop) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

/* Collapsible header search: icon toggles the search bar */
(() => {
  const btn = document.querySelector('[data-cs-search-toggle]');
  const bar = document.getElementById('cs-searchbar');
  if (!btn || !bar) return;
  const set = (open) => {
    bar.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) bar.querySelector('input[type=search]').focus();
  };
  btn.addEventListener('click', () => set(bar.hidden));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !bar.hidden) { set(false); btn.focus(); } });
  document.addEventListener('click', (e) => { if (!bar.hidden && !e.target.closest('.cs-hd')) set(false); });
})();

/* Product carousel (one row, scroll-snap): arrows, disabled ends, keyboard */
(() => {
  const init = (rail) => {
    if (rail.dataset.csReady) return;
    rail.dataset.csReady = '1';
    const track = rail.querySelector('[data-cs-rail-track]');
    const prev = rail.querySelector('[data-cs-rail-prev]');
    const next = rail.querySelector('[data-cs-rail-next]');
    const stepPx = () => {
      const item = track.querySelector('.cs-rail__item');
      return item ? item.getBoundingClientRect().width + 16 : 280;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      rail.classList.toggle('is-scrollable', max > 4);
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= max - 4;
    };
    const go = (dir, n = 2) => track.scrollBy({ left: dir * stepPx() * n, behavior: 'smooth' });
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('keydown', (e) => {
      if (e.target !== track) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1, 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1, 1); }
    });
    let raf = 0;
    track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
    new MutationObserver(update).observe(track, { childList: true });
    update();
  };
  window.csInitRails = () => document.querySelectorAll('[data-cs-rail]').forEach(init);
  window.csInitRails();
})();

/* Recently viewed: remember handles, fetch card html via the product.recent view */
(() => {
  const sec = document.querySelector('[data-cs-recent]');
  if (!sec) return;
  const KEY = 'cs-recent';
  const cur = sec.dataset.handle;
  let list = [];
  try { list = JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) {}
  const others = list.filter((h) => h !== cur).slice(0, Number(sec.dataset.limit) || 8);
  try { localStorage.setItem(KEY, JSON.stringify([cur, ...list.filter((h) => h !== cur)].slice(0, 16))); } catch (_) {}
  if (!others.length) return;
  Promise.all(others.map((h) => fetch(`/products/${encodeURIComponent(h)}?view=recent`).then((r) => (r.ok ? r.text() : '')).catch(() => '')))
    .then((htmls) => {
      const good = htmls.filter((h) => h && h.includes('cs-card-p'));
      if (!good.length) return;
      sec.querySelector('[data-cs-rail-track]').innerHTML = good.map((h) => `<li class="cs-rail__item">${h}</li>`).join('');
      sec.hidden = false;
      sec.querySelector('[data-cs-rail]').classList.add('cs-in');
      window.csInitRails && window.csInitRails();
    });
})();

/* Mobile menu: full-screen dialog opened by the hamburger */
(() => {
  const menu = document.querySelector('[data-cs-menu]');
  if (!menu) return;
  const burger = menu.querySelector('summary');
  const sync = () => {
    document.body.classList.toggle('cs-menu-open', menu.open);
    burger.setAttribute('aria-expanded', String(menu.open));
    if (menu.open) menu.querySelector('[data-cs-menu-close]').focus();
  };
  const close = (refocus) => { menu.open = false; if (refocus) burger.focus(); };
  menu.addEventListener('toggle', sync);
  menu.querySelector('[data-cs-menu-close]').addEventListener('click', () => close(true));
  menu.querySelectorAll('.cs-menu__links a').forEach((a) => a.addEventListener('click', () => close(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) close(true); });
  matchMedia('(min-width: 990px)').addEventListener('change', (e) => { if (e.matches) close(false); });
})();
