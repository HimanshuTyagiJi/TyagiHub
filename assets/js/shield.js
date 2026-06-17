/**
 * InfoShield India - Anti-Race Condition Engine
 * Fixes the hard-refresh disappearing post issue permanently.
 */

document.addEventListener("DOMContentLoaded", () => {
  const POSTS_PER_PAGE = 1; 
  const wrapper = document.querySelector("#post-wrapper");
  const pagination = document.querySelector("#pagination-nav");
  const searchInput = document.getElementById("shield-search");

  if (!wrapper || !pagination) return;

  const params = new URLSearchParams(window.location.search);
  let currentPage = parseInt(params.get("page")) || 1;
  let searchQuery = ""; 
  
  let allShieldData = [];
  let filteredPosts = [];

  // MASTER FILTER LOGIC
  function applyFiltersAndRender() {
    // Agar data abhi load nahi hua toh render block ko roko
    if (!allShieldData || allShieldData.length === 0) return;

    filteredPosts = allShieldData.filter(post => {
      const searchPool = `${post.title} ${post.description} ${post.category}`.toLowerCase();
      return searchPool.includes(searchQuery);
    });

    renderPosts();
    renderPagination();
  }

  // LIVE SEARCH
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      currentPage = 1; 
      window.history.replaceState({}, "", window.location.pathname);
      applyFiltersAndRender();
    });
  }

  // RENDER POSTS
  function renderPosts() {
    wrapper.innerHTML = ""; 
    
    if (filteredPosts.length === 0) {
      wrapper.innerHTML = `<p style="text-align:center; padding: 40px 0; color: #666; width:100%; grid-column: 1 / -1; font-size: 18px;">कोई परिणाम नहीं मिला। कृपया कुछ और खोजें।</p>`;
      return;
    }

    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const chunk = filteredPosts.slice(start, end);

    chunk.forEach(p => {
      const cat = p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : "Security";
      const cardHTML = `
        <a href="${p.url}" class="blog-card reveal js-post" role="listitem">
          <div class="blog-card__thumb">
            <img src="${p.image}" alt="${p.title}" loading="lazy">
          </div>
          <div class="blog-card__body">
            <span class="blog-card__tag">${cat}</span>
            <h2 class="blog-card__title">${p.title}</h2>
            <p style="font-size:var(--fs-sm);color:var(--clr-text-3);margin-top:var(--space-2);">
              ${p.description}
            </p>
          </div>
        </a>
      `;
      wrapper.insertAdjacentHTML("beforeend", cardHTML);
    });
  }

  // RENDER PAGINATION
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
      dots.innerText = "...";
      pagination.appendChild(dots);
    }

    if (currentPage > 1) {
      const prev = document.createElement("a");
      prev.href = `?page=${currentPage - 1}`;
      prev.className = "page-btn";
      prev.innerHTML = "←";
      pagination.appendChild(prev);
    }

    createPageBtn(1);
    if (totalPages >= 2) createPageBtn(2);
    if (currentPage > 3) createDots();
    if (currentPage > 2 && currentPage < totalPages - 1) createPageBtn(currentPage);
    if (totalPages > 2) createPageBtn(totalPages);

    if (currentPage < totalPages) {
      const next = document.createElement("a");
      next.href = `?page=${currentPage + 1}`;
      next.className = "page-btn";
      next.innerHTML = "→";
      pagination.appendChild(next);
    }
  }

  // FETCH DATA AFTER FUNCTIONS ARE DEFINED
  fetch("/shield.json")
    .then(res => res.json())
    .then(data => {
      allShieldData = data;
      // Data aane ke BAAD filter aur render call hoga
      applyFiltersAndRender();
    })
    .catch(err => console.error("Shield Data load failed:", err));
});
