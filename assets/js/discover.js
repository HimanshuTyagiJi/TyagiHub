/**
 * TyagiHub Ecosystem Platform - Discover Feed Controller Engine
 * Features: Client-Side Isolated JSON Pagination, Live Real-time Search, 
 * Dynamic Sliding Navigation Window Mathematics, Random Asset Containers.
 * Last Compliance Architecture Refactor: June 16, 2026
 */

document.addEventListener("DOMContentLoaded", () => {
  const jsonContainer = document.getElementById("raw-posts-json");
  const wrapper = document.querySelector("#post-wrapper");
  const paginationNav = document.querySelector("#pagination-nav");
  const searchInput = document.getElementById("discover-search");

  // Basic sanity framework checkpoint
  if (!jsonContainer || !wrapper || !paginationNav) return;

  // 1. Parse Database Records directly loaded from static background layout
  const allPosts = JSON.parse(jsonContainer.textContent);

  // 2. Global State Engine Control Parameters
  let filteredPosts = [...allPosts];
  let currentPage = 1;
  const POSTS_PER_PAGE = 6; // Set to 6 posts per page blueprint as explicitly targeted
  let currentCategory = "all";
  let searchQuery = "";

  // 3. Central Algorithmic Filtering Pipeline (Search + Category Interlocking Matrix)
  function applyFilters() {
    filteredPosts = allPosts.filter(post => {
      // Check Category parameters bounds
      const matchesCategory = (currentCategory === "all") || post.categories.includes(currentCategory);
      
      // Compute Search constraints against Title, Truncated Desc, and primary tag
      const textPool = `${post.title} ${post.description} ${post.category}`.toLowerCase();
      const matchesSearch = textPool.includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    // Operational Override: Always fall back to index 1 on structural alterations
    currentPage = 1;
    renderEngine();
  }

  // 4. Document Fragment Render Engine (HTML Asset Factory)
  function renderEngine() {
    // Purge previous nodes cleanly
    wrapper.innerHTML = "";

    // Empty Validation Condition Check
    if (filteredPosts.length === 0) {
      wrapper.innerHTML = `
        <div style="text-align:center; padding:50px 20px; width:100%; color:var(--clr-text-light, #475569);">
          <i class="fa-solid fa-magnifying-glass-minus" style="font-size: 40px; margin-bottom: 15px; opacity: 0.6;"></i>
          <p style="font-size:18px; font-weight: 600;">No matching updates found!</p>
          <p style="font-size:14px; opacity:0.8; margin-top:5px;">Try checking alternate spelling variations or reset selected categories filter.</p>
        </div>`;
      paginationNav.innerHTML = "";
      return;
    }

    // Process Pagination Offset Matrix
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = Math.min(startIndex + POSTS_PER_PAGE, filteredPosts.length);
    const paginatedSlice = filteredPosts.slice(startIndex, endIndex);

    // Build Fragment Nodes using your exact card design classes and tokens
    paginatedSlice.forEach(p => {
      const cardHtml = `
        <div class="horizontal-post-card js-post">
          <div class="post-img">
            <span class="post-category">${p.category}</span>
            <div class="post-date">
              <i class="fa-regular fa-calendar"></i>
              ${p.date}
            </div>
            <img src="${p.image}" alt="${p.title} - TyagiHub" loading="lazy" width="260" height="188">
          </div>

          <div class="post-info">
            <div class="post-top-meta">
              <h2><a href="${p.url}">${p.title}</a></h2>
              <p>${p.description}</p>
            </div>
            <div class="post-footer">
              <button class="native-share-btn" onclick="nativeShare('${escapeHtml(p.title)}','${p.absolute_url}')">
                <i class="fa-solid fa-share-nodes"></i> Share
              </button>
              <a href="${p.url}" class="read-link">Read More →</a>
            </div>
          </div>
        </div>
      `;
      wrapper.insertAdjacentHTML("beforeend", cardHtml);
    });

    // Synchronize UI Nav Links
    renderPaginationNav();
  }

  // 5. Advanced Mathematical Window Pagination Mechanism (Google-Style Interface Control)
  function renderPaginationNav() {
    paginationNav.innerHTML = "";
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

    // Nullify pagination controls layer if total payload fits singular block boundary
    if (totalPages <= 1) return;

    // A. PREVIOUS AND FIRST CONTROL INJECTION STRATEGY
    if (currentPage > 1) {
      createBtn("First", () => executeViewShift(1));
      createBtn("←", () => executeViewShift(currentPage - 1));
    }

    // B. COMPUTE SLIDING MATRIX CHANNELS
    const windowSize = 2; // Fixed contextual threshold boundaries
    let minPage = Math.max(1, currentPage - windowSize);
    let maxPage = Math.min(totalPages, currentPage + windowSize);

    // Render Left Boundary Dots Matrix if gap identified
    if (minPage > 1) {
      createDots();
    }

    // Sequence Generator for numbers layout
    for (let i = minPage; i <= maxPage; i++) {
      const btn = document.createElement("button");
      btn.innerText = i;
      btn.className = "page-btn" + (i === currentPage ? " active" : "");
      btn.addEventListener("click", () => executeViewShift(i));
      paginationNav.appendChild(btn);
    }

    // Render Right Boundary Dots Matrix if gap identified
    if (maxPage < totalPages) {
      createDots();
    }

    // C. NEXT AND LAST CONTROL INJECTION STRATEGY
    if (currentPage < totalPages) {
      createBtn("→", () => executeViewShift(currentPage + 1));
      createBtn("Last", () => executeViewShift(totalPages));
    }
  }

  // Viewport Control Helper Router
  function executeViewShift(targetPage) {
    currentPage = targetPage;
    renderEngine();
    // Smooth navigation anchor viewport alignment correction
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  // Dynamic Button Blueprint Factory
  function createBtn(text, clickHandler) {
    const btn = document.createElement("button");
    btn.innerText = text;
    btn.className = "page-btn page-control-btn";
    btn.addEventListener("click", clickHandler);
    paginationNav.appendChild(btn);
  }

  // Dots Separator Template Constructor
  function createDots() {
    const dots = document.createElement("span");
    dots.className = "page-dots";
    dots.innerText = "...";
    dots.style.cssText = "padding: 0 4px; color: var(--clr-text-light, #475569); font-weight: bold;";
    paginationNav.appendChild(dots);
  }

  // 6. Global Category Selection Routing Bridge
  window.filterCategory = function (category, button) {
    currentCategory = category.toLowerCase();
    
    // Manage state buttons classes assignments
    document.querySelectorAll(".discover-cat-btn").forEach(btn => btn.classList.remove("active"));
    if (button) button.classList.add("active");

    // Process Pipeline filters calculations loop execution
    applyFilters();
  };

  // 7. Live Real-Time Intercept Framework Trigger
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    applyFilters();
  });

  // String Mutation Sanitize Scraper Utility
  function escapeHtml(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // Fire engine default configurations sequence
  renderEngine();
});

/* ========================================================
   RELATED AND TRENDING RANDOMIZATIONS CONTROL INTERFACES
   ======================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Related Component Routine
  const hiddenRelated = document.querySelectorAll("#related-posts-data .related-post-item");
  const relatedContainer = document.getElementById("related-posts-container");

  if (hiddenRelated.length && relatedContainer) {
    const relatedArr = [...hiddenRelated];
    relatedArr.sort(() => Math.random() - 0.5);
    relatedArr.slice(0, 5).forEach(post => {
      relatedContainer.insertAdjacentHTML(
        "beforeend",
        `<a href="${post.dataset.url}" class="related-post-card">
          <img src="${post.dataset.image}" alt="${post.dataset.title}" class="related-thumb" loading="lazy">
          <span class="related-title">${post.dataset.title}</span>
        </a>`
      );
    });
  }

  // Trending Component Routine
  const hiddenTrending = document.querySelectorAll("#trending-posts-data .trending-post-item");
  const trendingContainer = document.getElementById("trending-posts-container");

  if (hiddenTrending.length && trendingContainer) {
    const trendingArr = [...hiddenTrending];
    trendingArr.sort(() => Math.random() - 0.5);
    trendingArr.slice(0, 5).forEach(post => {
      trendingContainer.insertAdjacentHTML(
        "beforeend",
        `<a href="${post.dataset.url}" class="related-post-card">
          <img src="${post.dataset.image}" alt="${post.dataset.title}" class="related-thumb" loading="lazy">
          <span class="related-title">${post.dataset.title}</span>
        </a>`
      );
    });
  }
});

/* ========================================================
   GLOBAL COMPLIANCE NATIVE WEB SHARE PROTOCOLS ENGINE
   ======================================================== */
function nativeShare(title, url) {
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(console.error);
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard!");
    }).catch(() => {
      alert("Sharing link: " + url);
    });
  }
}
