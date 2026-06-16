document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector("#post-wrapper");
  const searchInput = document.getElementById("discover-search");

  if (!wrapper || !searchInput) return;

  const currentPosts = Array.from(wrapper.querySelectorAll(".js-post"));
  let currentCategory = "all";
  let searchQuery = "";

  function evaluateFilters() {
    currentPosts.forEach(post => {
      const title = post.dataset.title || "";
      const desc = post.dataset.desc || "";
      const cats = post.dataset.categories || "";

      const matchesCategory = (currentCategory === "all") || cats.includes(currentCategory);
      const matchesSearch = title.includes(searchQuery) || desc.includes(searchQuery) || cats.includes(searchQuery);

      if (matchesCategory && matchesSearch) {
        post.style.display = "";
      } else {
        post.style.display = "none";
      }
    });
  }

  window.filterCategory = function (category, button) {
    currentCategory = category.toLowerCase().trim();

    document.querySelectorAll(".discover-cat-btn").forEach(btn => {
      btn.classList.remove("active");
    });
    if (button) button.classList.add("active");

    evaluateFilters();
  };

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    evaluateFilters();
  });
});

/* Trending and Related Logic (Unchanged) */
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

function nativeShare(title, url) {
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(console.error);
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard!");
    });
  }
}
