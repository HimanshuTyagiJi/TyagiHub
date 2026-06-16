document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector("#post-wrapper");
  const searchInput = document.getElementById("discover-search");

  if (!wrapper || !searchInput) return;

  const currentPosts = Array.from(wrapper.querySelectorAll(".js-post"));
  let currentCategory = "all";
  let searchQuery = "";

  // Combined Live Search & Category Matching Controller
  function evaluateFilters() {
    currentPosts.forEach(post => {
      const title = post.dataset.title || "";
      const desc = post.dataset.desc || "";
      const cats = post.dataset.categories || "";

      // Check Category Rules
      const matchesCategory = (currentCategory === "all") || cats.includes(currentCategory);
      
      // Check Typing Search Rules
      const matchesSearch = title.includes(searchQuery) || desc.includes(searchQuery) || cats.includes(searchQuery);

      if (matchesCategory && matchesSearch) {
        post.style.display = "";
      } else {
        post.style.display = "none";
      }
    });
  }

  // Old Style Global Category Click Function Trigger
  window.filterCategory = function (category, button) {
    currentCategory = category.toLowerCase();

    document.querySelectorAll(".discover-cat-btn").forEach(btn => {
      btn.classList.remove("active");
    });
    if (button) button.classList.add("active");

    evaluateFilters();
  };

  // Typing Interceptor Box Listener
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    evaluateFilters();
  });
});

/* Related and Trending Components Handlers (Unchanged) */
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
