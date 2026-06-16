/**
 * TyagiHub Ecosystem Platform - Discover Dynamic Filter Engine
 * Handles high-performance client-side search on current slug pages
 * and routes category clicks to their clean physical server URLs.
 */

document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector("#post-wrapper");
  const searchInput = document.getElementById("discover-search");

  if (!wrapper || !searchInput) return;

  // Collect only the posts physically generated on this slug page by the server
  const currentPosts = Array.from(wrapper.querySelectorAll(".js-post"));
  let searchQuery = "";

  // Dynamic search system for the current active page stream
  function evaluateViewFilters() {
    currentPosts.forEach(post => {
      const title = post.dataset.title || "";
      const desc = post.dataset.desc || "";
      const cats = post.dataset.categories || "";

      // Check Search text pools parameters logic cleanly
      const textPool = `${title} ${desc} ${cats}`.toLowerCase().trim();
      const matchesSearch = textPool.includes(searchQuery);

      // Instantly reveal or hide matching DOM assets on the fly
      if (matchesSearch) {
        post.style.display = "";
      } else {
        post.style.display = "none";
      }
    });
  }

  // Global Binding for Interactive Categories Buttons - ROUTING BUG FIXED!
  window.filterCategory = function (category, buttonNode) {
    const targetCat = category.toLowerCase().trim();

    // Reset active indicators on tabs rows
    document.querySelectorAll(".discover-cat-btn").forEach(btn => {
      btn.classList.remove("active");
    });
    if (buttonNode) buttonNode.classList.add("active");

    // BHAI YAHAN DEKH: Agar 'all' hai toh main discover feed par bhejega, warna clean physical category slug par!
    if (targetCat === "all") {
      window.location.href = "/discover/";
    } else {
      window.location.href = `/${targetCat}/`;
    }
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
