/**
 * TyagiHub Tools — Dedicated JavaScript
 * Tyagi MultiTech
 * ============================================================
 * File: assets/js/tools.js
 * Features:
 *   1. Live search filter
 *   2. Category filter (pill buttons)
 *   3. Favorites / star system (localStorage)
 *   4. Tool page: drag & drop upload
 *   5. Tool page: progress simulation
 *   6. Tool page: file list management
 * ============================================================
 */

'use strict';

/* ============================================================
   TOOL DATA — All tools catalog
   [BACKEND-HOOK]: Replace with GET /api/v1/tools
   ============================================================ */
const TOOLS_DATA = [
  /* PDF */
  { id:'pdf-compress',   name:'Compress PDF',       emoji:'📦', category:'pdf',      url:'/tools/pdf/compress/',    desc:'Reduce PDF file size',           isNew:false, color:'#f5a623' },
  { id:'pdf-merge',      name:'Merge PDF',          emoji:'🔗', category:'pdf',      url:'/tools/pdf/merge/',       desc:'Combine multiple PDFs',          isNew:false, color:'#f5a623' },
  { id:'pdf-split',      name:'Split PDF',          emoji:'✂️', category:'pdf',      url:'/tools/pdf/split/',       desc:'Split PDF into pages',           isNew:false, color:'#f5a623' },
  { id:'pdf-rotate',     name:'Rotate PDF',         emoji:'🔄', category:'pdf',      url:'/tools/pdf/rotate/',      desc:'Rotate PDF pages',               isNew:false, color:'#f5a623' },
  { id:'pdf-unlock',     name:'Unlock PDF',         emoji:'🔓', category:'pdf',      url:'/tools/pdf/unlock/',      desc:'Remove PDF password',            isNew:false, color:'#f5a623' },
  { id:'pdf-protect',    name:'Protect PDF',        emoji:'🔐', category:'pdf',      url:'/tools/pdf/protect/',     desc:'Add password to PDF',            isNew:false, color:'#f5a623' },
  { id:'pdf-to-word',    name:'PDF to Word',        emoji:'📝', category:'pdf',      url:'/tools/pdf/pdf-to-word/', desc:'Convert PDF to DOCX',            isNew:false, color:'#f5a623' },
  { id:'pdf-to-jpg',     name:'PDF to JPG',         emoji:'🖼️', category:'pdf',      url:'/tools/pdf/pdf-to-jpg/',  desc:'Convert PDF pages to images',    isNew:false, color:'#f5a623' },
  { id:'jpg-to-pdf',     name:'JPG to PDF',         emoji:'📄', category:'pdf',      url:'/tools/pdf/jpg-to-pdf/',  desc:'Images to PDF',                  isNew:true,  color:'#f5a623' },
  { id:'pdf-to-ppt',     name:'PDF to PPT',         emoji:'📊', category:'pdf',      url:'/tools/pdf/pdf-to-ppt/',  desc:'Convert PDF to PowerPoint',      isNew:true,  color:'#f5a623' },
  { id:'pdf-edit',       name:'Edit PDF',           emoji:'✏️', category:'pdf',      url:'/tools/pdf/edit/',        desc:'Add text, images to PDF',        isNew:false, color:'#f5a623' },

  /* IMAGE */
  { id:'img-compress',   name:'Compress Image',     emoji:'📦', category:'image',    url:'/tools/image/compress/',  desc:'Reduce image size',              isNew:false, color:'#a78bfa' },
  { id:'img-resize',     name:'Resize Image',       emoji:'📐', category:'image',    url:'/tools/image/resize/',    desc:'Resize to any dimension',        isNew:false, color:'#a78bfa' },
  { id:'img-convert',    name:'Convert Image',      emoji:'🔄', category:'image',    url:'/tools/image/convert/',   desc:'PNG, JPG, WebP, AVIF',           isNew:false, color:'#a78bfa' },
  { id:'img-bg-remove',  name:'Remove BG',          emoji:'🎭', category:'image',    url:'/tools/image/bg-remove/', desc:'Remove image background',        isNew:true,  color:'#a78bfa' },
  { id:'img-crop',       name:'Crop Image',         emoji:'✂️', category:'image',    url:'/tools/image/crop/',      desc:'Crop to any ratio',              isNew:false, color:'#a78bfa' },

  /* CONVERT */
  { id:'word-to-pdf',    name:'Word to PDF',        emoji:'📝', category:'convert',  url:'/tools/convert/',         desc:'DOCX to PDF',                    isNew:false, color:'#3ecfcf' },
  { id:'ppt-to-pdf',     name:'PPT to PDF',         emoji:'📊', category:'convert',  url:'/tools/convert/',         desc:'PowerPoint to PDF',              isNew:false, color:'#3ecfcf' },
  { id:'excel-to-pdf',   name:'Excel to PDF',       emoji:'📈', category:'convert',  url:'/tools/convert/',         desc:'Spreadsheet to PDF',             isNew:false, color:'#3ecfcf' },
  { id:'html-to-pdf',    name:'HTML to PDF',        emoji:'🌐', category:'convert',  url:'/tools/convert/',         desc:'Webpage to PDF',                 isNew:true,  color:'#3ecfcf' },

  /* TEXT */
  { id:'word-counter',   name:'Word Counter',       emoji:'📝', category:'text',     url:'/tools/text/word-counter/',desc:'Count words & characters',       isNew:false, color:'#34d399' },
  { id:'case-converter', name:'Case Converter',     emoji:'🔡', category:'text',     url:'/tools/text/',            desc:'UPPER, lower, Title case',       isNew:false, color:'#34d399' },
  { id:'lorem-ipsum',    name:'Lorem Ipsum',        emoji:'📜', category:'text',     url:'/tools/text/',            desc:'Placeholder text generator',     isNew:false, color:'#34d399' },
  { id:'text-compare',   name:'Text Compare',       emoji:'🔍', category:'text',     url:'/tools/text/',            desc:'Compare two texts',              isNew:true,  color:'#34d399' },

  /* SECURITY */
  { id:'password-gen',   name:'Password Gen',       emoji:'🔐', category:'security', url:'/tools/security/password-generator/', desc:'Strong passwords',      isNew:false, color:'#f87171' },
  { id:'qr-generator',   name:'QR Generator',       emoji:'📱', category:'security', url:'/tools/security/qr-generator/',       desc:'Create QR codes',       isNew:false, color:'#f87171' },
  { id:'hash-gen',       name:'Hash Generator',     emoji:'#️⃣', category:'security', url:'/tools/security/',                    desc:'MD5, SHA256 hash',      isNew:true,  color:'#f87171' },
  { id:'color-picker',   name:'Color Picker',       emoji:'🎨', category:'security', url:'/tools/security/',                    desc:'Pick & convert colors', isNew:false, color:'#60a5fa' },
];

const FAVORITES_KEY = 'th-tool-favorites';
let favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
let currentCat = 'all';
let searchQuery = '';

/* ============================================================
   RENDER
   ============================================================ */
function getFiltered() {
  return TOOLS_DATA.filter(t => {
    const matchCat  = currentCat === 'all' || t.category === currentCat;
    const q = searchQuery.toLowerCase();
    const matchQ = !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.category.includes(q);
    return matchCat && matchQ;
  });
}

function renderTools() {
  const container = document.getElementById('tools-container');
  const emptyEl   = document.getElementById('tools-empty');
  if (!container) return;

  const filtered = getFiltered();

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyEl && (emptyEl.style.display = 'block');
    return;
  }

  emptyEl && (emptyEl.style.display = 'none');

  if (currentCat === 'all' && !searchQuery) {
    renderByCategory(container, filtered);
  } else {
    renderFlat(container, filtered);
  }
}

function renderByCategory(container, tools) {
  const cats = [
    { key: 'pdf',      label: 'PDF Tools',       icon: '📄', color: '#f5a623' },
    { key: 'image',    label: 'Image Tools',      icon: '🖼️', color: '#a78bfa' },
    { key: 'convert',  label: 'Convert',          icon: '🔄', color: '#3ecfcf' },
    { key: 'text',     label: 'Text Tools',       icon: '📝', color: '#34d399' },
    { key: 'security', label: 'Security & Utils', icon: '🔐', color: '#f87171' },
  ];

  container.innerHTML = cats.map(cat => {
    const catTools = tools.filter(t => t.category === cat.key);
    if (!catTools.length) return '';
    return `
      <div class="tools-section" data-cat="${cat.key}">
        <div class="tools-section-header">
          <div class="tools-section-title">
            <div class="tools-section-icon" style="background:${cat.color}22;">${cat.icon}</div>
            ${cat.label}
            <span class="tools-section-count">(${catTools.length})</span>
          </div>
          <a href="/tools/${cat.key}/" class="tools-section-viewall">View all →</a>
        </div>
        <div class="tools-grid">
          ${catTools.map(t => renderToolItem(t)).join('')}
        </div>
      </div>
    `;
  }).join('');

  bindStars();
}

function renderFlat(container, tools) {
  container.innerHTML = `
    <div class="tools-section">
      <div class="tools-section-header">
        <div class="tools-section-title">
          ${searchQuery ? `🔍 Results for "${searchQuery}"` : currentCat.toUpperCase() + ' Tools'}
          <span class="tools-section-count">(${tools.length})</span>
        </div>
      </div>
      <div class="tools-grid">
        ${tools.map(t => renderToolItem(t)).join('')}
      </div>
    </div>
  `;
  bindStars();
}

function renderToolItem(t) {
  const isStarred = favorites.has(t.id);
  return `
    <a href="${t.url}" class="tool-item" style="--tool-color:${t.color};" title="${t.name} — ${t.desc}">
      ${t.isNew ? '<span class="tool-item__new">New</span>' : ''}
      <button class="tool-item__star ${isStarred ? 'starred' : ''}"
              data-id="${t.id}"
              onclick="toggleStar(event, '${t.id}')"
              title="${isStarred ? 'Remove from favorites' : 'Add to favorites'}"
              aria-label="Favorite">
        ${isStarred ? '⭐' : '☆'}
      </button>
      <span class="tool-item__emoji">${t.emoji}</span>
      <span class="tool-item__name">${t.name}</span>
    </a>
  `;
}

function bindStars() {
  // Stars are handled via onclick inline
}

window.toggleStar = function(e, id) {
  e.preventDefault();
  e.stopPropagation();
  const btn = e.currentTarget;
  if (favorites.has(id)) {
    favorites.delete(id);
    btn.textContent = '☆';
    btn.classList.remove('starred');
    window.TyagiHub?.Toast.show('Removed from favorites', 'info');
  } else {
    favorites.add(id);
    btn.textContent = '⭐';
    btn.classList.add('starred');
    window.TyagiHub?.Toast.show('Added to favorites! ⭐', 'success');
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
};

/* ============================================================
   TOOL PAGE — Upload / Drop Zone
   ============================================================ */
function initToolPage() {
  const dropzone = document.getElementById('tool-dropzone');
  const fileInput = document.getElementById('tool-file-input');
  const fileList  = document.getElementById('tool-filelist');
  const settings  = document.getElementById('tool-settings');
  const actionBar = document.getElementById('tool-action-bar');
  const processBtn= document.getElementById('tool-process-btn');
  const progress  = document.getElementById('tool-progress');
  const progressFill = document.getElementById('tool-progress-fill');
  const progressLabel = document.getElementById('tool-progress-label');
  const result    = document.getElementById('tool-result');

  if (!dropzone) return;

  let uploadedFiles = [];

  // Click to upload
  dropzone.addEventListener('click', () => fileInput?.click());

  // Drag over
  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles([...e.dataTransfer.files]);
  });

  fileInput?.addEventListener('change', () => {
    handleFiles([...fileInput.files]);
  });

  function handleFiles(files) {
    if (!files.length) return;
    uploadedFiles = files;

    // Show file list
    if (fileList) {
      fileList.classList.add('visible');
      fileList.innerHTML = files.map((f, i) => `
        <div class="tool-fileitem" id="file-${i}">
          <span class="tool-fileitem__icon">${getFileIcon(f.name)}</span>
          <span class="tool-fileitem__name">${f.name}</span>
          <span class="tool-fileitem__size">${formatSize(f.size)}</span>
          <button class="tool-fileitem__remove" onclick="removeFile(${i})" title="Remove">✕</button>
        </div>
      `).join('');
    }

    // Show settings and action bar
    settings?.classList.add('visible');
    actionBar && (actionBar.style.display = 'flex');
  }

  window.removeFile = function(index) {
    const el = document.getElementById(`file-${index}`);
    el?.remove();
    uploadedFiles.splice(index, 1);
    if (uploadedFiles.length === 0) {
      fileList?.classList.remove('visible');
      settings?.classList.remove('visible');
    }
  };

  // Process button
  processBtn?.addEventListener('click', () => {
    if (!uploadedFiles.length) return;

    // Show progress
    progress?.classList.add('visible');
    if (actionBar) actionBar.style.display = 'none';

    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.random() * 15 + 5;
      if (pct > 100) pct = 100;
      if (progressFill) progressFill.style.width = pct + '%';
      if (progressLabel) progressLabel.textContent = pct < 100 ? `Processing... ${Math.round(pct)}%` : 'Done!';

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          progress?.classList.remove('visible');
          result?.classList.add('visible');
          // [BACKEND-HOOK]: Replace simulation with real API call
          // POST /api/v1/tools/{tool-id}/process (FormData with files)
        }, 400);
      }
    }, 200);
  });
}

/* ============================================================
   HELPERS
   ============================================================ */
function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const icons = { pdf:'📄', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', webp:'🖼️', gif:'🖼️',
                  doc:'📝', docx:'📝', ppt:'📊', pptx:'📊', xls:'📈', xlsx:'📈',
                  mp4:'🎬', mov:'🎬', avi:'🎬', mp3:'🎵', zip:'📦' };
  return icons[ext] || '📁';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // Tools directory page
  if (document.getElementById('tools-container')) {
    renderTools();

    // Category filter pills
    document.querySelectorAll('.tools-catstrip__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tools-catstrip__btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCat = btn.dataset.cat || 'all';
        renderTools();
      });
    });

    // Live search
    let timer;
    document.getElementById('tools-search-input')?.addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        searchQuery = e.target.value;
        renderTools();
      }, 250);
    });
  }

  // Individual tool page
  initToolPage();
});
