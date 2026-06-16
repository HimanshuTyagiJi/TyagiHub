document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector("#post-wrapper");
  if (!wrapper) return;

  const currentPosts = Array.from(wrapper.querySelectorAll(".js-post"));

  /* ========================================================
     CATEGORY FILTERING (CURRENT PAGE INTERACTION FALLBACK)
     ======================================================== */
  window.filterCategory = function (category, button) {
    document.querySelectorAll(".discover-cat-btn").forEach(btn => {
      btn.classList.remove("active");
    });
    if(button) button.classList.add("active");

    currentPosts.forEach(post => {
      if (category === "all") {
        post.style.display = "";
      } else {
        const cats = post.dataset.categories || "";
        if (cats.toLowerCase().includes(category.toLowerCase())) {
          post.style.display = "";
        } else {
          post.style.display = "none";
        }
      }
    });
  };

  // Add click support to remaining category static elements
  document.querySelectorAll(".discover-cat-btn[data-cat-slug]").forEach(btn => {
    btn.addEventListener("click", function() {
      const slug = this.getAttribute("data-cat-slug");
      filterCategory(slug, this);
    });
  });

  /* ========================================================
     RELATED POSTS RANDOMIZER
     ======================================================== */
  const hiddenRelated = document.querySelectorAll("#related-posts-data .related-post-item");
  const relatedContainer = document.getElementById("related-posts-container");

  if (hiddenRelated.length && relatedContainer) {
    const postsArr = [...hiddenRelated];
    postsArr.sort(() => Math.random() - 0.5);
    postsArr.slice(0, 5).forEach(post => {
      relatedContainer.insertAdjacentHTML(
        "beforeend",
        `<a href="${post.dataset.url}" class="related-post-card">
          <img src="${post.dataset.image}" alt="${post.dataset.title}" class="related-thumb" loading="lazy">
          <span class="related-title">${post.dataset.title}</span>
        </a>`
      );
    });
  }

  /* ========================================================
     TRENDING POSTS RANDOMIZER
     ======================================================== */
  const hiddenTrending = document.querySelectorAll("#trending-posts-data .trending-post-item");
  const trendingContainer = document.getElementById("trending-posts-container");

  if (hiddenTrending.length && trendingContainer) {
    const trendingArr = [...hiddenTrending];
    trendingArr.sort(() => Math.random() - 0.5);
    trendingArr.slice(0, 5).forEach(post => {
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

// Global Native Share Engine Check
function nativeShare(title, url) {
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(console.error);
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard!");
    });
  }
}
