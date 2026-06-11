/**
 * TyagiHub — Navbar Search
 * File: assets/js/search.js
 * ============================================================
 * Features:
 *  - Auto fetches /search.json (Jekyll auto-generates)
 *  - Fuzzy search — galat spelling pe bhi results aate hain
 *  - Keyboard navigation (↑↓ Enter ESC)
 *  - Mobile + Desktop dono pe kaam karta hai
 *  - Click bahar → band ho jata hai
 *  - / shortcut → search open
 * ============================================================
 */

'use strict';

const NavSearch = (() => {

  /* ---- State ---- */
  let allPages     = [];   // fetched from search.json
  let activeIndex  = -1;   // keyboard nav
  let isOpen       = false;

  /* ---- DOM ---- */
  const searchBtn     = document.getElementById('navbar-search-btn');
  const searchOverlay = document.getElementById('search-overlay');
  const searchBox     = document.getElementById('search-box');
  const searchInput   = document.getElementById('search-input');
  const searchClose   = document.getElementById('search-close');
  const resultsList   = document.getElementById('search-results-list');
  const noResults     = document.getElementById('search-no-results');
  const resultsHeader = document.getElementById('search-results-header');

  /* ---- Category icon + color map ---- */
  const CAT_MAP = {
    'tool-pdf':  { emoji: '📄', color: '#f5a623' },
    'Tools':     { emoji: '🔧', color: '#f5a623' },
    'learn':     { emoji: '📚', color: '#3ecfcf' },
    'Learn':     { emoji: '📚', color: '#3ecfcf' },
    'shield':    { emoji: '🛡️', color: '#f87171' },
    'Shield':    { emoji: '🛡️', color: '#f87171' },
    'apps':      { emoji: '📱', color: '#60a5fa' },
    'Apps':      { emoji: '📱', color: '#60a5fa' },
    'stock':     { emoji: '🖼️', color: '#34d399' },
    'Stock':     { emoji: '🖼️', color: '#34d399' },
    'editor':    { emoji: '✏️', color: '#a78bfa' },
    'post':      { emoji: '✍️', color: '#fb923c' },
    'default':   { emoji: '📄', color: '#606880' },
  };

  function getCat(page) {
    const key = Object.keys(CAT_MAP).find(k =>
      (page.category || '').toLowerCase().includes(k.toLowerCase()) ||
      (page.url      || '').toLowerCase().includes(k.toLowerCase())
    );
    return CAT_MAP[key] || CAT_MAP['default'];
  }

  /* ---- Fetch search.json once ---- */
  async function loadPages() {
    if (allPages.length) return;
    try {
      const res  = await fetch('/search.json');
      const data = await res.json();
      // Filter out empty/system pages
      allPages = data.filter(p =>
        p.title &&
        p.title.trim() !== '' &&
        !p.url.includes('404') &&
        !p.url.includes('search.json')
      );
    } catch(e) {
      console.warn('Search: Could not load search.json', e);
      allPages = [];
    }
  }

  /* ---- Fuzzy search (no library needed) ---- */
  function fuzzyMatch(str, query) {
    str   = str.toLowerCase();
    query = query.toLowerCase().trim();
    if (!query) return { match: true, score: 0 };

    // Exact match — highest score
    if (str.includes(query)) return { match: true, score: 100 };

    // Word boundary match
    const words = query.split(' ');
    if (words.every(w => str.includes(w))) return { match: true, score: 80 };

    // Fuzzy character sequence match
    let qi = 0;
    let score = 0;
    for (let i = 0; i < str.length && qi < query.length; i++) {
      if (str[i] === query[qi]) {
        score += (i === qi) ? 2 : 1; // bonus for positional match
        qi++;
      }
    }
    if (qi === query.length) return { match: true, score };
    return { match: false, score: 0 };
  }

  function searchPages(query) {
    if (!query.trim()) return [];

    const results = [];

    for (const page of allPages) {
      const searchable = [
        page.title       || '',
        page.description || '',
        page.keywords    || '',
        page.category    || '',
        page.url         || '',
      ].join(' ');

      const { match, score } = fuzzyMatch(searchable, query);
      if (match) {
        results.push({ ...page, score });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 8); // max 8 results
  }

  /* ---- Highlight matched text ---- */
  function highlight(text, query) {
    if (!query || !text) return text || '';
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /* ---- Render results ---- */
  function renderResults(query) {
    const results = searchPages(query);
    activeIndex   = -1;

    // Clear previous
    resultsList.innerHTML = '';

    if (!query.trim()) {
      resultsList.closest('.search-results').classList.remove('visible');
      return;
    }

    resultsList.closest('.search-results').classList.add('visible');

    if (results.length === 0) {
      noResults.classList.add('visible');
      resultsHeader && (resultsHeader.textContent = 'No results found');
      return;
    }

    noResults.classList.remove('visible');
    if (resultsHeader) {
      resultsHeader.textContent = `${results.length} result${results.length > 1 ? 's' : ''} for "${query}"`;
    }

    results.forEach((page, i) => {
      const cat  = getCat(page);
      const item = document.createElement('a');
      item.href  = page.url;
      item.className = 'search-result-item';
      item.dataset.index = i;
      item.setAttribute('role', 'option');

      item.innerHTML = `
        <div class="search-result-item__icon" style="background:${cat.color}18;">
          ${page.emoji || cat.emoji}
        </div>
        <div class="search-result-item__content">
          <div class="search-result-item__title">
            ${highlight(page.title, query)}
          </div>
          ${page.description ? `
          <div class="search-result-item__desc">
            ${page.description.substring(0, 80)}...
          </div>` : ''}
        </div>
        <span class="search-result-item__category">${page.category || 'Page'}</span>
        <span class="search-result-item__arrow">→</span>
      `;

      // Click — navigate
      item.addEventListener('click', () => {
        closeSearch();
      });

      resultsList.appendChild(item);
    });
  }

  /* ---- Keyboard navigation ---- */
  function moveActive(dir) {
    const items = resultsList.querySelectorAll('.search-result-item');
    if (!items.length) return;

    items[activeIndex]?.classList.remove('active');
    activeIndex = (activeIndex + dir + items.length) % items.length;
    const active = items[activeIndex];
    active.classList.add('active');
    active.scrollIntoView({ block: 'nearest' });
  }

  /* ---- Open / Close ---- */
  function openSearch() {
    isOpen = true;
    searchOverlay?.classList.add('open');
    searchBox?.classList.add('open');
    searchInput?.focus();
    document.body.style.overflow = 'hidden';
    loadPages(); // fetch if not loaded
  }

  function closeSearch() {
    isOpen = false;
    searchOverlay?.classList.remove('open');
    searchBox?.classList.remove('open');
    document.body.style.overflow = '';
    if (searchInput) searchInput.value = '';
    resultsList.innerHTML = '';
    resultsList.closest('.search-results')?.classList.remove('visible');
    noResults?.classList.remove('visible');
    activeIndex = -1;
  }

  /* ---- Init ---- */
  function init() {
    if (!searchBtn) return;

    // Open on button click
    searchBtn.addEventListener('click', openSearch);

    // Close on overlay click
    searchOverlay?.addEventListener('click', closeSearch);

    // Close button
    searchClose?.addEventListener('click', closeSearch);

    // Input — live search
    let timer;
    searchInput?.addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => renderResults(e.target.value), 200);
    });

    // Keyboard
    searchInput?.addEventListener('keydown', e => {
      switch(e.key) {
        case 'Escape':
          closeSearch();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveActive(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveActive(-1);
          break;
        case 'Enter':
          e.preventDefault();
          const active = resultsList.querySelector('.search-result-item.active');
          if (active) {
            closeSearch();
            window.location.href = active.href;
          } else {
            // First result pe jao
            const first = resultsList.querySelector('.search-result-item');
            if (first) {
              closeSearch();
              window.location.href = first.href;
            }
          }
          break;
      }
    });

    // Global shortcut — / to open search
    document.addEventListener('keydown', e => {
      if (e.key === '/' &&
          document.activeElement !== searchInput &&
          document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => NavSearch.init());
