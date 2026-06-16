document.addEventListener("DOMContentLoaded", () => {
  const jsonContainer = document.getElementById("raw-posts-json");
  const wrapper = document.querySelector("#post-wrapper");
  const paginationNav = document.querySelector("#pagination-nav");
  const searchInput = document.getElementById("discover-search");

  if (!jsonContainer || !wrapper || !paginationNav || !searchInput) return;

  let allPosts = [];
  
  try {
    allPosts = JSON.parse(jsonContainer.textContent);
  } catch (e) {
    console.error("Data tracking source synchronization mismatch:", e);
    wrapper.innerHTML = `<p style="text-align:center; padding:30px; color:var(--clr-text-light);">Ecosystem feed error. Rebuilding configurations...</p>`;
    return;
  }

  // Global State Layout Controls
  let filteredPosts = [...allPosts];
  let currentPage = 1;
  const POSTS_PER_PAGE = 6; // Har category select karne par 6/page ke hisab se automatic math setup chalega
  let currentCategory = "all";
  let searchQuery = "";

  // Master Filter Engine (Jo search text aur categories ko aapas me merge karta hai)
  function applyCombinedFilters() {
    filteredPosts = allPosts.filter(post => {
      // 1. Category Matching Control
      let matchesCategory = false;
      if (currentCategory === "all") {
        matchesCategory = true;
      } else {
        // String check array format compliance fallbacks
        const postCats = post.categories.join(" ").toLowerCase();
        matchesCategory = postCats.includes(currentCategory);
      }
      
      // 2. Typing Search Query Control
      const textPool = `${post.title} ${post.description} ${post.category}`.toLowerCase();
      const matchesSearch = textPool.includes(searchQuery);

      return matchesCategory && matchesSearch;
    });

    currentPage = 1; // Filter change hone par direct page 1 par reset karo
    renderDynamicFeed();
  }

  // Cards HTML Injection Engine
  function renderDynamicFeed() {
    wrapper.innerHTML = "";

    if (filteredPosts.length === 0) {
      wrapper.innerHTML = `
        <div style="text-align:center; padding:50px 20px; width:100%; color:var(--clr-text-light, #475569);">
          <p style="font-size:18px; font-weight:600;">No posts found match your criteria.</p>
          <p style="font-size:14px; opacity:0.7; margin-top:5px;">Try typing different keywords or click another category button.</p>
        </div>`;
      paginationNav.innerHTML = "";
      return;
    }

    // Offset Mathematics Limits
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = Math.min(startIndex + POSTS_PER_PAGE, filteredPosts.length);
    const paginatedSlice = filteredPosts.slice(startIndex, endIndex);

    // Cards Assembler Loop
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

    renderDynamicPaginationNav();
  }

  // Sliding Navigation Window Math Generator (Google Style Control Matrix)
  function renderDynamicPaginationNav() {
    paginationNav.innerHTML = "";
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

    if (totalPages <= 1) return;

    // First and Previous operational anchors
    if (currentPage > 1) {
      buildControlBtn("First", () => triggerJump(1));
      buildControlBtn("←", () => triggerJump(currentPage - 1));
    }

    const windowSize = 2;
    let minPage = Math.max(1, currentPage - windowSize);
    let maxPage = Math.min(totalPages, currentPage + windowSize);

    if (minPage > 1) {
      buildDotsItem();
    }

    for (let i = minPage; i <= maxPage; i++) {
      const btn = document.createElement("button");
      btn.innerText = i;
      btn.className = "page-btn" + (i === currentPage ? " active" : "");
      btn.addEventListener("click", () => triggerJump(i));
      paginationNav.appendChild(btn);
    }

    if (maxPage < totalPages) {
      buildDotsItem();
    }

    // Next and Last operational anchors
    if (currentPage < totalPages) {
      buildControlBtn("→", () => triggerJump(currentPage + 1));
      buildControlBtn("Last", () => triggerJump(totalPages));
    }
  }

  function triggerJump(pageTarget) {
    currentPage = pageTarget;
    renderDynamicFeed();
    window.scrollTo({ top: 320, behavior: "smooth" });
  }

  function buildControlBtn(text, actionHandler) {
    const btn = document.createElement("button");
    btn.innerText = text;
    btn.className = "page-btn page-control-btn";
    btn.addEventListener("click", actionHandler);
    paginationNav.appendChild(btn);
  }

  function buildDotsItem() {
    const dots = document.createElement("span");
    dots.innerText = "...";
    dots.style.cssText = "padding: 0 4px; color: var(--clr-text-light); font-weight: bold;";
    paginationNav.appendChild(dots);
  }

  // 3. System Listeners Hooking
  window.filterCategory = function (category, button) {
    currentCategory = category.toLowerCase().trim();

    document.querySelectorAll(".discover-cat-btn").forEach(btn => btn.classList.remove("active"));
    if (button) button.classList.add("active");

    applyCombinedFilters();
  };

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    applyCombinedFilters();
  });

  function escapeHtml(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // Default execution trigger sequence
  renderDynamicFeed();
});

/* Trending and Related Logic Controllers (Exactly Unchanged) */
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

// Native Web Share Controller Interface
function nativeShare(title, url) {
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(console.error);
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard!");
    });
  }
}
