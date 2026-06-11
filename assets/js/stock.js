/**
 * TyagiHub Stock — JavaScript
 * ============================================================
 * File: assets/js/stock.js
 * Features:
 *   1. API-driven asset loading (GET /api/v1/stock/assets)
 *   2. Amazon/Flipkart-style asset detail modal on card click
 *   3. Secure payment code flow (POST /api/v1/stock/verify-payment)
 *   4. JWT token-based protected download
 *   5. Filter sidebar + mobile drawer
 *   6. Grid / List view toggle
 *   7. Active filter chips
 *   8. Sort functionality
 *   9. Wishlist toggle (localStorage)
 *  10. Category bar scroll + active state
 *  11. Pagination
 *  12. Skeleton loading cards
 * ============================================================
 */

'use strict';

/* ============================================================
   CONFIG
   ============================================================ */
const API_BASE = 'http://10.213.23.73:5000/stock'; // matches your Express: app.use('/stock', stockRoutes)

/* ============================================================
   STATE
   ============================================================ */
const StockState = {
  category: 'all',
  priceType: 'all',
  fileTypes: new Set(),
  sortBy: 'popular',
  view: 'grid',
  searchQuery: '',
  page: 1,
  perPage: 24,
  totalAssets: 0,
  totalPages: 1,
  wishlist: new Set(JSON.parse(localStorage.getItem('th-stock-wishlist') || '[]')),
  isLoading: false,
  currentAsset: null,  // asset open in detail modal
};

/* ============================================================
   API HELPERS
   ============================================================ */
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function loadAssets() {
  if (StockState.isLoading) return;
  StockState.isLoading = true;
  showSkeletons();

  const params = new URLSearchParams({
    category: StockState.category,
    price: StockState.priceType,
    sort: StockState.sortBy,
    search: StockState.searchQuery,
    page: StockState.page,
    per_page: StockState.perPage,
  });

  StockState.fileTypes.forEach(t => params.append('type', t));

  try {
    const { ok, data } = await apiFetch(`${API_BASE}/assets?${params}`);
    if (!ok) throw new Error(data.error || 'Failed to load assets');

    StockState.totalAssets = data.pagination.total;
    StockState.totalPages = data.pagination.totalPages;

    renderGrid(data.data);
    renderPagination();
    renderActiveChips();

    const countEl = document.getElementById('result-count');
    if (countEl) countEl.textContent = data.pagination.total.toLocaleString('en-IN');
  } catch (err) {
    console.error('[Stock] loadAssets error:', err);
    showError('Failed to load assets. Please refresh.');
  } finally {
    StockState.isLoading = false;
  }
}

async function loadAssetDetail(id) {
  try {
    const { ok, data } = await apiFetch(`${API_BASE}/assets/${id}`);
    if (!ok) throw new Error(data.error || 'Asset not found');
    return { asset: data.data, related: data.related };
  } catch (err) {
    console.error('[Stock] loadAssetDetail error:', err);
    return null;
  }
}

/* ============================================================
   SKELETON LOADING
   ============================================================ */
function showSkeletons() {
  const grid = document.getElementById('asset-grid');
  if (!grid) return;
  const count = StockState.view === 'list' ? 6 : 12;
  grid.innerHTML = Array(count).fill(0).map(() => `
    <div class="asset-card skeleton-card">
      <div class="skeleton-thumb skeleton-anim"></div>
      <div class="asset-card__body">
        <div class="skeleton-line skeleton-anim" style="width:80%;height:14px;margin-bottom:8px;border-radius:4px;"></div>
        <div class="skeleton-line skeleton-anim" style="width:50%;height:10px;border-radius:4px;"></div>
      </div>
    </div>
  `).join('');
  grid.className = `asset-grid ${StockState.view === 'list' ? 'list-view' : ''}`;
  document.getElementById('stock-empty')?.style?.setProperty('display', 'none');
}

/* ============================================================
   RENDER GRID
   ============================================================ */
function renderGrid(assets) {
  const grid = document.getElementById('asset-grid');
  const emptyEl = document.getElementById('stock-empty');
  if (!grid) return;

  if (!assets || assets.length === 0) {
    grid.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  grid.innerHTML = assets.map(a => renderCard(a)).join('');
  grid.className = `asset-grid ${StockState.view === 'list' ? 'list-view' : ''}`;

  // Attach click handlers for detail modal
  grid.querySelectorAll('.asset-card').forEach(card => {
    card.addEventListener('click', e => {
      // Don't open modal if overlay button was clicked
      if (e.target.closest('.asset-overlay-btn') || e.target.closest('.asset-card__wish')) return;
      const id = parseInt(card.dataset.id);
      openDetailModal(id);
    });
  });
}

function showError(msg) {
  const grid = document.getElementById('asset-grid');
  if (grid) grid.innerHTML = `<div style="padding:2rem;color:var(--clr-danger);grid-column:1/-1;">${msg}</div>`;
}

/* ============================================================
   RENDER CARD
   ============================================================ */
function renderCard(asset) {
  const isWished = StockState.wishlist.has(asset.id);
  const priceText = asset.price === 'free' ? 'FREE' : `₹${asset.priceAmount}`;
  const priceClass = asset.price === 'free' ? 'free' : 'paid';

  const badgeHtml = `
    <span class="asset-badge asset-badge--${asset.price}">${asset.price === 'free' ? 'Free' : 'Paid'}</span>
    ${asset.isNew ? '<span class="asset-badge asset-badge--new">New</span>' : ''}
  `;

  if (StockState.view === 'list') {
    return `
      <div class="asset-card" data-id="${asset.id}" role="article" tabindex="0">
        <div class="asset-card__thumb">
          ${asset.preview ? `<img src="${asset.preview}" alt="${asset.title}" loading="lazy">` : `<div class="asset-card__thumb-placeholder">${asset.emoji}</div>`}
          <div class="asset-card__badges">${badgeHtml}</div>
          <div class="asset-card__overlay">
            <button class="asset-overlay-btn asset-overlay-btn--primary" onclick="handleDownload(event,${asset.id})">⬇ Download</button>
            <button class="asset-overlay-btn asset-overlay-btn--secondary" onclick="openDetailModal(${asset.id})">👁 Details</button>
          </div>
        </div>
        <div class="asset-card__body">
          <div class="asset-card__title">${escHtml(asset.title)}</div>
          <div class="asset-card__meta">
            <span class="asset-card__type-tag">${getTypeIcon(asset.type)} ${asset.type.toUpperCase()}</span>
            <span>${asset.downloads.toLocaleString('en-IN')} downloads</span>
            ${renderStars(asset.rating, asset.ratingCount)}
            <span class="asset-card__price ${priceClass}">${priceText}</span>
          </div>
        </div>
        <button class="asset-card__wish ${isWished ? 'active' : ''}" onclick="toggleWish(event,${asset.id},this)">
          ${isWished ? '❤️' : '🤍'}
        </button>
      </div>
    `;
  }

  return `
    <div class="asset-card" data-id="${asset.id}" role="article" tabindex="0">
      <div class="asset-card__thumb">
        ${asset.preview ? `<img src="${asset.preview}" alt="${asset.title}" loading="lazy">` : `<div class="asset-card__thumb-placeholder">${asset.emoji}</div>`}
        <div class="asset-card__badges">${badgeHtml}</div>
        <div class="asset-card__overlay">
          <button class="asset-overlay-btn asset-overlay-btn--primary" onclick="handleDownload(event,${asset.id})">⬇ Download</button>
          <button class="asset-overlay-btn asset-overlay-btn--secondary" onclick="openDetailModal(${asset.id})">👁 Details</button>
        </div>
        <button class="asset-card__wish ${isWished ? 'active' : ''}" onclick="toggleWish(event,${asset.id},this)">
          ${isWished ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="asset-card__body">
        <div class="asset-card__title">${escHtml(asset.title)}</div>
        <div class="asset-card__meta">
          <span class="asset-card__type-tag">${getTypeIcon(asset.type)} ${asset.type.toUpperCase()}</span>
          <span class="asset-card__price ${priceClass}">${priceText}</span>
        </div>
        ${renderStars(asset.rating, asset.ratingCount)}
      </div>
    </div>
  `;
}

function renderStars(rating, count) {
  if (!rating) return '';
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '⭐'.repeat(full) + (half ? '½' : '');
  return `<span class="asset-rating" title="${rating}/5 (${count} reviews)">${stars} <span style="font-size:10px;color:var(--clr-text-3)">(${count})</span></span>`;
}

function getTypeIcon(type) {
  const icons = { svg: '🔷', image: '🖼️', video: '🎬', pdf: '📄', ppt: '📊', other: '📦' };
  return icons[type] || '📦';
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ============================================================
   DETAIL MODAL — Amazon/Flipkart style
   ============================================================ */
function createDetailModal() {
  if (document.getElementById('asset-detail-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'asset-detail-modal';
  modal.className = 'asset-detail-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Asset Details');
  modal.innerHTML = `
    <div class="adm-overlay" id="adm-overlay"></div>
    <div class="adm-panel" id="adm-panel">
      <button class="adm-close" id="adm-close" aria-label="Close">✕</button>
      <div class="adm-body" id="adm-body">
        <div class="adm-loading">
          <div class="adm-spinner"></div>
          <span>Loading details...</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('adm-overlay').addEventListener('click', closeDetailModal);
  document.getElementById('adm-close').addEventListener('click', closeDetailModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetailModal(); });
}

async function openDetailModal(id) {
  createDetailModal();
  const modal = document.getElementById('asset-detail-modal');
  const body = document.getElementById('adm-body');

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Show loading
  body.innerHTML = `
    <div class="adm-loading">
      <div class="adm-spinner"></div>
      <span>Loading details...</span>
    </div>
  `;

  const result = await loadAssetDetail(id);

  if (!result) {
    body.innerHTML = `<div class="adm-error">Failed to load asset details. Please try again.</div>`;
    return;
  }

  const { asset, related } = result;
  StockState.currentAsset = asset;

  const isWished = StockState.wishlist.has(asset.id);
  const priceText = asset.price === 'free' ? 'FREE' : `₹${asset.priceAmount}`;
  const priceClass = asset.price === 'free' ? 'free' : 'paid';

  const featuresHtml = (asset.features || []).map(f =>
    `<li class="adm-feature-item">✓ ${escHtml(f)}</li>`
  ).join('');

  const relatedHtml = (related || []).slice(0, 4).map(r => `
    <div class="adm-related-card" onclick="openDetailModal(${r.id})">
      <div class="adm-related-thumb">${r.emoji}</div>
      <div class="adm-related-info">
        <div class="adm-related-title">${escHtml(r.title)}</div>
        <div class="adm-related-price ${r.price === 'free' ? 'free' : 'paid'}">${r.price === 'free' ? 'FREE' : `₹${r.priceAmount}`}</div>
      </div>
    </div>
  `).join('');

  const uploadDate = new Date(asset.uploadedAt).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' });

  body.innerHTML = `
    <div class="adm-layout">

      <!-- LEFT: Preview -->
      <div class="adm-preview-col">
        <div class="adm-thumb-main">
          ${asset.preview
            ? `<img src="${asset.preview}" alt="${escHtml(asset.title)}" class="adm-thumb-img">`
            : `<div class="adm-thumb-emoji">${asset.emoji}</div>`
          }
          <div class="adm-badges-row">
            <span class="asset-badge asset-badge--${asset.price}">${asset.price === 'free' ? 'Free' : 'Paid'}</span>
            ${asset.isNew ? '<span class="asset-badge asset-badge--new">New</span>' : ''}
          </div>
        </div>

        <!-- File Info Box -->
        <div class="adm-file-info">
          <div class="adm-fi-row"><span>Format</span><strong>${escHtml(asset.format)}</strong></div>
          <div class="adm-fi-row"><span>Size</span><strong>${escHtml(asset.size)}</strong></div>
          <div class="adm-fi-row"><span>Files</span><strong>${asset.files}</strong></div>
          <div class="adm-fi-row"><span>License</span><strong>${asset.license === 'commercial' ? '✅ Commercial' : '👤 Personal'}</strong></div>
          <div class="adm-fi-row"><span>Uploaded</span><strong>${uploadDate}</strong></div>
          <div class="adm-fi-row"><span>By</span><strong>${escHtml(asset.author)}</strong></div>
        </div>
      </div>

      <!-- RIGHT: Details -->
      <div class="adm-details-col">

        <!-- Title & rating -->
        <div class="adm-title-row">
          <h2 class="adm-title">${escHtml(asset.title)}</h2>
          <button class="adm-wish-btn ${isWished ? 'active' : ''}" id="adm-wish-btn" onclick="toggleWish(event,${asset.id},this)">
            ${isWished ? '❤️ Saved' : '🤍 Save'}
          </button>
        </div>

        ${asset.rating ? `
        <div class="adm-rating-row">
          <span class="adm-stars">
            ${'★'.repeat(Math.floor(asset.rating))}${asset.rating % 1 >= 0.5 ? '½' : ''}
          </span>
          <span class="adm-rating-num">${asset.rating}</span>
          <span class="adm-rating-count">(${asset.ratingCount?.toLocaleString('en-IN')} reviews)</span>
          <span class="adm-downloads-badge">⬇ ${asset.downloads?.toLocaleString('en-IN')} downloads</span>
        </div>
        ` : ''}

        <!-- Price box -->
        <div class="adm-price-box">
          <div class="adm-price ${priceClass}">${priceText}</div>
          ${asset.price === 'paid' ? '<div class="adm-price-gst" style="font-size:11px;color:var(--clr-text-3);">incl. all taxes</div>' : '<div class="adm-price-gst" style="font-size:11px;color:var(--clr-stock);">No payment required</div>'}
        </div>

        <!-- Description -->
        <p class="adm-desc">${escHtml(asset.description)}</p>

        <!-- Features list -->
        ${featuresHtml ? `
        <div class="adm-features">
          <div class="adm-section-label">What's Included</div>
          <ul class="adm-feature-list">${featuresHtml}</ul>
        </div>
        ` : ''}

        <!-- CTA Buttons -->
        <div class="adm-cta-row">
          <button class="adm-btn adm-btn--primary" id="adm-download-btn" onclick="handleDownload(event,${asset.id})">
            <span class="adm-btn-icon">⬇</span>
            ${asset.price === 'free' ? 'Download Free' : `Buy & Download — ₹${asset.priceAmount}`}
          </button>
          <button class="adm-btn adm-btn--outline" onclick="navigator.clipboard.writeText(location.href + '#asset-${asset.id}').then(()=>window.TyagiHub?.Toast?.show('Link copied!','success'))">
            🔗 Share
          </button>
        </div>

        <!-- Tags -->
        <div class="adm-tags">
          ${(asset.tags || []).map(t => `<span class="adm-tag">#${escHtml(t)}</span>`).join('')}
        </div>

      </div>
    </div>

    <!-- Related Assets -->
    ${relatedHtml ? `
    <div class="adm-related-section">
      <div class="adm-section-label">Related Assets</div>
      <div class="adm-related-grid">${relatedHtml}</div>
    </div>
    ` : ''}
  `;
}

function closeDetailModal() {
  const modal = document.getElementById('asset-detail-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
  StockState.currentAsset = null;
}

/* ============================================================
   DOWNLOAD FLOW
   ============================================================ */
window.handleDownload = async function(event, id) {
  if (event) event.stopPropagation();

  // Get asset info (from state or fetch minimal)
  let asset = StockState.currentAsset?.id === id ? StockState.currentAsset : null;
  if (!asset) {
    const result = await loadAssetDetail(id);
    if (!result) return;
    asset = result.asset;
  }

  if (asset.price === 'free') {
    await doFreeDownload(asset);
  } else {
    openPaymentModal(asset);
  }
};

async function doFreeDownload(asset) {
  const btn = document.getElementById('adm-download-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="adm-btn-icon">⏳</span> Preparing...'; }

  try {
    // Get free download token
    const { ok, data } = await apiFetch(`${API_BASE}/request-free-token/${asset.id}`);
    if (!ok) throw new Error(data.error || 'Failed to get download token');

    const token = data.token;
    triggerDownload(asset.id, token, asset.title);

    window.TyagiHub?.Toast?.show(`Downloading: ${asset.title}`, 'success');
  } catch (err) {
    window.TyagiHub?.Toast?.show(err.message || 'Download failed', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<span class="adm-btn-icon">⬇</span> Download Free'; }
  }
}

function triggerDownload(assetId, token, filename) {
  const url = `${API_BASE}/download/${assetId}?token=${encodeURIComponent(token)}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ============================================================
   PAYMENT MODAL
   ============================================================ */
function openPaymentModal(asset) {
  // Remove existing
  document.getElementById('payment-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'payment-modal';
  modal.className = 'payment-modal';
  modal.innerHTML = `
    <div class="pm-overlay" id="pm-overlay"></div>
    <div class="pm-box" role="dialog" aria-label="Payment" aria-modal="true">
      <button class="pm-close" id="pm-close" aria-label="Close">✕</button>

      <div class="pm-header">
        <div class="pm-asset-emoji">${asset.emoji}</div>
        <div>
          <div class="pm-asset-title">${escHtml(asset.title)}</div>
          <div class="pm-asset-price">₹${asset.priceAmount}</div>
        </div>
      </div>

      <!-- QR Section -->
      <div class="pm-qr-section">
        <div class="pm-qr-placeholder">
          <div class="pm-qr-icon">📱</div>
          <div class="pm-qr-text">Scan UPI QR to Pay</div>
          <div class="pm-qr-box">
            <!-- Replace with actual QR image: <img src="/assets/img/upi-qr.png" alt="UPI QR"> -->
            <div style="padding:16px;font-size:13px;color:var(--clr-text-3);text-align:center;">
              UPI ID: <strong>tyagihub@upi</strong><br>
              Amount: <strong>₹${asset.priceAmount}</strong>
            </div>
          </div>
          <div class="pm-qr-note">After payment, enter the transaction code sent via UPI</div>
        </div>
      </div>

      <!-- Code Input -->
      <div class="pm-code-section">
        <label class="pm-code-label" for="pm-code-input">Payment Code</label>
        <input
          id="pm-code-input"
          class="pm-code-input"
          type="text"
          placeholder="Enter payment code (e.g. TH-XXXX-99)"
          maxlength="30"
          autocomplete="off"
          spellcheck="false"
        >
        <div class="pm-error" id="pm-error" style="display:none;"></div>
        <div class="pm-attempts" id="pm-attempts"></div>
      </div>

      <button class="pm-submit-btn" id="pm-submit-btn">
        Verify & Download
      </button>

      <div class="pm-demo-note">
        <strong>Demo codes:</strong> TH-DEMO-${asset.priceAmount} (for testing)
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('open'), 10);
  document.getElementById('pm-code-input').focus();

  // Close handlers
  document.getElementById('pm-overlay').addEventListener('click', () => { modal.remove(); });
  document.getElementById('pm-close').addEventListener('click', () => { modal.remove(); });

  // Submit
  document.getElementById('pm-submit-btn').addEventListener('click', () => submitPayment(asset));
  document.getElementById('pm-code-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitPayment(asset);
    // Clear error on typing
    document.getElementById('pm-error').style.display = 'none';
  });
}

async function submitPayment(asset) {
  const codeInput = document.getElementById('pm-code-input');
  const errorEl = document.getElementById('pm-error');
  const attemptsEl = document.getElementById('pm-attempts');
  const submitBtn = document.getElementById('pm-submit-btn');

  const code = (codeInput?.value || '').trim();
  if (!code) {
    showPmError('Please enter your payment code.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Verifying...';

  try {
    const { ok, data } = await apiFetch(`${API_BASE}/verify-payment`, {
      method: 'POST',
      body: JSON.stringify({ assetId: asset.id, paymentCode: code }),
    });

    if (!ok) {
      const remaining = data.remainingAttempts;
      showPmError(data.error || 'Verification failed.');
      if (typeof remaining === 'number') {
        attemptsEl.textContent = data.locked
          ? '🔒 Account temporarily locked. Try again later.'
          : `${remaining} attempt(s) remaining`;
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Verify & Download';
      return;
    }

    // Success
    submitBtn.textContent = '✅ Verified! Starting download...';

    // Short delay for UX
    await new Promise(r => setTimeout(r, 600));

    // Trigger download with token
    triggerDownload(asset.id, data.token, asset.title);

    window.TyagiHub?.Toast?.show(`Payment verified! Downloading ${asset.title}`, 'success');

    // Close modal after download starts
    setTimeout(() => { document.getElementById('payment-modal')?.remove(); }, 1000);

  } catch (err) {
    showPmError('Network error. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Verify & Download';
  }
}

function showPmError(msg) {
  const el = document.getElementById('pm-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  const input = document.getElementById('pm-code-input');
  if (input) { input.classList.add('pm-input-error'); setTimeout(() => input.classList.remove('pm-input-error'), 600); }
}

/* ============================================================
   WISHLIST
   ============================================================ */
window.toggleWish = function(event, id, btn) {
  if (event) event.stopPropagation();

  if (StockState.wishlist.has(id)) {
    StockState.wishlist.delete(id);
    if (btn) { btn.innerHTML = '🤍 Save'; btn.classList.remove('active'); }
    // Update grid card too
    document.querySelectorAll(`.asset-card[data-id="${id}"] .asset-card__wish`).forEach(b => {
      b.innerHTML = '🤍'; b.classList.remove('active');
    });
  } else {
    StockState.wishlist.add(id);
    if (btn) { btn.innerHTML = '❤️ Saved'; btn.classList.add('active'); }
    document.querySelectorAll(`.asset-card[data-id="${id}"] .asset-card__wish`).forEach(b => {
      b.innerHTML = '❤️'; b.classList.add('active');
    });
    window.TyagiHub?.Toast?.show('Added to wishlist!', 'success');
  }
  localStorage.setItem('th-stock-wishlist', JSON.stringify([...StockState.wishlist]));
};

/* ============================================================
   PAGINATION
   ============================================================ */
function renderPagination() {
  const el = document.getElementById('stock-pagination');
  if (!el) return;

  const { page, totalPages } = StockState;
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = `<button class="page-btn ${page === 1 ? 'disabled' : ''}" onclick="goPage(${page - 1})">&#8592;</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    } else if (Math.abs(i - page) === 2) {
      html += `<span style="color:var(--clr-text-3);padding:0 4px;">…</span>`;
    }
  }

  html += `<button class="page-btn ${page === totalPages ? 'disabled' : ''}" onclick="goPage(${page + 1})">&#8594;</button>`;
  el.innerHTML = html;
}

window.goPage = function(p) {
  StockState.page = p;
  loadAssets();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ============================================================
   ACTIVE FILTER CHIPS
   ============================================================ */
function renderActiveChips() {
  const el = document.getElementById('active-filters');
  if (!el) return;

  const chips = [];
  if (StockState.priceType !== 'all') chips.push({ label: StockState.priceType === 'free' ? '✓ Free' : '✓ Paid', key: 'priceType' });
  StockState.fileTypes.forEach(t => chips.push({ label: `Type: ${t.toUpperCase()}`, key: `type:${t}` }));
  if (StockState.category !== 'all') chips.push({ label: `Category: ${StockState.category}`, key: 'category' });
  if (StockState.searchQuery) chips.push({ label: `"${StockState.searchQuery}"`, key: 'search' });

  el.innerHTML = chips.map(c => `
    <button class="active-filter-chip" onclick="removeFilter('${c.key}')">
      ${escHtml(c.label)}
      <span class="active-filter-chip__remove">✕</span>
    </button>
  `).join('');
}

window.removeFilter = function(key) {
  if (key === 'priceType') {
    StockState.priceType = 'all';
    document.querySelectorAll('.price-toggle__btn').forEach(b => b.classList.toggle('active', b.dataset.val === 'all'));
  } else if (key === 'category') {
    StockState.category = 'all';
    setActiveCatbar('all');
  } else if (key === 'search') {
    StockState.searchQuery = '';
    const si = document.getElementById('stock-search-input');
    if (si) si.value = '';
  } else if (key.startsWith('type:')) {
    const t = key.split(':')[1];
    StockState.fileTypes.delete(t);
    document.querySelectorAll(`input[data-type="${t}"]`).forEach(cb => cb.checked = false);
  }
  StockState.page = 1;
  loadAssets();
};

function setActiveCatbar(cat) {
  document.querySelectorAll('.stock-catbar__item').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
}

function clearAllFilters(si) {
  StockState.priceType = 'all';
  StockState.fileTypes.clear();
  StockState.category = 'all';
  StockState.searchQuery = '';
  StockState.page = 1;
  document.querySelectorAll('.filter-group input').forEach(i => i.checked = false);
  document.querySelectorAll('.price-toggle__btn').forEach(b => b.classList.toggle('active', b.dataset.val === 'all'));
  setActiveCatbar('all');
  if (si) si.value = '';
  else { const s = document.getElementById('stock-search-input'); if (s) s.value = ''; }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // Initial load
  loadAssets();

  const searchInput = document.getElementById('stock-search-input');

  /* --- Category bar --- */
  document.querySelectorAll('.stock-catbar__item').forEach(el => {
    el.addEventListener('click', () => {
      StockState.category = el.dataset.cat || 'all';
      StockState.page = 1;
      setActiveCatbar(StockState.category);
      loadAssets();
    });
  });

  /* --- Price toggle --- */
  document.querySelectorAll('.price-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.price-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      StockState.priceType = btn.dataset.val;
      StockState.page = 1;
      loadAssets();
    });
  });

  /* --- File type checkboxes --- */
  document.querySelectorAll('input[data-type]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) StockState.fileTypes.add(cb.dataset.type);
      else StockState.fileTypes.delete(cb.dataset.type);
      StockState.page = 1;
      loadAssets();
    });
  });

  /* --- Sort dropdown --- */
  const sortSelect = document.getElementById('stock-sort');
  sortSelect?.addEventListener('change', () => {
    StockState.sortBy = sortSelect.value;
    StockState.page = 1;
    loadAssets();
  });

  /* --- Sidebar sort radios sync --- */
  document.querySelectorAll('input[data-sort]').forEach(r => {
    r.addEventListener('change', () => {
      if (sortSelect) { sortSelect.value = r.value; sortSelect.dispatchEvent(new Event('change')); }
    });
  });

  /* --- View toggle --- */
  document.querySelectorAll('.view-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      StockState.view = btn.dataset.view;
      loadAssets();
    });
  });

  /* --- Search --- */
  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      StockState.searchQuery = searchInput.value;
      StockState.page = 1;
      loadAssets();
    }, 350);
  });

  /* --- Filter groups collapse/expand --- */
  document.querySelectorAll('.filter-group__toggle').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.filter-group').classList.toggle('open'));
  });

  /* --- Mobile filter drawer --- */
  const overlay = document.getElementById('filter-drawer-overlay');
  const drawer = document.getElementById('filter-drawer');

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
  document.getElementById('apply-filters-btn')?.addEventListener('click', () => { closeDrawer(); loadAssets(); });
  document.getElementById('clear-filters-btn')?.addEventListener('click', () => { clearAllFilters(searchInput); closeDrawer(); loadAssets(); });
  document.getElementById('clear-all-filters')?.addEventListener('click', () => { clearAllFilters(searchInput); loadAssets(); });

  /* --- Keyboard: Enter on card to open detail --- */
  document.getElementById('asset-grid')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList.contains('asset-card')) {
      openDetailModal(parseInt(e.target.dataset.id));
    }
  });
});