document.addEventListener("DOMContentLoaded", () => {
  const POSTS_PER_PAGE = 3; 
  
  const wrapper = document.getElementById("post-wrapper");
  const pagination = document.getElementById("pagination-nav");
  const searchInput = document.getElementById("shield-search");

  if (!wrapper || !pagination) return;

  // 🎯 LANG LOCK ENGINE: HTML wrapper se current page ki bhasha detect karega ('hi' ya 'en')
  const pageLang = wrapper.getAttribute("data-page-lang") || "en";

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
      // 🟢 STRICT LANGUAGE FILTER: Sirf current page ki bhasha se match karne wali posts select hongi
      const postLang = post.lang || "en";
      if (postLang !== pageLang) return false;

      const searchPool = `${post.title} ${post.description} ${post.category}`.toLowerCase();
      return searchPool.includes(searchQuery);
    });

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
    window.history.replaceState({}, "", newUrl);
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
      // Category tag translation layer (Hindi page ke liye custom text aur baki ke liye normal)
      let displayTag = "सुरक्षा";
      if (p.category) {
        const catLower = p.category.toLowerCase();
        if (catLower === "cyber-security" || catLower === "cybersecurity") {
          displayTag = pageLang === "hi" ? "साइबर सुरक्षा" : "Cyber Security";
        } else {
          displayTag = p.category.charAt(0).toUpperCase() + p.category.slice(1);
        }
      }
      
      const cardHTML = `
        <div class="blog-card js-post" data-lang="${p.lang || 'en'}" data-post-url="${p.url}">
          <a href="${p.url}" style="text-decoration: none; color: inherit; display: block;">
            <div class="blog-card__thumb">
              <img src="${p.image || '/assets/images/default-thumb.png'}" alt="${p.title}" loading="lazy" width="354" height="236" class="shield-card-img">
            </div>
            <div class="blog-card__body">
              <span class="blog-card__tag">${displayTag}</span>
              <h2 class="blog-card__title">${p.title}</h2>
              <p>${p.description || ''}</p>
            </div>
          </a>
        </div>
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
      btn.style.border = "1px solid var(--clr-border, #ccc)";
      btn.style.borderRadius = "4px";
      btn.style.background = page === currentPage ? "#16a34a" : "var(--clr-bg-card, #fff)";
      btn.style.color = page === currentPage ? "#fff" : "var(--clr-text, #333)";
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
      dots.style.color = "var(--clr-text, #333)";
      pagination.appendChild(dots);
    }

    if (currentPage > 1) createBtn(currentPage - 1, "←");

    // Dynamic clean pages render logic
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        createBtn(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        createDots();
      }
    }

    if (currentPage < totalPages) createBtn(currentPage + 1, "→");
    
    // Clean up extra double dots if generated by loop
    const children = Array.from(pagination.children);
    for (let i = children.length - 1; i > 0; i--) {
      if (children[i].innerText === "..." && children[i-1].innerText === "...") {
        pagination.removeChild(children[i]);
      }
    }
  }
});
