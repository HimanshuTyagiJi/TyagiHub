/**
 * TyagiHub Stock — Dedicated JavaScript
 * Tyagi MultiTech
 * ============================================================
 * File: assets/js/stock.js
 * Features:
 *   1. Filter sidebar toggle groups
 *   2. Free/Paid/All toggle
 *   3. Asset search (client-side filter)
 *   4. Grid / List view toggle
 *   5. Mobile filter drawer
 *   6. Active filter chips
 *   7. Sort functionality
 *   8. Wishlist toggle
 *   9. Lazy loading thumbnails
 *  10. Category bar scroll + active state
 *
 * [BACKEND-HOOK]: All filtering is client-side now.
 * When Node.js API is ready, replace filterAssets()
 * with: GET /api/v1/stock/assets?category=&type=&price=&sort=
 * ============================================================
 */

'use strict';

/* ============================================================
   STATE
   ============================================================ */
const StockState = {
  category:   'all',        // current category
  priceType:  'all',        // 'all' | 'free' | 'paid'
  fileTypes:  new Set(),    // selected file types
  sortBy:     'popular',    // popular | newest | name-asc | name-desc
  view:       'grid',       // 'grid' | 'list'
  searchQuery: '',
  page:       1,
  perPage:    24,
  wishlist:   new Set(JSON.parse(localStorage.getItem('th-stock-wishlist') || '[]')),
};

/* ============================================================
   SAMPLE ASSET DATA
   [BACKEND-HOOK]: Replace with API call GET /api/v1/stock/assets
   ============================================================ */
const ASSETS = [
  { id: 1,  title: 'Modern Business Icons Pack',         type: 'svg',   category: 'icons',       price: 'free',    tags: ['business','office','icons'],    emoji: '🎯', downloads: 1240, isNew: true  },
  { id: 2,  title: 'Abstract Gradient Backgrounds Set',  type: 'image', category: 'backgrounds', price: 'free',    tags: ['gradient','abstract','bg'],     emoji: '🌈', downloads: 890,  isNew: false },
  { id: 3,  title: 'Social Media Templates Pack',        type: 'ppt',   category: 'templates',   price: 'paid',    tags: ['social','instagram','template'],emoji: '📋', downloads: 456,  isNew: false },
  { id: 4,  title: 'Flat Illustration Character Set',    type: 'svg',   category: 'illustrations',price: 'free',   tags: ['flat','character','people'],    emoji: '🧑‍🎨', downloads: 2100, isNew: false },
  { id: 5,  title: 'Exam Question Paper Template',       type: 'pdf',   category: 'templates',   price: 'free',    tags: ['exam','paper','education'],    emoji: '📄', downloads: 3400, isNew: true  },
  { id: 6,  title: 'Motion Graphics Elements',          type: 'video', category: 'videos',       price: 'paid',    tags: ['motion','animation','loop'],   emoji: '🎬', downloads: 234,  isNew: false },
  { id: 7,  title: 'UI Icon Set — 500 SVGs',            type: 'svg',   category: 'icons',        price: 'free',    tags: ['ui','icons','interface'],      emoji: '🔧', downloads: 5600, isNew: false },
  { id: 8,  title: 'Resume Template Professional',      type: 'ppt',   category: 'templates',   price: 'free',    tags: ['resume','cv','job'],           emoji: '📑', downloads: 4200, isNew: false },
  { id: 9,  title: 'Nature & Landscape Photos',         type: 'image', category: 'photos',       price: 'free',    tags: ['nature','landscape','photo'],  emoji: '🌿', downloads: 780,  isNew: false },
  { id: 10, title: 'YouTube Thumbnail Templates',       type: 'ppt',   category: 'templates',   price: 'paid',    tags: ['youtube','thumbnail','video'], emoji: '▶️', downloads: 1890, isNew: true  },
  { id: 11, title: 'Math Formula Cheat Sheet PDF',      type: 'pdf',   category: 'documents',   price: 'free',    tags: ['math','formula','study'],      emoji: '📐', downloads: 6700, isNew: false },
  { id: 12, title: 'Technology Vector Backgrounds',     type: 'svg',   category: 'backgrounds', price: 'free',    tags: ['tech','vector','bg'],          emoji: '💻', downloads: 1100, isNew: false },
  { id: 13, title: 'Animated Loading Spinners Pack',    type: 'svg',   category: 'icons',        price: 'free',    tags: ['loading','spinner','animated'],emoji: '⏳', downloads: 920,  isNew: true  },
  { id: 14, title: 'Business Presentation Template',   type: 'ppt',   category: 'templates',   price: 'paid',    tags: ['business','presentation','ppt'],emoji: '📊', downloads: 340,  isNew: false },
  { id: 15, title: 'GK Quiz Question Bank PDF',         type: 'pdf',   category: 'documents',   price: 'free',    tags: ['gk','quiz','exam','ssc'],      emoji: '📚', downloads: 8900, isNew: false },
  { id: 16, title: 'Diwali Festival Graphics Pack',     type: 'image', category: 'illustrations',price: 'free',   tags: ['diwali','festival','india'],   emoji: '🪔', downloads: 2300, isNew: false },
  { id: 17, title: 'Dark UI Mockup Screens',           type: 'image', category: 'mockups',      price: 'paid',    tags: ['ui','mockup','dark','screen'], emoji: '📱', downloads: 560,  isNew: false },
  { id: 18, title: 'SSC Exam Paper Template',          type: 'pdf',   category: 'documents',   price: 'free',    tags: ['ssc','exam','government'],    emoji: '📋', downloads: 4100, isNew: true  },
  { id: 19, title: 'Social Icons Full Pack',           type: 'svg',   category: 'icons',        price: 'free',    tags: ['social','whatsapp','youtube'], emoji: '🌐', downloads: 7800, isNew: false },
  { id: 20, title: 'Cinematic Video Transitions',      type: 'video', category: 'videos',       price: 'paid',    tags: ['transition','cinematic','edit'],emoji: '🎥', downloads: 430,  isNew: false },
  { id: 21, title: 'Handwritten Font Collection',      type: 'other', category: 'fonts',        price: 'free',    tags: ['font','handwritten','calligraphy'],emoji: '✍️', downloads: 3200, isNew: false },
  { id: 22, title: 'Instagram Story Templates',        type: 'ppt',   category: 'templates',   price: 'free',    tags: ['instagram','story','social'],  emoji: '📸', downloads: 5100, isNew: true  },
  { id: 23, title: 'Chemistry Formula Sheet PDF',      type: 'pdf',   category: 'documents',   price: 'free',    tags: ['chemistry','formula','study'], emoji: '⚗️', downloads: 3800, isNew: false },
  { id: 24, title: '3D Icon Pack Premium',             type: 'image', category: 'icons',        price: 'paid',    tags: ['3d','icon','premium'],         emoji: '💎', downloads: 890,  isNew: false },
];

/* ============================================================
   FILTER LOGIC
   ============================================================ */
function filterAndSort() {
  let result = [...ASSETS];

  // Category filter
  if (StockState.category !== 'all') {
    result = result.filter(a => a.category === StockState.category);
  }

  // Price type filter
  if (StockState.priceType !== 'all') {
    result = result.filter(a => a.price === StockState.priceType);
  }

  // File type filter
  if (StockState.fileTypes.size > 0) {
    result = result.filter(a => StockState.fileTypes.has(a.type));
  }

  // Search query
  if (StockState.searchQuery.trim()) {
    const q = StockState.searchQuery.toLowerCase();
    result = result.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.tags.some(t => t.includes(q)) ||
      a.category.includes(q)
    );
  }

  // Sort
  switch (StockState.sortBy) {
    case 'popular':  result.sort((a, b) => b.downloads - a.downloads); break;
    case 'newest':   result.sort((a, b) => b.id - a.id); break;
    case 'name-asc': result.sort((a, b) => a.title.localeCompare(b.title)); break;
    case 'name-desc':result.sort((a, b) => b.title.localeCompare(a.title)); break;
  }

  return result;
}

/* ============================================================
   RENDER ASSET CARD
   ============================================================ */
function renderCard(asset, viewMode) {
  const isWished  = StockState.wishlist.has(asset.id);
  const priceText = asset.price === 'free' ? 'FREE' : '₹99';
  const priceClass = asset.price === 'free' ? 'free' : 'paid';

  const badgeHtml = `
    <span class="asset-badge asset-badge--${asset.price}">${asset.price === 'free' ? 'Free' : 'Paid'}</span>
    ${asset.isNew ? '<span class="asset-badge asset-badge--new">New</span>' : ''}
  `;

  if (viewMode === 'list') {
    return `
      <div class="asset-card" data-id="${asset.id}">
        <div class="asset-card__thumb">
          <div class="asset-card__thumb-placeholder">${asset.emoji}</div>
          <div class="asset-card__badges">${badgeHtml}</div>
          <div class="asset-card__overlay">
            <button class="asset-overlay-btn asset-overlay-btn--primary" onclick="downloadAsset(${asset.id})">⬇ Download</button>
            <button class="asset-overlay-btn asset-overlay-btn--secondary" onclick="previewAsset(${asset.id})">👁 Preview</button>
          </div>
        </div>
        <div class="asset-card__body">
          <div class="asset-card__title">${asset.title}</div>
          <div class="asset-card__meta">
            <span class="asset-card__type-tag">${getTypeIcon(asset.type)} ${asset.type.toUpperCase()}</span>
            <span>${asset.downloads.toLocaleString('en-IN')} downloads</span>
            <span class="asset-card__price ${priceClass}">${priceText}</span>
          </div>
        </div>
        <button class="asset-card__wish ${isWished ? 'active' : ''}" onclick="toggleWish(${asset.id}, this)" title="Save to wishlist">
          ${isWished ? '❤️' : '🤍'}
        </button>
      </div>
    `;
  }

  return `
    <div class="asset-card" data-id="${asset.id}">
      <div class="asset-card__thumb">
        <div class="asset-card__thumb-placeholder">${asset.emoji}</div>
        <div class="asset-card__badges">${badgeHtml}</div>
        <div class="asset-card__overlay">
          <button class="asset-overlay-btn asset-overlay-btn--primary" onclick="downloadAsset(${asset.id})">⬇ Download</button>
          <button class="asset-overlay-btn asset-overlay-btn--secondary" onclick="previewAsset(${asset.id})">👁 Preview</button>
        </div>
        <button class="asset-card__wish ${isWished ? 'active' : ''}" onclick="toggleWish(${asset.id}, this)" title="Save">
          ${isWished ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="asset-card__body">
        <div class="asset-card__title">${asset.title}</div>
        <div class="asset-card__meta">
          <span class="asset-card__type-tag">${getTypeIcon(asset.type)} ${asset.type.toUpperCase()}</span>
          <span class="asset-card__price ${priceClass}">${priceText}</span>
        </div>
      </div>
    </div>
  `;
}

function getTypeIcon(type) {
  const icons = { svg:'🔷', image:'🖼️', video:'🎬', pdf:'📄', ppt:'📊', other:'📦' };
  return icons[type] || '📦';
}

/* ============================================================
   RENDER GRID
   ============================================================ */
function renderGrid() {
  const grid = document.getElementById('asset-grid');
  const countEl = document.getElementById('result-count');
  const emptyEl = document.getElementById('stock-empty');
  if (!grid) return;

  const results = filterAndSort();
  const total   = results.length;
  const start   = (StockState.page - 1) * StockState.perPage;
  const page    = results.slice(start, start + StockState.perPage);

  if (countEl) countEl.textContent = total.toLocaleString('en-IN');

  if (total === 0) {
    grid.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'flex';
  } else {
    if (emptyEl) emptyEl.style.display = 'none';
    grid.innerHTML = page.map(a => renderCard(a, StockState.view)).join('');
  }

  // View class
  grid.className = `asset-grid ${StockState.view === 'list' ? 'list-view' : ''}`;

  renderPagination(total);
  renderActiveChips();
}

/* ============================================================
   PAGINATION
   ============================================================ */
function renderPagination(total) {
  const el = document.getElementById('stock-pagination');
  if (!el) return;

  const totalPages = Math.ceil(total / StockState.perPage);
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = `<button class="page-btn ${StockState.page === 1 ? 'disabled' : ''}" onclick="goPage(${StockState.page - 1})">&#8592;</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - StockState.page) <= 1) {
      html += `<button class="page-btn ${i === StockState.page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    } else if (Math.abs(i - StockState.page) === 2) {
      html += `<span style="color:var(--clr-text-3);padding:0 4px;">…</span>`;
    }
  }

  html += `<button class="page-btn ${StockState.page === totalPages ? 'disabled' : ''}" onclick="goPage(${StockState.page + 1})">&#8594;</button>`;
  el.innerHTML = html;
}

window.goPage = function(p) {
  StockState.page = p;
  renderGrid();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ============================================================
   ACTIVE FILTER CHIPS
   ============================================================ */
function renderActiveChips() {
  const el = document.getElementById('active-filters');
  if (!el) return;

  const chips = [];

  if (StockState.priceType !== 'all') {
    chips.push({ label: StockState.priceType === 'free' ? '✓ Free' : '✓ Paid', key: 'priceType' });
  }

  StockState.fileTypes.forEach(t => {
    chips.push({ label: `Type: ${t.toUpperCase()}`, key: `type:${t}` });
  });

  if (StockState.category !== 'all') {
    chips.push({ label: `Category: ${StockState.category}`, key: 'category' });
  }

  el.innerHTML = chips.map(c => `
    <button class="active-filter-chip" onclick="removeFilter('${c.key}')">
      ${c.label}
      <span class="active-filter-chip__remove">✕</span>
    </button>
  `).join('');
}

window.removeFilter = function(key) {
  if (key === 'priceType') {
    StockState.priceType = 'all';
    document.querySelectorAll('.price-toggle__btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.price-toggle__btn[data-val="all"]')?.classList.add('active');
  } else if (key === 'category') {
    StockState.category = 'all';
    setActiveCatbar('all');
  } else if (key.startsWith('type:')) {
    const t = key.split(':')[1];
    StockState.fileTypes.delete(t);
    const cb = document.querySelector(`input[data-type="${t}"]`);
    if (cb) cb.checked = false;
  }
  StockState.page = 1;
  renderGrid();
};

/* ============================================================
   CATEGORY BAR
   ============================================================ */
function setActiveCatbar(cat) {
  document.querySelectorAll('.stock-catbar__item').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
}

/* ============================================================
   ACTIONS
   ============================================================ */
window.downloadAsset = function(id) {
  const asset = ASSETS.find(a => a.id === id);
  if (!asset) return;

  if (asset.price === 'paid') {
    // [BACKEND-HOOK]: redirect to payment page
    window.TyagiHub?.Toast.show('Premium asset — Login to purchase', 'info');
    return;
  }
  // [BACKEND-HOOK]: GET /api/v1/stock/download?id=
  window.TyagiHub?.Toast.show(`Downloading: ${asset.title}`, 'success');
};

window.previewAsset = function(id) {
  const asset = ASSETS.find(a => a.id === id);
  if (!asset) return;
  window.TyagiHub?.Toast.show(`Preview: ${asset.title} (coming soon)`, 'info');
};

window.toggleWish = function(id, btn) {
  if (StockState.wishlist.has(id)) {
    StockState.wishlist.delete(id);
    btn.textContent = '🤍';
    btn.classList.remove('active');
  } else {
    StockState.wishlist.add(id);
    btn.textContent = '❤️';
    btn.classList.add('active');
    window.TyagiHub?.Toast.show('Added to wishlist!', 'success');
  }
  localStorage.setItem('th-stock-wishlist', JSON.stringify([...StockState.wishlist]));
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  renderGrid();

  /* --- Category bar --- */
  document.querySelectorAll('.stock-catbar__item').forEach(el => {
    el.addEventListener('click', () => {
      StockState.category = el.dataset.cat || 'all';
      StockState.page = 1;
      setActiveCatbar(StockState.category);
      renderGrid();
    });
  });

  /* --- Price toggle (Free/Paid/All) --- */
  document.querySelectorAll('.price-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.price-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      StockState.priceType = btn.dataset.val;
      StockState.page = 1;
      renderGrid();
    });
  });

  /* --- File type checkboxes --- */
  document.querySelectorAll('input[data-type]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) StockState.fileTypes.add(cb.dataset.type);
      else StockState.fileTypes.delete(cb.dataset.type);
      StockState.page = 1;
      renderGrid();
    });
  });

  /* --- Sort --- */
  const sortSelect = document.getElementById('stock-sort');
  sortSelect?.addEventListener('change', () => {
    StockState.sortBy = sortSelect.value;
    StockState.page = 1;
    renderGrid();
  });

  /* --- View toggle --- */
  document.querySelectorAll('.view-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      StockState.view = btn.dataset.view;
      renderGrid();
    });
  });

  /* --- Search --- */
  let searchTimer;
  const searchInput = document.getElementById('stock-search-input');
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      StockState.searchQuery = searchInput.value;
      StockState.page = 1;
      renderGrid();
    }, 300);
  });

  /* --- Filter groups collapse/expand --- */
  document.querySelectorAll('.filter-group__toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.filter-group').classList.toggle('open');
    });
  });

  /* --- Mobile filter drawer --- */
  const overlay = document.getElementById('filter-drawer-overlay');
  const drawer  = document.getElementById('filter-drawer');

  document.getElementById('mobile-filter-btn')?.addEventListener('click', () => {
    overlay?.classList.add('open');
    drawer?.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  function closeDrawer() {
    overlay?.classList.remove('open');
    drawer?.classList.remove('open');
    document.body.style.overflow = '';
  }

  overlay?.addEventListener('click', closeDrawer);
  document.getElementById('filter-drawer-close')?.addEventListener('click', closeDrawer);

  document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
    closeDrawer();
    renderGrid();
  });

  document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
    StockState.priceType = 'all';
    StockState.fileTypes.clear();
    StockState.category = 'all';
    StockState.searchQuery = '';
    StockState.page = 1;
    document.querySelectorAll('.filter-group input').forEach(i => i.checked = false);
    document.querySelectorAll('.price-toggle__btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.price-toggle__btn[data-val="all"]')?.classList.add('active');
    setActiveCatbar('all');
    if (searchInput) searchInput.value = '';
    closeDrawer();
    renderGrid();
  });

  /* --- Clear all filters link --- */
  document.getElementById('clear-all-filters')?.addEventListener('click', () => {
    StockState.priceType = 'all';
    StockState.fileTypes.clear();
    StockState.category = 'all';
    StockState.searchQuery = '';
    StockState.page = 1;
    document.querySelectorAll('.filter-group input').forEach(i => i.checked = false);
    document.querySelectorAll('.price-toggle__btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.price-toggle__btn[data-val="all"]')?.classList.add('active');
    if (searchInput) searchInput.value = '';
    setActiveCatbar('all');
    renderGrid();
  });
});
