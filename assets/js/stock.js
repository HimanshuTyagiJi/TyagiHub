/**
 * TyagiHub Stock — Production Core Controller (V7 100% COMPLETE NO BUCK PASSING BLOCK)
 * File: assets/js/stock.js
 * ============================================================================
 */

'use strict';

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzATRipYC43WMEnXY5BBF0uZOkSWVW9WFYpZzR6eqZUgsAfCW0qNMUnmP3Aemu8gvlY/exec';

const StockState = {
  category: 'all',
  priceType: 'all',
  fileTypes: new Set(),
  sortBy: 'popular',
  view: 'grid',
  searchQuery: '',
  page: 1,
  perPage: 12, 
  totalAssets: 0,
  totalPages: 1,
  allFetchedData: [],
  wishlist: new Set(JSON.parse(localStorage.getItem('th-stock-wishlist') || '[]')),
  isLoading: false,
  currentAsset: null,
};

const MimeMap = {
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'doc': 'application/msword',
  'mp4': 'video/mp4',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'svg': 'image/svg+xml',
  'zip': 'application/zip',
  'ppt': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

// Helper function to extract drive ID on frontend layer securely bsdk
function getCleanDriveId(linkOrId) {
  let cleanId = String(linkOrId || '').trim();
  if (cleanId.includes('http')) {
    if (cleanId.includes('id=')) {
      cleanId = cleanId.split('id=')[1].split('&')[0];
    } else if (cleanId.includes('/d/')) {
      cleanId = cleanId.split('/d/')[1].split('/')[0];
    } else if (cleanId.includes('folders/')) {
      cleanId = cleanId.split('folders/')[1].split('?')[0];
    }
  }
  return cleanId;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function loadAssets() {
  if (StockState.isLoading) return;
  StockState.isLoading = true;
  showSkeletons();

  try {
    if (StockState.allFetchedData.length === 0) {
      const response = await fetch(`${GAS_API_URL}?action=getAssets`, {
        method: "GET",
        redirect: "follow"
      });
      if (!response.ok) throw new Error('Spreadsheet network refusal.');
      StockState.allFetchedData = await response.json();
    }

    let filtered = StockState.allFetchedData.filter(asset => {
      const matchCat = StockState.category === 'all' || asset.category === StockState.category;
      const matchPrice = StockState.priceType === 'all' || asset.priceType === StockState.priceType;
      const matchType = StockState.fileTypes.size === 0 || StockState.fileTypes.has(asset.fileType);
      
      const q = StockState.searchQuery.toLowerCase();
      const matchSearch = !StockState.searchQuery || 
                          String(asset.title).toLowerCase().includes(q) ||
                          String(asset.description).toLowerCase().includes(q);
      return matchCat && matchPrice && matchType && matchSearch;
    });

    if (StockState.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    } else if (StockState.sortBy === 'name-asc') {
      filtered.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    } else if (StockState.sortBy === 'name-desc') {
      filtered.sort((a, b) => String(b.title).localeCompare(String(a.title)));
    } else {
      filtered.sort((a, b) => (parseInt(b.popularity) || 0) - (parseInt(a.popularity) || 0));
    }

    StockState.totalAssets = filtered.length;
    StockState.totalPages = Math.ceil(filtered.length / StockState.perPage) || 1;
    
    const startIndex = (StockState.page - 1) * StockState.perPage;
    const paginatedData = filtered.slice(startIndex, startIndex + StockState.perPage);

    renderGrid(paginatedData);
    renderPagination();
    renderActiveChips();

    const countEl = document.getElementById('result-count');
    if (countEl) countEl.textContent = StockState.totalAssets.toLocaleString('en-IN');

    checkUrlParams();

  } catch (err) {
    console.error('[Stock Engine Error]:', err);
    showError('Connection dropped. Please refresh the page.');
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
}

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
      if (e.target.closest('.asset-card__wish')) return;
      
      const assetId = card.dataset.id;
      const targetAsset = StockState.allFetchedData.find(a => a.id == assetId);
      
      if (targetAsset) {
        const titleSlug = slugify(targetAsset.title);
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?item=' + titleSlug;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
      
      openDetailModal(assetId);
    });
  });
}

/**
 * 🔒 BRAHMASTRA THUMBNAIL EXTRACTOR ENGINE BSDK
 * Multi-layered dynamic cross-origin preview injector.
 */
function getThumbnailHtml(asset, className = 'asset-card__img') {
  let rawSource = String(asset.thumbnailId || asset.driveFileId || '').trim();
  
  if (!rawSource) {
    return `<div class="asset-card__thumb-placeholder">${asset.emoji || '📦'}</div>`;
  }
  
  if (rawSource.startsWith('assets/')) {
    return `<img src="${rawSource}" class="${className}" alt="${asset.title}" loading="lazy">`;
  }
  
  const targetId = getCleanDriveId(rawSource);
  
  return `
    <img src="https://docs.google.com/uc?export=view&id=${targetId}" 
         class="${className}" 
         alt="${asset.title}" 
         loading="lazy" 
         onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/d/${targetId}=w600-h400-p'; this.onerror=function(){this.onerror=null; this.parentNode.innerHTML='<div class=&quot;asset-card__thumb-placeholder&quot;>${getTypeIcon(asset.fileType)}</div>'};">
  `;
}

function renderCard(asset) {
  const isWished = StockState.wishlist.has(asset.id);
  const priceText = asset.priceType === 'free' ? 'FREE' : `₹${asset.priceAmount}`;
  const priceClass = asset.priceType === 'free' ? 'free' : 'paid';

  return `
    <div class="asset-card" data-id="${asset.id}" role="article" tabindex="0" style="cursor: pointer;">
      <div class="asset-card__thumb">
        ${getThumbnailHtml(asset)}
        <div class="asset-badge-container" style="position:absolute; top:8px; left:8px;"><span class="asset-badge asset-badge--${asset.priceType}">${asset.priceType === 'free' ? 'Free' : 'Paid'}</span></div>
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

function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemSlug = urlParams.get('item');
  
  if (itemSlug) {
    const targetAsset = StockState.allFetchedData.find(a => slugify(a.title) === itemSlug);
    if (targetAsset) {
      openDetailModal(targetAsset.id);
    }
  }
}

function showError(msg) {
  const grid = document.getElementById('asset-grid');
  if (grid) grid.innerHTML = `<div style="padding:2rem;color:var(--clr-danger);grid-column:1/-1;">${msg}</div>`;
}

function getTypeIcon(type) {
  const icons = { svg: '🔷', image: '🖼️', video: '🎬', pdf: '📄', ppt: '📊', docx: '📝', doc: '📝', zip: '📦', other: '📦' };
  return icons[type] || '📦';
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

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
    body.innerHTML = `<div class="adm-error">Data synchronization issue.</div>`;
    return;
  }

  const { asset, related } = result;
  StockState.currentAsset = asset;

  const isWished = StockState.wishlist.has(asset.id);
  const priceText = asset.priceType === 'free' ? 'FREE' : `₹${asset.priceAmount}`;
  const priceClass = asset.priceType === 'free' ? 'free' : 'paid';

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
          ${getThumbnailHtml(asset, 'adm-thumb-img')}
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
          <button class="adm-btn adm-btn--primary" id="adm-download-btn" onclick="handleDownload(event,'${asset.id}', this)">
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
  
  const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
  window.history.pushState({ path: cleanUrl }, '', cleanUrl);
}

window.handleDownload = async function(event, id, element) {
  if (event) event.stopPropagation();

  const target = StockState.allFetchedData.find(a => a.id == id);
  if (!target) return;

  if (target.priceType === 'free') {
    if (String(target.driveFileId).startsWith('http') && !target.driveFileId.includes('drive.google.com')) {
      updateButtonLoading(element, true);
      const a = document.createElement('a');
      a.href = target.driveFileId;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => updateButtonLoading(element, false), 800);
    } else {
      await executeSecureStream(target, 'Free_Guest', 'N/A', element);
    }
  } else {
    openPaymentModal(target, element);
  }
};

function updateButtonLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';
    btn.dataset.oldHtml = btn.innerHTML;
    btn.innerHTML = '⏳ Processing Download Chunks...';
  } else {
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
    btn.innerHTML = btn.dataset.oldHtml || '⬇ Download';
  }
}

function openPaymentModal(asset, triggerOriginBtn) {
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
             <div style="padding:12px; font-size:13px; color:var(--clr-text-2); text-align:center;">
               UPI ID: <strong style="color:var(--clr-accent);">tyagihub@upi</strong><br>
               Amount: <strong>₹${asset.priceAmount}</strong>
             </div>
          </div>
        </div>
      </div>
      
      <div class="pm-code-section" style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <label class="pm-code-label">1. Contact Mobile / Email Address</label>
          <input id="pm-user-input" class="pm-code-input" type="text" placeholder="Enter your mobile or email" style="letter-spacing:0;">
        </div>
        <div>
          <label class="pm-code-label">2. UPI Transaction ID / Reference No.</label>
          <input id="pm-tx-input" class="pm-code-input" type="text" placeholder="12-digit UPI Transaction Ref ID" maxlength="30">
        </div>
        <div class="pm-error" id="pm-error" style="display:none; color:var(--clr-danger); font-size:12px; margin-top:4px;"></div>
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
      errorEl.textContent = "Both inputs are required.";
      errorEl.style.display = "block";
      return;
    }
    
    errorEl.style.display = "none";
    const submitBtn = document.getElementById('pm-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying Transaction Log...";

    const success = await executeSecureStream(asset, userInput, txInput, triggerOriginBtn);
    if (success) {
      setTimeout(() => modal.remove(), 800);
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = "Verify TxID & Download";
    }
  });
}

async function executeSecureStream(asset, userIdentifier, txId, triggerOriginBtn) {
  const mainModalDownloadBtn = document.getElementById('adm-download-btn');
  const errorEl = document.getElementById('pm-error');
  
  updateButtonLoading(triggerOriginBtn, true);
  if (mainModalDownloadBtn) { mainModalDownloadBtn.disabled = true; mainModalDownloadBtn.innerHTML = '⏳ Processing Byte Pipeline...'; }

  try {
    const params = new URLSearchParams({
      action: 'streamAsset',
      fileId: asset.driveFileId,
      assetId: asset.id,
      user: userIdentifier,
      txId: txId,
      type: asset.priceType
    });

    const response = await fetch(`${GAS_API_URL}?${params}`, {
      method: "GET",
      redirect: "follow"
    });
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

    const byteCharacters = atob(streamPayload);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    let targetExt = String(asset.format || 'docx').toLowerCase().trim();
    if (targetExt.includes('png')) targetExt = 'png';
    else if (targetExt.includes('jpg') || targetExt.includes('jpeg')) targetExt = 'jpg';
    else if (targetExt.includes('svg')) targetExt = 'svg';
    else if (targetExt.includes('mp4') || targetExt.includes('video')) targetExt = 'mp4';
    else if (targetExt.includes('pdf')) targetExt = 'pdf';
    else if (targetExt.includes('zip')) targetExt = 'zip';
    else if (targetExt.includes('doc') || targetExt.includes('word')) targetExt = 'docx';
    else if (targetExt.includes('ppt') || targetExt.includes('powerpoint')) targetExt = 'pptx';
    else targetExt = 'docx';

    const detectedMime = MimeMap[targetExt] || 'application/octet-stream';
    const fileBlob = new Blob([byteArray], { type: detectedMime });
    const virtualBlobUrl = URL.createObjectURL(fileBlob);

    const a = document.createElement('a');
    a.href = virtualBlobUrl;
    
    const cleanTitle = String(asset.title).replace(/\.[^/.]+$/, "");
    a.download = `${cleanTitle}.${targetExt}`;
    
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(virtualBlobUrl), 200);
    return true;

  } catch (err) {
    console.error(err);
    if (errorEl) {
      errorEl.textContent = "Network trace dropped by Google firewall configurations.";
      errorEl.style.display = "block";
    }
    return false;
  } finally {
    updateButtonLoading(triggerOriginBtn, false);
    if (mainModalDownloadBtn) { mainModalDownloadBtn.disabled = false; mainModalDownloadBtn.innerHTML = `⬇ ${asset.priceType === 'free' ? 'Download Free' : 'Download Premium'}`; }
  }
}

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

  document.querySelectorAll('.stock-catbar__item').forEach(el => {
    el.addEventListener('click', () => {
      StockState.category = el.dataset.cat || 'all';
      StockState.page = 1;
      document.querySelectorAll('.stock-catbar__item').forEach(i => i.classList.toggle('active', i.dataset.cat === StockState.category));
      loadAssets();
    });
  });

  document.querySelectorAll('.price-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.price-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      StockState.priceType = btn.dataset.val;
      StockState.page = 1;
      loadAssets();
    });
  });

  document.querySelectorAll('input[data-type]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) StockState.fileTypes.add(cb.dataset.type);
      else StockState.fileTypes.delete(cb.dataset.type);
      StockState.page = 1;
      loadAssets();
    });
  });

  const sortSelect = document.getElementById('stock-sort');
  sortSelect?.addEventListener('change', () => {
    StockState.sortBy = sortSelect.value;
    StockState.page = 1;
    loadAssets();
  });

  document.querySelectorAll('.view-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      StockState.view = btn.dataset.view;
      loadAssets();
    });
  });

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
