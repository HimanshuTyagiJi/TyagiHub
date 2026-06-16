document.addEventListener("DOMContentLoaded", () => {
  const POSTS_PER_PAGE = 6; // Dhyan rakhna, ye HTML wale limit se match hona chahiye
  const wrapper = document.querySelector("#post-wrapper");
  const pagination = document.querySelector("#pagination-nav");

  if (!wrapper || !pagination) return;

  // Language & URL Context
  const isHindi = window.location.pathname.startsWith("/hi/");
  const params = new URLSearchParams(window.location.search);
  let currentPage = parseInt(params.get("page")) || 1;

  // Detect Category Context directly from URL
  const path = window.location.pathname.toLowerCase();
  let currentCategory = "all";
  if (path.includes("/cybersecurity/")) currentCategory = "cybersecurity";
  else if (path.includes("/aifuture/")) currentCategory = "aifuture";
  
  let allPostsData = [];
  let filteredPosts = [];

  // =========================
  // 1. FETCH JSON DATA (Hybrid Load)
  // =========================
  fetch("/posts.json")
    .then(res => res.json())
    .then(data => {
      // Filter by Language
      const languagePosts = data.filter(post => isHindi ? post.lang === "hi" : post.lang !== "hi");

      // Filter by Category
      if (currentCategory === "all") {
        filteredPosts = languagePosts;
      } else {
        filteredPosts = languagePosts.filter(post => post.categories.includes(currentCategory));
      }

      // Action based on Page Number
      if (currentPage === 1) {
        // Page 1 par Jekyll ka HTML pehle se hai, SEO ke liye use chhedna nahi hai!
        // Sirf pagination render karenge
        renderPagination();
      } else {
        // Page > 1 par JS se naye cards HTML mein inject karenge
        renderPosts();
        renderPagination();
      }
    })
    .catch(err => console.error("Data load failed:", err));

  // =========================
  // 2. SHOW POSTS (For Page > 1)
  // =========================
  function renderPosts() {
    wrapper.innerHTML = ""; // Clear existing HTML
    
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const chunk = filteredPosts.slice(start, end);

    chunk.forEach(p => {
      const mainCat = p.categories && p.categories.length > 0 ? p.categories[0] : "Technology";
      const cardHTML = `
        <div class="horizontal-post-card js-post">
          <div class="post-img">
            <span class="post-category">${mainCat.charAt(0).toUpperCase() + mainCat.slice(1)}</span>
            <div class="post-date"><i class="fa-regular fa-calendar"></i> ${p.date}</div>
            <img src="${p.image}" alt="${p.title}" loading="lazy" width="260" height="188">
          </div>
          <div class="post-info">
            <div class="post-top-meta">
              <h2><a href="${p.url}">${p.title}</a></h2>
              <p>${p.description}</p>
            </div>
            <div class="post-footer">
              <button class="native-share-btn" onclick="nativeShare('${p.title.replace(/'/g, "\\'")}','${window.location.origin}${p.url}')">
                <i class="fa-solid fa-share-nodes"></i> Share
              </button>
              <a href="${p.url}" class="read-link">Read More →</a>
            </div>
          </div>
        </div>
      `;
      wrapper.insertAdjacentHTML("beforeend", cardHTML);
    });
    
    // Smooth scroll back to top of feed
    window.scrollTo({ top: wrapper.offsetTop - 80, behavior: 'smooth' });
  }

  // =========================
  // 3. PAGINATION (Tera exact purana logic)
  // =========================
  function renderPagination() {
    pagination.innerHTML = "";
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

    if (totalPages <= 1) return;

    function createPageBtn(page) {
      const btn = document.createElement("a");
      btn.href = `?page=${page}`;
      btn.innerText = page;
      btn.className = "page-btn";
      if (page === currentPage) btn.classList.add("active");
      pagination.appendChild(btn);
    }

    function createDots() {
      const dots = document.createElement("span");
      dots.className = "page-dots";
      dots.innerText = "...";
      pagination.appendChild(dots);
    }

    // PREV
    if (currentPage > 1) {
      const prev = document.createElement("a");
      prev.href = `?page=${currentPage - 1}`;
      prev.className = "page-btn";
      prev.innerHTML = "←";
      pagination.appendChild(prev);
    }

    // START
    createPageBtn(1);
    if (totalPages >= 2) createPageBtn(2);

    // FIRST AREA
    if (currentPage <= 3) {
      if (totalPages > 5) createDots();
    }
    // LAST AREA
    else if (currentPage >= totalPages - 2) {
      createDots();
      for (let i = totalPages - 3; i <= totalPages - 1; i++) {
        if (i > 2) createPageBtn(i);
      }
    }
    // MIDDLE AREA
    else {
      createDots();
      createPageBtn(currentPage);
      createPageBtn(currentPage + 1);
      createDots();
    }

    // LAST PAGE
    if (totalPages > 2) createPageBtn(totalPages);

    // NEXT
    if (currentPage < totalPages) {
      const next = document.createElement("a");
      next.href = `?page=${currentPage + 1}`;
      next.className = "page-btn";
      next.innerHTML = "→";
      pagination.appendChild(next);
    }
  }

  // =========================
  // 4. CATEGORY FILTER (Redirects for clean SEO URLs)
  // =========================
  window.filterCategory = function (category, button) {
    const langPrefix = isHindi ? "/hi" : "";
    if (category === "all") {
      window.location.href = `${langPrefix}/discover/`;
    } else {
      window.location.href = `${langPrefix}/${category.toLowerCase()}/`;
    }
  };
});

// =========================
// TRENDING & RELATED POSTS ENGINE (Tera purana original code)
// =========================
document.addEventListener("DOMContentLoaded", () => {
  // Related Posts Logic
  const hiddenPosts = document.querySelectorAll("#related-posts-data .related-post-item");
  const container = document.getElementById("related-posts-container");

  if (hiddenPosts.length && container) {
    const posts = [...hiddenPosts];
    posts.sort(() => Math.random() - 0.5);
    const selected = posts.slice(0, 5);

    selected.forEach(post => {
      container.insertAdjacentHTML("beforeend", `
        <a href="${post.dataset.url}" class="related-post-card">
          <img src="${post.dataset.image}" alt="${post.dataset.title}" class="related-thumb" loading="lazy">
          <span class="related-title">${post.dataset.title}</span>
        </a>
      `);
    });
  }

  // Trending Posts Logic
  const trendingPosts = [...document.querySelectorAll("#trending-posts-data .trending-post-item")];
  const trendingContainer = document.getElementById("trending-posts-container");

  if (trendingPosts.length && trendingContainer) {
    trendingPosts.sort(() => Math.random() - 0.5);
    trendingPosts.slice(0, 5).forEach(post => {
      trendingContainer.insertAdjacentHTML("beforeend", `
        <a href="${post.dataset.url}" class="related-post-card">
          <img src="${post.dataset.image}" alt="${post.dataset.title}" class="related-thumb" loading="lazy">
          <span class="related-title">${post.dataset.title}</span>
        </a>
      `);
    });
  }
});

// Native Share Fallback
function nativeShare(title, url) {
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(console.error);
  } else {
    navigator.clipboard.writeText(url).then(() => alert("Link copied to clipboard!"));
  }
}
