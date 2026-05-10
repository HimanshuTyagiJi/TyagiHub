/**
 * TyagiHub — Main JavaScript
 * Tyagi MultiTech
 * ============================================================
 * Pure Vanilla JS — No jQuery, No framework dependencies
 * ES6+ with graceful degradation
 *
 * Modules:
 *   1. Navbar (scroll behavior + mobile menu)
 *   2. Scroll Reveal (IntersectionObserver)
 *   3. Search Bar (filter + keyboard)
 *   4. Theme Toggle (dark/light)
 *   5. Utility functions
 *
 * Future backend hooks are marked with:
 *   // [BACKEND-HOOK]: description of what goes here
 * ============================================================
 */

'use strict';

/* ============================================================
   UTILITY
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const on = (el, event, handler, opts) => el?.addEventListener(event, handler, opts);

function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ============================================================
   1. NAVBAR
   ============================================================ */
const Navbar = (() => {
  const nav     = $('.navbar');
  const burger  = $('.navbar__hamburger');
  const mobileNav = $('.mobile-nav');

  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  function toggleMobileMenu() {
    const isOpen = mobileNav?.classList.toggle('open');
    burger?.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';

    // Animate hamburger lines
    const spans = $$('span', burger);
    if (spans.length === 3) {
      if (isOpen) {
        spans[0].style.transform = 'translateY(7px) rotate(45deg)';
        spans[1].style.opacity   = '0';
        spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity   = '';
        spans[2].style.transform = '';
      }
    }
  }

  function closeMobileMenu() {
    mobileNav?.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    const spans = $$('span', burger);
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }

  function setActiveLink() {
    const path = window.location.pathname;
    $$('.navbar__link, .mobile-nav__link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && path.startsWith(href) && href !== '/') {
        link.classList.add('active');
      } else if (href === '/' && path === '/') {
        link.classList.add('active');
      }
    });
  }

  function init() {
    on(window, 'scroll', debounce(onScroll, 10), { passive: true });
    on(burger, 'click', toggleMobileMenu);

    // Close mobile menu when clicking outside
    on(document, 'click', (e) => {
      if (mobileNav?.classList.contains('open') &&
          !nav?.contains(e.target) &&
          !mobileNav?.contains(e.target)) {
        closeMobileMenu();
      }
    });

    // Close on ESC
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    });

    // Close when mobile link is clicked
    $$('.mobile-nav__link').forEach(link => {
      on(link, 'click', closeMobileMenu);
    });

    setActiveLink();
    onScroll(); // run once on load
  }

  return { init };
})();

/* ============================================================
   2. SCROLL REVEAL
   ============================================================ */
const ScrollReveal = (() => {
  const SELECTOR = '.reveal';
  let observer;

  function init() {
    const elements = $$(SELECTOR);
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: show all immediately
      elements.forEach(el => el.classList.add('visible'));
      return;
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ============================================================
   3. SEARCH BAR — homepage search only
   Navbar search is handled by search.js
   ============================================================ */
const SearchBar = (() => {
  const input     = $('.search-bar__input');
  const searchBtn = $('.search-bar__btn');
  const tags      = $$('.search-tag');

  function handleSearch(query) {
    if (!query.trim()) return;
    window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
  }

  function init() {
    on(searchBtn, 'click', () => handleSearch(input?.value || ''));
    on(input, 'keydown', (e) => {
      if (e.key === 'Enter') handleSearch(input.value);
    });
    tags.forEach(tag => {
      on(tag, 'click', () => {
        const query = tag.dataset.query || tag.textContent.trim();
        if (input) input.value = query;
        handleSearch(query);
      });
    });
  }

  return { init };
})();

/* ============================================================
   4. THEME TOGGLE
   ============================================================ */
const ThemeToggle = (() => {
  const STORAGE_KEY = 'tyagihub-theme';
  const toggleBtn   = $('.theme-toggle');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label',
        `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
      );
    }
  }

  function getPreferred() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function init() {
    const theme = getPreferred();
    applyTheme(theme);

    on(toggleBtn, 'click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    // Sync with OS preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  return { init };
})();

/* ============================================================
   5. HERO COUNTER ANIMATION
   ============================================================ */
const CounterAnimation = (() => {
  function animateCounter(el) {
    const target = parseInt(el.dataset.count || el.textContent.replace(/\D/g, ''), 10);
    const suffix = el.dataset.suffix || el.textContent.replace(/[\d,]/g, '').trim();
    if (!target) return;

    const duration = 1800;
    const start    = performance.now();

    function update(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.round(target * eased);

      el.textContent = current.toLocaleString('en-IN') + (suffix ? suffix : '');

      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  function init() {
    const counters = $$('[data-count]');
    if (!counters.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => obs.observe(c));
  }

  return { init };
})();

/* ============================================================
   6. LAZY LOADING IMAGES
   ============================================================ */
const LazyLoader = (() => {
  function init() {
    // Native lazy loading support check
    if ('loading' in HTMLImageElement.prototype) {
      // Browser handles it natively via loading="lazy"
      return;
    }

    // Fallback IntersectionObserver lazy loader
    const images = $$('img[data-src]');
    if (!images.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    images.forEach(img => obs.observe(img));
  }

  return { init };
})();

/* ============================================================
   7. CARD HOVER EFFECTS
   ============================================================ */
const CardEffects = (() => {
  function init() {
    const cards = $$('.service-card');

    cards.forEach(card => {
      on(card, 'mousemove', (e) => {
        const rect   = card.getBoundingClientRect();
        const x      = e.clientX - rect.left;
        const y      = e.clientY - rect.top;
        const cx     = rect.width  / 2;
        const cy     = rect.height / 2;
        const rotX   = ((y - cy) / cy) * -4;
        const rotY   = ((x - cx) / cx) *  4;

        card.style.transform = `translateY(-6px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        card.style.transition = 'transform 50ms linear';
      });

      on(card, 'mouseleave', () => {
        card.style.transform = '';
        card.style.transition = '';
      });
    });
  }

  return { init };
})();

/* ============================================================
   8. TOAST NOTIFICATION SYSTEM
   (Future: show API success/error messages)
   ============================================================ */
const Toast = (() => {
  let container;

  function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      z-index: 3000; display: flex; flex-direction: column;
      gap: 8px; pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  function show(message, type = 'info', duration = 3000) {
    const c = ensureContainer();
    const toast = document.createElement('div');
    const colors = {
      info:    ['#1a2030', '#f5a623'],
      success: ['#0f2020', '#34d399'],
      error:   ['#200f0f', '#f87171'],
      warning: ['#201a0f', '#f5a623'],
    };
    const [bg, accent] = colors[type] || colors.info;

    toast.style.cssText = `
      background: ${bg}; border: 1px solid ${accent}33;
      border-left: 3px solid ${accent};
      color: #e8eaf0; padding: 12px 16px;
      border-radius: 8px; font-family: var(--font-body);
      font-size: 14px; max-width: 320px;
      pointer-events: all; cursor: pointer;
      animation: fadeIn 250ms ease;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    `;

    toast.textContent = message;
    c.appendChild(toast);

    const remove = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = '200ms ease';
      setTimeout(() => toast.remove(), 200);
    };

    on(toast, 'click', remove);
    setTimeout(remove, duration);
  }

  return { show };
})();

/* ============================================================
   9. FUTURE BACKEND API CLIENT STUB
   [BACKEND-HOOK] Replace stub with real fetch calls when
    api.tyagihub.in is live
   ============================================================ */
const API = (() => {
  const BASE = 'https://api.tyagihub.in/v1';
  const ENABLED = false; // flip to true when backend is ready

  async function get(endpoint) {
    if (!ENABLED) {
      console.log(`[API STUB] GET ${BASE}${endpoint}`);
      return null;
    }
    const res = await fetch(`${BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async function post(endpoint, body) {
    if (!ENABLED) {
      console.log(`[API STUB] POST ${BASE}${endpoint}`, body);
      return null;
    }
    const res = await fetch(`${BASE}${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  return { get, post };
})();

/* ============================================================
   INIT — Boot all modules when DOM is ready
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  Navbar.init();
  ScrollReveal.init();
  SearchBar.init();
  ThemeToggle.init();
  CounterAnimation.init();
  LazyLoader.init();
  CardEffects.init();

  console.log('%c TyagiHub 🚀', 'color:#f5a623;font-size:18px;font-weight:bold;');
  console.log('%c Tyagi MultiTech — tyagihub.in', 'color:#a0a8bc;font-size:12px;');
});

// Expose globals for inline HTML use
window.TyagiHub = { Toast, API };
