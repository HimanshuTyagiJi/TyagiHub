document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector("#post-wrapper");
  const searchInput = document.getElementById("discover-search");

  if (!wrapper || !searchInput) return;

  // Collect physically rendered server posts
  const localPosts = Array.from(wrapper.querySelectorAll(".js-post"));

  // Simple clean local live search functionality
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();

    localPosts.forEach(post => {
      const title = post.dataset.title || "";
      const desc = post.dataset.desc || "";

      if (title.includes(query) || desc.includes(query)) {
        post.style.display = ""; // Show matching
      } else {
        post.style.display = "none"; // Hide mismatching
      }
    });
  });
});

/* Trending and Related Component Randomizers */
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

// Global Native Share
function nativeShare(title, url) {
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(console.error);
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard!");
    });
  }
}
