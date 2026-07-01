/**
 * TyagiHub Stock — Live Apps Script Integration Engine
 * File: assets/js/stock.js
 * ============================================================
 */

'use strict';

// 🌐 1. GOOGLE APPS SCRIPT CORE ENDPOINT
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxD8hHm24KLMdYlRwbyC_T0md13TUE-lJ9al1m3wOuBVifUXt3WQAKth1B49eYMLK9E/exec';

/* ============================================================
   STATE MANAGEMENT
   ============================================================ */
const StockState = {
  category: 'all',
  priceType: 'all',
  fileTypes: new Set(),
  sortBy: 'popular',
  view: 'grid',
  searchQuery: '',
  page: 1,
  perPage: 12, // Google Sheet caching ke liye ideal load size
  totalAssets: 0,
  totalPages: 1,
  allFetchedData: [], // Client-side memory caching to avoid spreadsheet lag
  wishlist: new Set(JSON.parse(localStorage.getItem('th-stock-wishlist') || '[]')),
  isLoading: false,
  currentAsset: null,
};

/* ============================================================
   CORE ASSET FETCH ENGINE (With Full Client-Side Filtering)
   ============================================================ */
async function loadAssets() {
  if (StockState.isLoading) return;
  StockState.isLoading = true;
  showSkeletons();

  try {
    // Agar local cache memory empty hai toh hi server se data khincho bsdk
    if (StockState.allFetchedData.length === 0) {
      const response = await fetch(`${GAS_API_URL}?action=getAssets`);
      if (!response.ok) throw new Error('Spreadsheet network refusal.');
      StockState.allFetchedData = await response.json();
    }

    // 🏎️ AUTOMATIC CLIENT FILTER WRAPPER (Saves Spreadsheet processing quota)
    let filtered = StockState.allFetchedData.filter(asset => {
      const matchCat = StockState.category === 'all' || asset.category === StockState.category;
      const matchPrice = StockState.priceType === 'all' || asset.priceType === StockState.priceType;
      const matchType = StockState.fileTypes.size === 0 || StockState.fileTypes.has(asset.fileType);
      
      const q = StockState.searchQuery.toLowerCase();
      const matchSearch = !StockState.searchQuery || 
                          asset.title.toLowerCase().includes(q) ||
                          asset.description.toLowerCase().includes(q) ||
                          (asset.tags && asset.tags.toLowerCase().includes(q));
      return matchCat && matchPrice && matchType && matchSearch;
    });

    // 🎛️ SORT COMPILER
    if (StockState.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    } else if (StockState.sortBy === 'name-asc') {
      filtered.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    } else if (StockState.sortBy === 'name-desc') {
      filtered.sort((a, b) => String(b.title).localeCompare(String(a.title)));
    } else {
      filtered.sort((a, b) => (parseInt(b.popularity) || 0) - (parseInt(a.popularity) || 0));
    }

    // 📄 PAGINATION RANGE SELECTOR
    StockState.totalAssets = filtered.length;
    StockState.totalPages = Math.ceil(filtered.length / StockState.perPage) || 1;
    
    const startIndex = (StockState.page - 1) * StockState.perPage;
    const paginatedData = filtered.slice(startIndex, startIndex + StockState.perPage);

    renderGrid(paginatedData);
    renderPagination();
    renderActiveChips();

    const countEl = document.getElementById('result-count');
    if (countEl) countEl.textContent = StockState.totalAssets.toLocaleString('en-IN');

  } catch (err) {
    console.error('[Stock Engine Error]:', err);
    showError('Google Cloud server connection error. Refresh bsdk.');
  } finally {
    StockState.isLoading = false;
  }
}

function loadAssetDetail(id) {
  const asset = StockState.allFetchedData.find(a => a.id == id);
  if (!asset) return null;
  
  const related = StockState.allFetchedData.filter(a => a.category === asset.category && a.id != asset.id);
  return { asset, related };
}

/* ============================================================
   SKELETON RENDERER
   ============================================================ */
function showSkeletons() {
  const grid = document.getElementById('asset-grid');
  if (!grid) return;
  const count = StockState.view === 'list' ? 4 : 8;
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
  document.getElementById('stock-empty').style.display = 'none';
}

/* ============================================================
   GRID COMPILER & CARD RENDERER
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

  grid.querySelectorAll('.asset-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.asset-overlay-btn') || e.target.closest('.asset-card__wish')) return;
      openDetailModal(card.dataset.id);
    });
  });
}

function renderCard(asset) {
  const isWished = StockState.wishlist.has(asset.id);
  const priceText = asset.priceType === 'free' ? 'FREE' : `₹${asset.priceAmount}`;
  const priceClass = asset.priceType === 'free' ? 'free' : 'paid';

  const badgeHtml = `
    <span class="asset-badge asset-badge--${asset.priceType}">${asset.priceType === 'free' ? 'Free' : 'Paid'}</span>
  `;

  return `
    <div class="asset-card" data-id="${asset.id}" role="article" tabindex="0">
      <div class="asset-card__thumb">
        ${asset.thumbnailId ? `<img src="https://docs.google.com/uc?export=download&id=${asset.thumbnailId}" alt="${asset.title}" loading="lazy">` : `<div class="asset-card__thumb-placeholder">${asset.emoji || '📦'}</div>`}
        <div class="asset-card__badges">${badgeHtml}</div>
        <div class="asset-card__overlay">
          <button class="asset-overlay-btn asset-overlay-btn--primary" onclick="handleDownload(event,'${asset.id}')">⬇ Download</button>
          <button class="asset-overlay-btn asset-overlay-btn--secondary" onclick="openDetailModal('${asset.id}')">👁 Details</button>
        </div>
        <button class="asset-card__wish ${isWished ? 'active' : ''}" onclick="toggleWish(event,'${asset.id}',this)">
          ${isWished ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="asset-card__body">
        <div class="asset-card__title">${escHtml(asset.title)}</div>
        <div class="asset-card__meta">
          <span class="asset-card__type-tag">${getTypeIcon(asset.fileType)} ${String(asset.fileType).toUpperCase()}</span>
          <span class="asset-card__price ${priceClass}">${priceText}</span>
        </div>
      </div>
    </div>
  `;
}

function showError(msg) {
  const grid = document.getElementById('asset-grid');
  if (grid) grid.innerHTML = `<div style="padding:2rem;color:var(--clr-danger);grid-column:1/-1;">${msg}</div>`;
}

function getTypeIcon(type) {
  const icons = { svg: '🔷', image: '🖼️', video: '🎬', pdf: '📄', ppt: '📊', other: '📦' };
  return icons[type] || '📦';
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ============================================================
   DYNAMIC DETAILED MODAL LAYER
   ============================================================ */
function createDetailModal() {
  if (document.getElementById('asset-detail-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'asset-detail-modal';
  modal.className = 'asset-detail-modal';
  modal.innerHTML = `
    <div class="adm-overlay" id="adm-overlay"></div>
    <div class="adm-panel" id="adm-panel">
      <button class="adm-close" id="adm-close">✕</button>
      <div class="adm-body" id="adm-body"></div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('adm-overlay').addEventListener('click', closeDetailModal);
  document.getElementById('adm-close').addEventListener('click', closeDetailModal);
}

function openDetailModal(id) {
  createDetailModal();
  const modal = document.getElementById('asset-detail-modal');
  const body = document.getElementById('adm-body');

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  const result = loadAssetDetail(id);
  if (!result) {
    body.innerHTML = `<div class="adm-error">Asset matching local index data corrupted bsdk.</div>`;
    return;
  }

  const { asset, related } = result;
  StockState.currentAsset = asset;

  const isWished = StockState.wishlist.has(asset.id);
  const priceText = asset.priceType === 'free' ? 'FREE' : `₹${asset.priceAmount}`;
  const priceClass = asset.priceType === 'free' ? 'free' : 'paid';

  // Format comma separated features from sheet dynamically bsdk
  const featuresHtml = asset.features ? String(asset.features).split(',').map(f => `<li class="adm-feature-item">✓ ${escHtml(f.trim())}</li>`).join('') : '';

  const relatedHtml = related.slice(0, 4).map(r => `
    <div class="adm-related-card" onclick="openDetailModal('${r.id}')">
      <div class="adm-related-thumb">${r.emoji || '📦'}</div>
      <div class="adm-related-info">
        <div class="adm-related-title">${escHtml(r.title)}</div>
        <div class="adm-related-price ${r.priceType === 'free' ? 'free' : 'paid'}">${r.priceType === 'free' ? 'FREE' : `₹${r.priceAmount}`}</div>
      </div>
    </div>
  `).join('');

  body.innerHTML = `
    <div class="adm-layout">
      <div class="adm-preview-col">
        <div class="adm-thumb-main">
          ${asset.thumbnailId ? `<img src="https://docs.google.com/uc?export=download&id=${asset.thumbnailId}" class="adm-thumb-img">` : `<div class="adm-thumb-emoji">${asset.emoji || '📦'}</div>`}
        </div>
        <div class="adm-file-info">
          <div class="adm-fi-row"><span>Format</span><strong>${escHtml(asset.format || asset.fileType)}</strong></div>
          <div class="adm-fi-row"><span>Size</span><strong>${escHtml(asset.size || 'N/A')}</strong></div>
          <div class="adm-fi-row"><span>Files Count</span><strong>${asset.files || 1}</strong></div>
          <div class="adm-fi-row"><span>License</span><strong>${asset.license === 'commercial' ? '✅ Commercial' : '👤 Personal'}</strong></div>
          <div class="adm-fi-row"><span>By</span><strong>${escHtml(asset.author || 'TyagiHub Edu')}</strong></div>
        </div>
      </div>
      <div class="adm-details-col">
        <div class="adm-title-row">
          <h2 class="adm-title">${escHtml(asset.title)}</h2>
          <button class="adm-wish-btn ${isWished ? 'active' : ''}" onclick="toggleWish(event,'${asset.id}',this)">
            ${isWished ? '❤️ Saved' : '🤍 Save'}
          </button>
        </div>
        <div class="adm-price-box">
          <div class="adm-price ${priceClass}">${priceText}</div>
        </div>
        <p class="adm-desc">${escHtml(asset.description)}</p>
        ${featuresHtml ? `<div class="adm-features"><ul class="adm-feature-list">${featuresHtml}</ul></div>` : ''}
        <div class="adm-cta-row">
          <button class="adm-btn adm-btn--primary" id="adm-download-btn" onclick="handleDownload(event,'${asset.id}')">
            ⬇ ${asset.priceType === 'free' ? 'Download Free' : `Buy & Download — ₹${asset.priceAmount}`}
          </button>
        </div>
      </div>
    </div>
    ${relatedHtml ? `<div class="adm-related-section"><div class="adm-section-label">Related Items</div><div class="adm-related-grid">${relatedHtml}</div></div>` : ''}
  `;
}

function closeDetailModal() {
  const modal = document.getElementById('asset-detail-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
  StockState.currentAsset = null;
}

/* ============================================================
   BYPASS-PROOF DOWNLOAD & TWO-INPUT SEMI-REAL PAYMENT FLOW
   ============================================================ */
window.handleDownload = async function(event, id) {
  if (event) event.stopPropagation();

  const target = StockState.allFetchedData.find(a => a.id == id);
  if (!target) return;

  if (target.priceType === 'free') {
    await executeSecureStream(target, '', '');
  } else {
    openPaymentModal(target);
  }
};

function openPaymentModal(asset) {
  document.getElementById('payment-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'payment-modal';
  modal.className = 'payment-modal';
  modal.innerHTML = `
    <div class="pm-overlay" id="pm-overlay"></div>
    <div class="pm-box" role="dialog" aria-modal="true">
      <button class="pm-close" id="pm-close">✕</button>
      <div class="pm-header">
        <div class="pm-asset-emoji">${asset.emoji || '💎'}</div>
        <div>
          <div class="pm-asset-title">${escHtml(asset.title)}</div>
          <div class="pm-asset-price">₹${asset.priceAmount}</div>
        </div>
      </div>
      <div class="pm-qr-section">
        <div class="pm-qr-placeholder">
          <div class="pm-qr-icon">📱</div>
          <div class="pm-qr-text">Scan QR to Pay via UPI</div>
          <div class="pm-qr-box">
             <div style="padding:12px; font-size:13px; color:var(--clr-text-2);">
               UPI ID: <strong style="color:var(--clr-accent);">tyagihub@upi</strong><br>
               Amount: <strong>₹${asset.priceAmount}</strong>
             </div>
          </div>
        </div>
      </div>
      
      <!-- 🛠️ TWO INPUT FLOW SETUP BSDK -->
      <div class="pm-code-section" style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <label class="pm-code-label">1. Contact Mobile / Email Address</label>
          <input id="pm-user-input" class="pm-code-input" type="text" placeholder="Enter your mobile or email" style="letter-spacing:0; font-family:inherit;">
        </div>
        <div>
          <label class="pm-code-label">2. UPI Transaction ID / Reference No.</label>
          <input id="pm-tx-input" class="pm-code-input" type="text" placeholder="12-digit UPI Transaction Ref ID" maxlength="30">
        </div>
        <div class="pm-error" id="pm-error" style="display:none; color:var(--clr-danger);"></div>
      </div>

      <button class="pm-submit-btn" id="pm-submit-btn" style="margin-top:16px;">Verify TxID &amp; Download</button>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('open'), 10);

  document.getElementById('pm-overlay').addEventListener('click', () => modal.remove());
  document.getElementById('pm-close').addEventListener('click', () => modal.remove());

  document.getElementById('pm-submit-btn').addEventListener('click', async () => {
    const userInput = document.getElementById('pm-user-input').value.trim();
    const txInput = document.getElementById('pm-tx-input').value.trim();
    const errorEl = document.getElementById('pm-error');

    if (!userInput || !txInput) {
      errorEl.textContent = "Both Inputs are mandatory bsdk!";
      errorEl.style.display = "block";
      return;
    }
    
    errorEl.style.display = "none";
    const submitBtn = document.getElementById('pm-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying Transaction Log...";

    const success = await executeSecureStream(asset, userInput, txInput);
    if (success) {
      setTimeout(() => modal.remove(), 1000);
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = "Verify TxID & Download";
    }
  });
}

/**
 * 🔥 VIRTUAL BLOB CONVERSION STREAM PIPELINE (Bypass Proof)
 */
async function executeSecureStream(asset, userIdentifier, txId) {
  const downloadBtn = document.getElementById('adm-download-btn');
  const errorEl = document.getElementById('pm-error');
  
  if (downloadBtn) { downloadBtn.disabled = true; downloadBtn.innerHTML = '⏳ Stream Building...'; }

  try {
    const params = new URLSearchParams({
      action: 'streamAsset',
      fileId: asset.driveFileId,
      assetId: asset.id,
      user: userIdentifier,
      txId: txId,
      type: asset.priceType
    });

    // Hit the live Google Apps Script web app URL
    const response = await fetch(`${GAS_API_URL}?${params}`);
    const streamPayload = await response.text();

    if (streamPayload.startsWith("Error")) {
      if (errorEl) {
        errorEl.textContent = streamPayload.replace("Error:", "");
        errorEl.style.display = "block";
      } else {
        alert(streamPayload);
      }
      return false;
    }

    // Binary decryption loop (Base64 data decryption)
    const byteCharacters = atob(streamPayload);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    let mimeType = 'application/octet-stream';
    if (asset.fileType === 'pdf') mimeType = 'application/pdf';
    if (asset.fileType === 'video') mimeType = 'video/mp4';

    const fileBlob = new Blob([byteArray], { type: mimeType });
    const virtualBlobUrl = URL.createObjectURL(fileBlob);

    // Dynamic virtual download simulation
    const a = document.createElement('a');
    a.href = virtualBlobUrl;
    a.download = asset.title;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(virtualBlobUrl), 200);
    return true;

  } catch (err) {
    console.error(err);
    if (errorEl) {
      errorEl.textContent = "Network trace dropped by Google firewall.";
      errorEl.style.display = "block";
    }
    return false;
  } finally {
    if (downloadBtn) { downloadBtn.disabled = false; downloadBtn.innerHTML = `⬇ ${asset.priceType === 'free' ? 'Download Free' : 'Download Premium'}`; }
  }
}

/* ============================================================
   PAGINATION, WISHLIST, AND FILTERS EVENT LISTENERS
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

window.toggleWish = function(event, id, btn) {
  if (event) event.stopPropagation();
  id = parseInt(id);

  if (StockState.wishlist.has(id)) {
    StockState.wishlist.delete(id);
    if (btn) { btn.innerHTML = btn.id === 'adm-wish-btn' ? '🤍 Save' : '🤍'; btn.classList.remove('active'); }
  } else {
    StockState.wishlist.add(id);
    if (btn) { btn.innerHTML = btn.id === 'adm-wish-btn' ? '❤️ Saved' : '❤️'; btn.classList.add('active'); }
  }
  localStorage.setItem('th-stock-wishlist', JSON.stringify([...StockState.wishlist]));
};

function renderActiveChips() {
  const el = document.getElementById('active-filters');
  if (!el) return;
  const chips = [];
  if (StockState.priceType !== 'all') chips.push({ label: StockState.priceType === 'free' ? '✓ Free' : '✓ Paid', key: 'priceType' });
  StockState.fileTypes.forEach(t => chips.push({ label: `Type: ${t.toUpperCase()}`, key: `type:${t}` }));
  if (StockState.category !== 'all') chips.push({ label: `Category: ${StockState.category}`, key: 'category' });
  if (StockState.searchQuery) chips.push({ label: `"${StockState.searchQuery}"`, key: 'search' });

  el.innerHTML = chips.map(c => `<button class="active-filter-chip" onclick="removeFilter('${c.key}')">${escHtml(c.label)} <span class="active-filter-chip__remove">✕</span></button>`).join('');
}

window.removeFilter = function(key) {
  if (key === 'priceType') { StockState.priceType = 'all'; document.querySelectorAll('.price-toggle__btn').forEach(b => b.classList.toggle('active', b.dataset.val === 'all')); }
  else if (key === 'category') { StockState.category = 'all'; document.querySelectorAll('.stock-catbar__item').forEach(el => el.classList.toggle('active', el.dataset.cat === 'all')); }
  else if (key === 'search') { StockState.searchQuery = ''; const si = document.getElementById('stock-search-input'); if (si) si.value = ''; }
  else if (key.startsWith('type:')) { const t = key.split(':')[1]; StockState.fileTypes.delete(t); document.querySelectorAll(`input[data-type="${t}"]`).forEach(cb => cb.checked = false); }
  StockState.page = 1; loadAssets();
};

document.addEventListener('DOMContentLoaded', () => {
  loadAssets();

  // Category Bar Binding
  document.querySelectorAll('.stock-catbar__item').forEach(el => {
    el.addEventListener('click', () => {
      StockState.category = el.dataset.cat || 'all';
      StockState.page = 1;
      document.querySelectorAll('.stock-catbar__item').forEach(i => i.classList.toggle('active', i.dataset.cat === StockState.category));
      loadAssets();
    });
  });

  // Price Toggles
  document.querySelectorAll('.price-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.price-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      StockState.priceType = btn.dataset.val;
      StockState.page = 1;
      loadAssets();
    });
  });

  // Checkboxes for formats
  document.querySelectorAll('input[data-type]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) StockState.fileTypes.add(cb.dataset.type);
      else StockState.fileTypes.delete(cb.dataset.type);
      StockState.page = 1;
      loadAssets();
    });
  });

  // Sorting Handler
  const sortSelect = document.getElementById('stock-sort');
  sortSelect?.addEventListener('change', () => {
    StockState.sortBy = sortSelect.value;
    StockState.page = 1;
    loadAssets();
  });

  // View Layout Toggles (Grid/List)
  document.querySelectorAll('.view-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      StockState.view = btn.dataset.view;
      loadAssets();
    });
  });

  // Search Engine Buffering
  let searchTimer;
  document.getElementById('stock-search-input')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      StockState.searchQuery = e.target.value;
      StockState.page = 1;
      loadAssets();
    }, 350);
  });
});
