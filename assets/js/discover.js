/**
 * TyagiHub Ecosystem Platform - Discover Dynamic Search & Filter Engine
 * Handles dropdown select filtering, input indexing, and automatic pagination math.
 */

document.addEventListener("DOMContentLoaded", () => {
  const jsonContainer = document.getElementById("raw-posts-json");
  const wrapper = document.querySelector("#post-wrapper");
  const paginationNav = document.querySelector("#pagination-nav");
  const searchInput = document.getElementById("discover-search");
  const categorySelect = document.getElementById("discover-cat-select");

  if (!jsonContainer || !wrapper || !paginationNav || !searchInput || !categorySelect) return;

  let allPosts = [];
  
  // Try-Catch to prevent any sudden JSON breakages from breaking the script
  try {
    allPosts = JSON.parse(jsonContainer.textContent);
  } catch (e) {
    console.error("JSON Parsing Error detected in data source feed:", e);
    wrapper.innerHTML = `<p style="text-align:center; padding:30px; color:red; font-weight:bold;">Error: Content database format mismatch. Refactor markdown parameters.</p>`;
    return;
  }

  // State parameters
  let filteredPosts = [...allPosts];
  let currentPage = 1;
  const POSTS_PER_PAGE = 6; // Balanced items structure per execution grid
  let currentCategory = "all";
  let searchQuery = "";

  // Combined Interlocking Filter Engine
  function applySystemFilters() {
    filteredPosts = allPosts.filter(post => {
      // 1. Dropdown Select Category Evaluation
      const matchesCategory = (currentCategory === "all") || post.categories.includes(currentCategory);
      
      // 2. Input Keywords Evaluation
      const textPool = `${post.title} ${post.description} ${post.category}`.toLowerCase();
      const matchesSearch = textPool.includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    currentPage = 1; // Always slide to index 1 on changes
    renderFeedView();
  }

  // Render HTML Cards Content
  function renderFeedView() {
    wrapper.innerHTML = "";

    if (filteredPosts.length === 0) {
      wrapper.innerHTML = `
        <div style="text-align:center; padding:60px 20px; width:100%; color:var(--clr-text-light, #475569);">
          <p style="font-size:18px; font-weight:600;">No posts match your search or filter combination.</p>
          <p style="font-size:14px; opacity:0.7; margin-top:5px;">Clear your keywords search or change the category dropdown select option.</p>
        </div>`;
      paginationNav.innerHTML = "";
      return;
    }

    // Process Slice Parameters Offset Math
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = Math.min(startIndex + POSTS_PER_PAGE, filteredPosts.length);
    const paginatedSlice = filteredPosts.slice(startIndex, endIndex);

    // Append Cards Loop
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
        </div>`;
      wrapper.insertAdjacentHTML("beforeend", cardHtml);
    });

    renderSmartPaginationControls();
  }

  // Sliding Nav Controls Factory
  function renderSmartPaginationControls() {
    paginationNav.innerHTML = "";
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

    if (totalPages <= 1) return;

    // First & Previous controls
    if (currentPage > 1) {
      injectBtn("First", () => processJump(1));
      injectBtn("←", () => processJump(currentPage - 1));
    }

    // Windows Boundary Math Matrix
    const windowSize = 2;
    let minPage = Math.max(1, currentPage - windowSize);
    let maxPage = Math.min(totalPages, currentPage + windowSize);

    if (minPage > 1) {
      injectDots();
    }

    for (let i = minPage; i <= maxPage; i++) {
      const btn = document.createElement("button");
      btn.innerText = i;
      btn.className = "page-btn" + (i === currentPage ? " active" : "");
      btn.addEventListener("click", () => processJump(i));
      paginationNav.appendChild(btn);
    }

    if (maxPage < totalPages) {
      injectDots();
    }

    // Next & Last controls
    if (currentPage < totalPages) {
      injectBtn("→", () => processJump(currentPage + 1));
      injectBtn("Last", () => processJump(totalPages));
    }
  }

  function processJump(target) {
    currentPage = target;
    renderFeedView();
    window.scrollTo({ top: 320, behavior: "smooth" });
  }

  function injectBtn(text, action) {
    const btn = document.createElement("button");
    btn.innerText = text;
    btn.className = "page-btn page-control-btn";
    btn.addEventListener("click", action);
    paginationNav.appendChild(btn);
  }

  fn injectDots() {
    const dots = document.createElement("span");
    dots.innerText = "...";
    dots.style.cssText = "padding: 0 4px; color: var(--clr-text-light); font-weight: bold;";
    paginationNav.appendChild(dots);
  }

  // 3. Listeners bindings
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    applySystemFilters();
  });

  categorySelect.addEventListener("change", (e) => {
    currentCategory = e.target.value;
    applySystemFilters();
  });

  function escapeHtml(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // Initial Run
  renderFeedView();
});

// Randomizer routines for components containers (Trending/Related)
document.addEventListener("DOMContentLoaded", () => {
  const hiddenRelated = document.querySelectorAll("#related-posts-data .related-post-item");
  const relatedContainer = document.getElementById("related-posts-container");

  if (hiddenRelated.length && relatedContainer) {
    const arr = [...hiddenRelated].sort(() => Math.random() - 0.5);
    arr.slice(0, 5).forEach(post => {
      relatedContainer.insertAdjacentHTML("beforeend",
        `<a href="${post.dataset.url}" class="related-post-card">
          <img src="${post.dataset.image}" alt="${post.dataset.title}" class="related-thumb" loading="lazy">
          <span class="related-title">${post.dataset.title}</span>
        </a>`
      );
    });
  }

  const hiddenTrending = document.querySelectorAll("#trending-posts-data .trending-post-item");
  const trendingContainer = document.getElementById("trending-posts-container");

  if (hiddenTrending.length && trendingContainer) {
    const arr = [...hiddenTrending].sort(() => Math.random() - 0.5);
    arr.slice(0, 5).forEach(post => {
      trendingContainer.insertAdjacentHTML("beforeend",
        `<a href="${post.dataset.url}" class="related-post-card">
          <img src="${post.dataset.image}" alt="${post.dataset.title}" class="related-thumb" loading="lazy">
          <span class="related-title">${post.dataset.title}</span>
        </a>`
      );
    });
  }
});

// Global Share
function nativeShare(title, url) {
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(console.error);
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard!");
    });
  }
}
