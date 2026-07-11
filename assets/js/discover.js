document.addEventListener("DOMContentLoaded", () => {
  const POSTS_PER_PAGE = 15; 
  const wrapper = document.querySelector("#post-wrapper");
  const pagination = document.querySelector("#pagination-nav");
  const searchInput = document.getElementById("discover-search");

  if (!wrapper || !pagination) return;

  const isHindi = window.location.pathname.startsWith("/hi/");
  
  const params = new URLSearchParams(window.location.search);
  let currentPage = parseInt(params.get("page")) || 1;
  let currentCategory = (params.get("category") || "all").toLowerCase().trim();
  let searchQuery = ""; 
  
  let allPostsData = [];
  let filteredPosts = [];

  document.querySelectorAll(".discover-cat-btn").forEach(btn => {
    const btnCat = (btn.dataset.cat || "").toLowerCase().trim();
    if (btnCat === currentCategory) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  Promise.all([
    fetch("/posts.json").then(res => res.json()).catch(() => []),
    fetch("/shield.json").then(res => res.json()).catch(() => [])
  ])
    .then(([postsData, shieldData]) => {
      
      const normalizedPosts = postsData.map(post => {
        let cats = [];
        if (Array.isArray(post.categories)) {
          cats = post.categories.map(c => c.toLowerCase().trim());
        } else if (typeof post.categories === "string") {
          cats = post.categories.split(",").map(c => c.toLowerCase().trim());
        }
        return { ...post, categories: cats, lang: post.lang || "en" };
      });

      const normalizedShield = shieldData.map(post => {
        let catStr = post.category || "cyber-security";
        return {
          title: post.title,
          url: post.url,
          image: post.image,
          description: post.description,
          categories: [catStr.toLowerCase().trim()],
          date: post.date,
          lang: post.lang || "hi"
        };
      });

      const rawCombinedData = [...normalizedPosts, ...normalizedShield];

      const uniqueMap = new Map();
      rawCombinedData.forEach(post => {
        if (post.url) {
          const cleanUrl = post.url.toLowerCase().trim();
          if (!uniqueMap.has(cleanUrl)) {
            uniqueMap.set(cleanUrl, post);
          }
        }
      });

      const masterCombinedData = Array.from(uniqueMap.values());

      allPostsData = masterCombinedData.filter(post => isHindi ? post.lang === "hi" : post.lang !== "hi");
      
      allPostsData.sort((a, b) => new Date(b.date) - new Date(a.date));

      applyFiltersAndRender();
    })
    .catch(err => console.error("Multi-Data load failed:", err));

  function applyFiltersAndRender() {
    if (!allPostsData.length) return;

    filteredPosts = allPostsData.filter(post => {
      const matchesCat = (currentCategory === "all") || post.categories.includes(currentCategory);
      const searchPool = `${post.title} ${post.description} ${post.categories.join(" ")}`.toLowerCase();
      const matchesSearch = searchPool.includes(searchQuery);
      return matchesCat && matchesSearch;
    });

    renderPosts();
    renderPagination();
  }

  if (searchInput) {
    if (isHindi) searchInput.placeholder = "Articles तुरंत सर्च करें...";
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      currentPage = 1; 
      
      const newUrl = window.location.pathname + `?category=${currentCategory}`;
      window.history.replaceState({}, "", newUrl);

      applyFiltersAndRender();
    });
  }

  function renderPosts() {
    wrapper.innerHTML = ""; 
    
    if (filteredPosts.length === 0) {
      const noResultText = isHindi ? "कोई परिणाम नहीं मिला। कृपया कुछ और खोजें।" : "No results found.";
      wrapper.innerHTML = `<p style="text-align:center; padding: 40px 0; color: var(--text-muted); width:100%;">${noResultText}</p>`;
      return;
    }

    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const chunk = filteredPosts.slice(start, end);

    chunk.forEach(p => {
      const rawCat = p.categories && p.categories.length > 0 ? p.categories[0] : "technology";
      
      let displayChip = rawCat.replace("-", " ").toUpperCase();
      if (isHindi) {
        if (rawCat === "cyber-security" || rawCat === "cybersecurity") displayChip = "साइबर सुरक्षा";
        else if (rawCat === "apps") displayChip = "ऐप्स";
        else if (rawCat === "learn") displayChip = "सीखें";
      }

      const shareBtnText = isHindi ? "शेयर" : "Share";
      const readMoreText = isHindi ? "पूरा पढ़ें →" : "Read More →";

      const safeTitle = (p.title || "").replace(/'/g, "\\'");
      const safeUrl = p.url;

      const cardHTML = `
        <div class="horizontal-post-card js-post" data-lang="${p.lang}">
          <div class="post-img">
            <span class="post-category">${displayChip}</span>
            <div class="post-date"><i class="fa-regular fa-calendar"></i> ${p.date}</div>
            <img src="${p.image || '/assets/images/default-thumb.png'}" alt="${p.title}" loading="lazy" width="354" height="236">
          </div>
          <div class="post-info">
            <div class="post-top-meta">
              <h2><a href="${p.url}">${p.title}</a></h2>
              <p>${p.description || ''}</p>
            </div>
            <div class="post-footer">
              <button class="native-share-btn" onclick="nativeShare('${safeTitle}','${safeUrl}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                <span>${shareBtnText}</span>
              </button>
              <a href="${p.url}" class="read-link">${readMoreText}</a>
            </div>
          </div>
        </div>
      `;
      wrapper.insertAdjacentHTML("beforeend", cardHTML);
    });
  }

  function renderPagination() {
    pagination.innerHTML = "";
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

    if (totalPages <= 1) return;

    function createPageBtn(page) {
      const btn = document.createElement("a");
      btn.href = `?category=${currentCategory}&page=${page}`;
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

    if (currentPage > 1) {
      const prev = document.createElement("a");
      prev.href = `?category=${currentCategory}&page=${currentPage - 1}`;
      prev.className = "page-btn";
      prev.innerHTML = "←";
      pagination.appendChild(prev);
    }

    createPageBtn(1);
    if (totalPages >= 2) createPageBtn(2);

    if (currentPage <= 3) {
      if (totalPages > 5) createDots();
    }
    else if (currentPage >= totalPages - 2) {
      createDots();
      for (let i = totalPages - 3; i <= totalPages - 1; i++) {
        if (i > 2) createPageBtn(i);
      }
    }
    else {
      createDots();
      createPageBtn(currentPage);
      createPageBtn(currentPage + 1);
      createDots();
    }

    if (totalPages > 2) createPageBtn(totalPages);

    if (currentPage < totalPages) {
      const next = document.createElement("a");
      next.href = `?category=${currentCategory}&page=${currentPage + 1}`;
      next.className = "page-btn";
      next.innerHTML = "→";
      pagination.appendChild(next);
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const hiddenPosts = document.querySelectorAll("#related-posts-data .related-post-item");
  const container = document.getElementById("related-posts-container");
  if (hiddenPosts.length && container) {
    const posts = [...hiddenPosts].sort(() => Math.random() - 0.5).slice(0, 5);
    posts.forEach(post => {
      container.insertAdjacentHTML("beforeend", `<a href="${post.dataset.url}" class="related-post-card"><img src="${post.dataset.image}" alt="${post.dataset.title}" class="related-thumb" loading="lazy"><span class="related-title">${post.dataset.title}</span></a>`);
    });
  }

  const trendingPosts = [...document.querySelectorAll("#trending-posts-data .trending-post-item")];
  const trendingContainer = document.getElementById("trending-posts-container");
  if (trendingPosts.length && trendingContainer) {
    trendingPosts.sort(() => Math.random() - 0.5).slice(0, 5).forEach(post => {
      trendingContainer.insertAdjacentHTML("beforeend", `<a href="${post.dataset.url}" class="related-post-card"><img src="${post.dataset.image}" alt="${post.dataset.title}" class="related-thumb" loading="lazy"><span class="related-title">${post.dataset.title}</span></a>`);
    });
  }
});

function nativeShare(title, url) {
  if (navigator.share) navigator.share({ title: title, url: url }).catch(console.error);
  else navigator.clipboard.writeText(url).then(() => alert("Link copied!"));
}
