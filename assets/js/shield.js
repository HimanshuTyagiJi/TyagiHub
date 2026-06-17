/**
 * InfoShield India - Complete Dynamic Engine
 * Handles full search, pagination, and data rendering for Shield.
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

  // 1. FETCH DATA
  fetch("/shield.json")
    .then(res => res.json())
    .then(data => {
      allShieldData = data;
      applyFiltersAndRender();
    })
    .catch(err => console.error("Shield Data load failed:", err));

  // 2. MASTER FILTER LOGIC
  function applyFiltersAndRender() {
    filteredPosts = allShieldData.filter(post => {
      const searchPool = `${post.title} ${post.description} ${post.category}`.toLowerCase();
      return searchPool.includes(searchQuery);
    });

    renderPosts();
    renderPagination();
  }

  // 3. LIVE SEARCH
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      currentPage = 1; 
      window.history.replaceState({}, "", window.location.pathname);
      applyFiltersAndRender();
    });
  }

  // 4. RENDER POSTS (Grid Design)
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

  // 5. RENDER PAGINATION
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
      btn.style.margin = "0 5px";
      btn.style.padding = "8px 16px";
      btn.style.textDecoration = "none";
      btn.style.borderRadius = "5px";
      btn.style.border = "1px solid #ddd";
      pagination.appendChild(btn);
    }

    function createDots() {
      const dots = document.createElement("span");
      dots.innerText = "...";
      pagination.appendChild(dots);
    }

    // Previous Button
    if (currentPage > 1) {
      const prev = document.createElement("a");
      prev.href = `?page=${currentPage - 1}`;
      prev.className = "page-btn";
      prev.innerHTML = "←";
      pagination.appendChild(prev);
    }

    // Numbers Logic
    createPageBtn(1);
    if (totalPages >= 2) createPageBtn(2);
    
    if (currentPage > 3) createDots();
    
    // Page logic for current view
    if (currentPage > 2 && currentPage < totalPages - 1) {
       createPageBtn(currentPage);
    }
    
    if (totalPages > 2) createPageBtn(totalPages);

    // Next Button
    if (currentPage < totalPages) {
      const next = document.createElement("a");
      next.href = `?page=${currentPage + 1}`;
      next.className = "page-btn";
      next.innerHTML = "→";
      pagination.appendChild(next);
    }
  }
});
