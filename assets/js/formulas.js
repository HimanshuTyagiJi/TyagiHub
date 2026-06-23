document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const classFilter = urlParams.get('class');

    if (classFilter) {
        filterFormulas('class', classFilter);
        setActiveButton('class', classFilter);
    }

    // Live Instant Search Bar
    const searchInput = document.getElementById('formula-search');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.formula-card').forEach(card => {
                const title = card.querySelector('.formula-title').innerText.toLowerCase();
                const desc = card.querySelector('.formula-desc').innerText.toLowerCase();
                card.style.display = (title.includes(query) || desc.includes(query)) ? "block" : "none";
            });
            checkEmptyCategories();
        });
    }
});

function setFilter(type, value) {
    const url = new URL(window.location);
    url.searchParams.set(type, value);
    window.history.pushState({}, '', url);
    filterFormulas(type, value);
    
    // Toggle active state manually on click
    document.querySelectorAll(`[data-filter-${type}]`).forEach(b => b.classList.remove('active-filter'));
    const targetBtn = document.querySelector(`[data-filter-${type}="${value}"]`);
    if (targetBtn) targetBtn.classList.add('active-filter');
}

function filterFormulas(type, value) {
    document.querySelectorAll('.formula-card').forEach(card => {
        const allowed = card.getAttribute(`data-${type}s`).split(',');
        card.style.display = allowed.includes(value) ? "block" : "none";
    });
    checkEmptyCategories();
}

function clearFilters() {
    const url = new URL(window.location);
    url.searchParams.delete('class');
    window.history.pushState({}, '', url);
    
    document.querySelectorAll(`[data-filter-class]`).forEach(b => b.classList.remove('active-filter'));
    document.querySelectorAll('.formula-card').forEach(card => card.style.display = "block");
    checkEmptyCategories();
}

function checkEmptyCategories() {
    document.querySelectorAll('.category-section').forEach(cat => {
        const visible = cat.querySelectorAll('.formula-card:not([style*="display: none"])');
        cat.style.display = visible.length === 0 ? "none" : "block";
    });
}

function setActiveButton(type, value) {
    const btn = document.querySelector(`[data-filter-${type}="${value}"]`);
    if (btn) btn.classList.add('active-filter');
}
