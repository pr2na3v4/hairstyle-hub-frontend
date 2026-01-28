(function () {
  "use strict";

  // ==========================================
  // CONFIGURATION & STATE
  // ==========================================
  const API_URL = "https://hairstyle-hub-backend.onrender.com/api/haircuts";
  
  let allHaircuts = []; 
  let activeFilters = {
    search: "",
    category: "all" 
  };

  // Helper to get string ID regardless of format ($oid vs string)
  const getCleanId = (item) => {
    if (!item) return null;
    return item._id?.$oid || item._id || item.id;
  };

  // Show skeleton loading placeholders
  const showSkeletons = (containerId, count = 12) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = Array(count).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-img"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-btn"></div>
      </div>
    `).join('');
  };

  // Hide page loader
  window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.style.display = 'none', 500);
    }
  });

  // ==========================================
  // INIT & FETCH
  // ==========================================
  async function init() {
    const container = document.getElementById("allHaircutsContainer");
    if (container) {
      showSkeletons("allHaircutsContainer", 12);
    }

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Expected an array of haircuts");
      
      allHaircuts = data;
      setupEventListeners();
      applyFilters(); 
      updateResultCount(allHaircuts.length);

    } catch (error) {
      console.error("Fetch Error:", error);
      if (container) {
        container.innerHTML = `
          <div class="error-msg">
            <h3>Backend is waking up...</h3>
            <p>Render's free tier takes about 60 seconds to start. Please wait a moment.</p>
            <button onclick="window.location.reload()" class="retry-btn">Refresh Now</button>
          </div>`;
      }
    }
  }

  // ==========================================
  // FILTER ENGINE
  // ==========================================
  function applyFilters() {
    const filtered = allHaircuts.filter(item => {
      if (!item) return false;

      // 1. Search Logic
      const searchTerm = activeFilters.search.toLowerCase().trim();
      const name = String(item.name || "").toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags.join(" ").toLowerCase() : "";
      
      const matchesSearch = !searchTerm || name.includes(searchTerm) || tags.includes(searchTerm);

      // 2. Category / Trending Logic
      let matchesCategory = true;
      const category = activeFilters.category.toLowerCase();

      if (category === "trending") {
        matchesCategory = item.isTrending === true;
      } else if (category === "new") {
        // Show items from last 14 days (expanded for better results)
        const dateStr = item.createdAt?.$date || item.createdAt;
        const itemDate = dateStr ? new Date(dateStr) : new Date(0);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        matchesCategory = itemDate >= twoWeeksAgo;
      } else if (category !== "all") {
        const faceShapes = (item.faceShape || []).map(s => String(s).toLowerCase());
        const hType = String(item.hairType || "").toLowerCase();
        const hLength = String(item.hairLength || "").toLowerCase();
        const style = String(item.styleType || "").toLowerCase();

        matchesCategory = faceShapes.includes(category) || 
                          hType === category || 
                          hLength === category ||
                          style === category;
      }

      return matchesSearch && matchesCategory;
    });

    renderGrid(filtered);
    updateResultCount(filtered.length);
  }

  // ==========================================
  // RENDERING
  // ==========================================
  function renderGrid(data) {
    const container = document.getElementById("allHaircutsContainer");
    if (!container) return;

    if (data.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <h3>No matching hairstyles</h3>
          <p>Try different keywords or categories</p>
          <button onclick="resetFilters()" class="reset-btn">Clear All</button>
        </div>`;
      return;
    }

    container.innerHTML = data.map(item => {
      const id = getCleanId(item);
      const imageUrl = item.imageUrl || '../assets/placeholder.jpg';
      const trendingBadge = item.isTrending ? '<span class="trending-badge">🔥 Trending</span>' : '';

      return `
        <div class="card">
          <div class="img-box">
            <img src="${imageUrl}" alt="${item.name}" loading="lazy" onerror="this.src='../assets/placeholder.jpg'">
            ${trendingBadge}
          </div>
          <div class="card-info">
            <h3>${item.name || "Unnamed Style"}</h3>
            <div class="card-meta">
              <span>${item.hairLength || ''}</span>
              <span>${item.hairType || ''}</span>
            </div>
            <a class="details-btn" href="../details/hairdetail.html?id=${id}">
              View Details
            </a>
          </div>
        </div>
      `;
    }).join("");
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  function setupEventListeners() {
    // Search with Debounce
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", debounce((e) => {
        activeFilters.search = e.target.value;
        applyFilters();
      }, 300));
    }

    // Category Links
    document.querySelectorAll(".filter-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelectorAll(".filter-link").forEach(l => l.classList.remove("active"));
        e.currentTarget.classList.add("active");
        activeFilters.category = e.currentTarget.dataset.filter;
        applyFilters();
      });
    });
  }

  function resetFilters() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";
    document.querySelectorAll(".filter-link").forEach(l => l.classList.remove("active"));
    const allBtn = document.querySelector('[data-filter="all"]');
    if (allBtn) allBtn.classList.add("active");

    activeFilters = { search: "", category: "all" };
    applyFilters();
  }

  function updateResultCount(count) {
    const countEl = document.getElementById("resultCount");
    if (countEl) countEl.textContent = `${count} Styles Found`;
  }

  function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }

  // Global exposure for the "Clear All" button in the "No Results" view
  window.resetFilters = resetFilters;

  init();

})();