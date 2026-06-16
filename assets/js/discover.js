/**
 * TyagiHub Ecosystem Platform - Discover Dynamic Filter Engine
 * Handles high-performance client-side search and category filtering 
 * directly on top of server-rendered clean URL slug pages (/discover/page-2/).
 */

document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector("#post-wrapper");
  const searchInput = document.getElementById("discover-search");

  if (!wrapper || !searchInput) return;

  // Collect only the posts physically generated on this slug page by the server
  const currentPosts = Array.from(wrapper.querySelectorAll(".js-post"));
  let currentCategory = "all";
  let searchQuery = "";

  // Master Filter Router Execution
  function evaluateViewFilters() {
    currentPosts.forEach(post => {
      const title = post.dataset.title || "";
      const desc = post.dataset.desc || "";
      const cats = post.dataset.categories || "";

      // Check Category parameters logic
      const matchesCategory = (currentCategory === "all") || cats.includes(currentCategory);
      
      // Check Search text pools parameters logic
      const textPool = `${title} ${desc} ${cats}`.toLowerCase();
      const matchesSearch = textPool.includes(searchQuery);

      // Instantly reveal or hide matching DOM assets
      if (matchesCategory && matchesSearch) {
        post.style.display = "";
      } else {
        post.style.display = "none";
      }
    });
  }

  // Global Binding for Old Style Interactive Categories Buttons
  window.filterCategory = function (category, buttonNode) {
    currentCategory = category.toLowerCase().trim();

    // Reset active indicators on tabs rows
    document.querySelectorAll(".discover-cat-btn").forEach(btn => {
      btn.classList.remove("active");
    });
    if (buttonNode) buttonNode.classList.add("active");

    evaluateViewFilters();
  };

  // Real-time Text Interceptor input stream listener
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    evaluateViewFilters();
  });
});

/* ========================================================
   RELATED ASSET POOLS RANDOMIZERS COMPONENT
   ======================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const hiddenPosts = document.querySelectorAll("#related-posts-data .related-post-item");
  const container = document.getElementById("related-posts-container");

  if (!hiddenPosts.length || !container) return;

  const posts = [...hiddenPosts];
  posts.sort(() => Math.random() - 0.5);
  
  container.innerHTML = ""; 
  posts.slice(0, 5).forEach(post => {
    container.insertAdjacentHTML(
      "beforeend",
      `<a href="${post.dataset.url}" class="related-post-card">
        <img src="${post.dataset.image}" alt="${post.dataset.title}" class="related-thumb" loading="lazy">
        <span class="related-title">${post.dataset.title}</span>
      </a>`
    );
  });
});

/* ========================================================
   TRENDING HUB ACTIVE CARDS RE-ARRANGER ENGINE BLOCK
   ======================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const trendingPosts = [...document.querySelectorAll("#trending-posts-data .trending-post-item")];
  const trendingContainer = document.getElementById("trending-posts-container");

  if (trendingPosts.length && trendingContainer) {
    trendingPosts.sort(() => Math.random() - 0.5);
    trendingContainer.innerHTML = ""; 
    trendingPosts.slice(0, 5).forEach(post => {
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

// Device Core Native Share Protocols
function nativeShare(title, url) {
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(console.error);
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard!");
    });
  }
}
