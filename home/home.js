(function() {
    "use strict";

    const API_BASE_URL = "https://hairstyle-hub-backend.onrender.com/api";
    const HAIRCUTS_DATA_PATH = `${API_BASE_URL}/haircuts`;
    // Show loading skeletons while data loads
    const showSkeletons = (containerId, count = 6) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = Array(count).fill(0).map(() => `
            <div class="skeleton-card"></div>
        `).join('');
    };

    // 1. Initialize logic
    async function init() {
        try {
            // Show skeletons while loading
            showSkeletons("top10Container", 10);
            showSkeletons("trendingContainer", 7);

            const response = await fetch(HAIRCUTS_DATA_PATH);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Guard: Ensure data is an array before proceeding
            if (!Array.isArray(data)) {
                console.error("API did not return an array:", data);
                
                // Show error message to user
                document.getElementById("top10Container").innerHTML = 
                    "<p class='error-message'>Failed to load styles. Please try again later.</p>";
                document.getElementById("trendingContainer").innerHTML = 
                    "<p class='error-message'>Failed to load trends.</p>";
                return;
            }

            initHomePage(data);
            
            // Optional: Check if user is logged in (if Firebase is set up)
            // firebase.auth().onAuthStateChanged(updateNavigationUI);
            
        } catch (error) {
            console.error("Error loading data from Render:", error);
            
            // Show user-friendly error messages
            const top10Container = document.getElementById("top10Container");
            const trendingContainer = document.getElementById("trendingContainer");
            
            if (top10Container) {
                top10Container.innerHTML = 
                    "<p class='error-message'>Failed to load styles. Please check your connection.</p>";
            }
            
            if (trendingContainer) {
                trendingContainer.innerHTML = 
                    "<p class='error-message'>Failed to load trending styles.</p>";
            }
        }
    }

    function updateNavigationUI(user) {
        const loginBtn = document.getElementById("googleLoginBtn");
        const avatarDiv = document.querySelector(".user-avatar");
        const nameEl = document.querySelector(".user-name");
        const authContainer = document.querySelector(".nav-auth-container");

        if (user) {
            // ✅ USER LOGGED IN
            if (loginBtn) loginBtn.style.display = "none";

            // Show avatar and name
            if (avatarDiv) {
                avatarDiv.style.display = "block";
                avatarDiv.innerHTML = `<img src="${user.photoURL}" style="width:35px; border-radius:50%; border: 2px solid #ff4d6d;">`;
            }
            if (nameEl) {
                nameEl.style.display = "block";
                nameEl.textContent = user.displayName.split(' ')[0];
            }

            // Make the whole container clickable
            if (authContainer) {
                authContainer.style.cursor = "pointer";
                authContainer.onclick = () => {
                    window.location.href = "../profile/profile.html";
                };
            }

        } else {
            // ❌ USER LOGGED OUT
            if (loginBtn) loginBtn.style.display = "flex";
            
            if (avatarDiv) {
                avatarDiv.style.display = "none";
                avatarDiv.innerHTML = "";
            }
            
            if (nameEl) {
                nameEl.style.display = "none";
                nameEl.textContent = "";
            }

            // Remove click logic when logged out
            if (authContainer) {
                authContainer.style.cursor = "default";
                authContainer.onclick = null;
            }
        }
    }

    function getTrendingHaircuts(data) {
        return data
            .filter(item => item && item.isTrending === true)
            .slice(0, 7);
    }

    function getTop10Haircuts(data) {
        return [...data]
            .sort((a, b) => {
                // Handle both MongoDB $date format and regular timestamps
                const dateA = new Date(a.createdAt?.$date || a.createdAt || 0);
                const dateB = new Date(b.createdAt?.$date || b.createdAt || 0);
                return dateB - dateA; // Sort descending (newest first)
            })
            .slice(0, 10);
    }

    function createCard(haircut) {
        // Safe ID Extraction
        const id = haircut._id?.$oid || haircut._id || haircut.id || '';
        
        // Use a fallback image if imageUrl is missing
        const imgUrl = haircut.imageUrl || haircut.image || '../assets/placeholder.jpg';
        
        // Clean name for alt text
        const name = haircut.name || haircut.title || 'Haircut Style';
        const displayName = name.length > 30 ? name.substring(0, 30) + '...' : name;

        return `
            <div class="card" data-id="${id}">
                <img loading="lazy" src="${imgUrl}" alt="${name}" onerror="this.src='../assets/placeholder.jpg'">
                <h3 class="card-title">${displayName}</h3>
                <a class="viewDetailsLink" href="../details/hairdetail.html?id=${encodeURIComponent(id)}">
                    View Details
                </a>
            </div>
        `;
    }

    function renderHaircuts(containerId, items) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container #${containerId} not found in HTML.`);
            return;
        }
        
        if (!items || items.length === 0) {
            container.innerHTML = "<p class='no-data'>No styles found.</p>";
            return;
        }

        container.innerHTML = items.map(createCard).join("");
    }

    function initHomePage(data) {
        const top10 = getTop10Haircuts(data);
        const trending = getTrendingHaircuts(data);

        renderHaircuts("top10Container", top10);
        renderHaircuts("trendingContainer", trending);
    }

    // Handle page loader
    window.addEventListener('load', () => {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    });

    // Start the script
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        // DOM already loaded
        setTimeout(init, 100); // Small delay to ensure DOM is ready
    }

})();