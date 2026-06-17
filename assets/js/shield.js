document.addEventListener("DOMContentLoaded", () => {
  // Yahan Limit 6 set hai (HTML se match karne ke liye)
  const POSTS_PER_PAGE = 1; 
  
  const wrapper = document.getElementById("post-wrapper");
  const pagination = document.getElementById("pagination-nav");
  const searchInput = document.getElementById("shield-search");

  if (!wrapper || !pagination) return;

  const params = new URLSearchParams(window.location.search);
  let currentPage = parseInt(params.get("page")) || 1;
  let searchQuery = ""; 
  
  let allShieldData = [];
  let filteredPosts = [];

  // FETCH JSON DATA
  fetch("/shield.json")
    .then(res => res.json())
    .then(data => {
      allShieldData = data;
      applyFiltersAndRender();
    })
    .catch(err => console.error("Shield JSON fetch error:", err));

  // MASTER FILTER & SAFETY LOCK
  function applyFiltersAndRender() {
    if (!allShieldData.length) return;

    filteredPosts = allShieldData.filter(post => {
      const searchPool = `${post.title} ${post.description} ${post.category}`.toLowerCase();
      return searchPool.includes(searchQuery);
    });

    // SAFETY LOCK: Agar URL mein page 50 likha hai aur total post 2 hain, 
    // toh ye user ko dhakka maar ke Page 1 par wapas bhej dega.
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE) || 1;
    if (currentPage > totalPages) {
      currentPage = totalPages;
      updateURL();
    }

    renderPosts();
    renderPagination();
  }

  // SEARCH INPUT
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      currentPage = 1; 
      updateURL();
      applyFiltersAndRender();
    });
  }

  function updateURL() {
    const newUrl = currentPage === 1 ? window.location.pathname : `?page=${currentPage}`;
    window.history.replaceState({}, "", newUrl); // replaceState better hai taki back history gandi na ho
  }

  // RENDER POSTS
  function renderPosts() {
    wrapper.innerHTML = ""; 
    
    if (filteredPosts.length === 0) {
      wrapper.innerHTML = `<p style="text-align:center; padding:40px; color:#666; font-size:18px; grid-column:1/-1;">कोई परिणाम नहीं मिला। कृपया कुछ और खोजें।</p>`;
      return;
    }

    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const chunk = filteredPosts.slice(start, end);

    chunk.forEach(p => {
      const cat = p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : "Security";
      
      const cardHTML = `
        <a href="${p.url}" class="blog-card" role="listitem">
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

  // PAGINATION RENDER
  function renderPagination() {
    pagination.innerHTML = "";
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

    if (totalPages <= 1) return;

    function createBtn(page, text = page) {
      const btn = document.createElement("button");
      btn.innerText = text;
      btn.style.margin = "0 4px";
      btn.style.padding = "8px 14px";
      btn.style.border = "1px solid #ccc";
      btn.style.borderRadius = "4px";
      btn.style.background = page === currentPage ? "#16a34a" : "#fff";
      btn.style.color = page === currentPage ? "#fff" : "#333";
      btn.style.cursor = "pointer";
      
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        currentPage = page;
        updateURL();
        applyFiltersAndRender();
        window.scrollTo({ top: wrapper.offsetTop - 100, behavior: "smooth" });
      });
      pagination.appendChild(btn);
    }

    function createDots() {
      const dots = document.createElement("span");
      dots.innerText = "...";
      dots.style.margin = "0 4px";
      pagination.appendChild(dots);
    }

    if (currentPage > 1) createBtn(currentPage - 1, "←");

    createBtn(1);
    if (totalPages >= 2) createBtn(2);
    if (currentPage > 3) createDots();
    if (currentPage > 2 && currentPage < totalPages - 1) createBtn(currentPage);
    if (totalPages > 2 && currentPage < totalPages - 1) createDots();
    if (totalPages > 2) createBtn(totalPages);

    if (currentPage < totalPages) createBtn(currentPage + 1, "→");
  }
});
