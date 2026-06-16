document.addEventListener("DOMContentLoaded", () => {

  const POSTS_PER_PAGE = 1;

  const wrapper =
    document.querySelector("#post-wrapper");

  const pagination =
    document.querySelector("#pagination-nav");

  if (!wrapper || !pagination) return;

  /* =========================
     ALL POSTS
  ========================= */

  const allPosts = Array.from(
    wrapper.querySelectorAll(".js-post")
  );

  /* =========================
     LANGUAGE DETECT
  ========================= */

  const isHindi =
    window.location.pathname.startsWith("/hi/");

  /* =========================
     LANGUAGE FILTER
  ========================= */

  const languagePosts =
    allPosts.filter(post => {

      const lang =
        post.dataset.lang || "en";

      return isHindi
        ? lang === "hi"
        : lang === "en";

    });

  /* =========================
     FILTERED POSTS
  ========================= */

  let filteredPosts =
    [...languagePosts];

  const params =
    new URLSearchParams(window.location.search);

  let currentPage =
    parseInt(params.get("page")) || 1;

  /* =========================
     SHOW POSTS
  ========================= */

  function renderPosts() {

    allPosts.forEach(post => {

      post.style.display = "none";

    });

    const start =
      (currentPage - 1) * POSTS_PER_PAGE;

    const end =
      start + POSTS_PER_PAGE;

    filteredPosts
      .slice(start, end)
      .forEach(post => {

        post.style.display = "";

      });

    renderPagination();

  }

  /* =========================
     PAGINATION
  ========================= */

  function renderPagination() {

    pagination.innerHTML = "";

    const totalPages =
      Math.ceil(
        filteredPosts.length /
        POSTS_PER_PAGE
      );

    if (totalPages <= 1) return;

    /* =========================
       PAGE BUTTON
    ========================= */

    function createPageBtn(page) {

      const btn =
        document.createElement("a");

      btn.href =
        `?page=${page}`;

      btn.innerText = page;

      btn.className = "page-btn";

      if (page === currentPage) {

        btn.classList.add("active");

      }

      pagination.appendChild(btn);

    }

    /* =========================
       DOTS
    ========================= */

    function createDots() {

      const dots =
        document.createElement("span");

      dots.className =
        "page-dots";

      dots.innerText = "...";

      pagination.appendChild(dots);

    }

    /* =========================
       PREV
    ========================= */

    if (currentPage > 1) {

      const prev =
        document.createElement("a");

      prev.href =
        `?page=${currentPage - 1}`;

      prev.className =
        "page-btn";

      prev.innerHTML = "←";

      pagination.appendChild(prev);

    }

    /* =========================
       START
    ========================= */

    createPageBtn(1);

    if (totalPages >= 2) {

      createPageBtn(2);

    }

    /* =========================
       FIRST AREA
    ========================= */

    if (currentPage <= 3) {

      if (totalPages > 5) {

        createDots();

      }

    }

    /* =========================
       LAST AREA
    ========================= */

    else if (
      currentPage >= totalPages - 2
    ) {

      createDots();

      for (
        let i =
          totalPages - 3;

        i <= totalPages - 1;

        i++
      ) {

        if (i > 2) {

          createPageBtn(i);

        }

      }

    }

    /* =========================
       MIDDLE AREA
    ========================= */

    else {

      createDots();

      createPageBtn(currentPage);

      createPageBtn(currentPage + 1);

      createDots();

    }

    /* =========================
       LAST PAGE
    ========================= */

    if (totalPages > 2) {

      createPageBtn(totalPages);

    }

    /* =========================
       NEXT
    ========================= */

    if (currentPage < totalPages) {

      const next =
        document.createElement("a");

      next.href =
        `?page=${currentPage + 1}`;

      next.className =
        "page-btn";

      next.innerHTML = "→";

      pagination.appendChild(next);

    }

  }

  /* =========================
     CATEGORY FILTER
  ========================= */

  window.filterCategory =
    function (category, button) {

      currentPage = 1;

      if (category === "all") {

        filteredPosts =
          [...languagePosts];

      }

      else {

        filteredPosts =
          languagePosts.filter(post => {

            const cats =
              post.dataset.categories || "";

            return cats
              .toLowerCase()
              .includes(
                category.toLowerCase()
              );

          });

      }

      document
        .querySelectorAll(
          ".discover-cat-btn"
        )
        .forEach(btn => {

          btn.classList.remove(
            "active"
          );

        });

      button.classList.add(
        "active"
      );

      history.pushState(
        {},
        "",
        "?page=1"
      );

      renderPosts();

    };

  renderPosts();

});

document.addEventListener("DOMContentLoaded", () => {

  const hiddenPosts = document.querySelectorAll(
    "#related-posts-data .related-post-item"
  );

  const container = document.getElementById(
    "related-posts-container"
  );

  if (!hiddenPosts.length || !container) return;

  const posts = [...hiddenPosts];

  posts.sort(() => Math.random() - 0.5);

  const selected = posts.slice(0, 5);

  selected.forEach(post => {

    const title = post.dataset.title;
    const url = post.dataset.url;
    const image = post.dataset.image;

    container.insertAdjacentHTML(
      "beforeend",
      `
      <a href="${url}" class="related-post-card">

        <img
          src="${image}"
          alt="${title}"
          class="related-thumb"
          loading="lazy">

        <span class="related-title">
          ${title}
        </span>

      </a>
      `
    );

  });

});
const trendingPosts = [
  ...document.querySelectorAll(
    "#trending-posts-data .trending-post-item"
  )
];

const trendingContainer =
  document.getElementById(
    "trending-posts-container"
  );

if (trendingPosts.length && trendingContainer){

  trendingPosts.sort(
    () => Math.random() - 0.5
  );

  trendingPosts
    .slice(0,5)
    .forEach(post => {

      trendingContainer.insertAdjacentHTML(
        "beforeend",
        `
        <a href="${post.dataset.url}"
           class="related-post-card">

          <img
            src="${post.dataset.image}"
            alt="${post.dataset.title}"
            class="related-thumb"
            loading="lazy">

          <span class="related-title">
            ${post.dataset.title}
          </span>

        </a>
        `
      );

    });

}
