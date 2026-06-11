document.addEventListener("DOMContentLoaded", () => {

  const POSTS_PER_PAGE = 2;

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


