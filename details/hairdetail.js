// =================== GLOBAL STATE ===================
// Change this:
// const API_BASE_URL = "https://...";

// To this:
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = "https://hairstyle-hub-backend.onrender.com/api";
}
const HAIRCUTS_DATA_PATH = `${API_BASE_URL}/haircuts`;
const PARAMS = new URLSearchParams(window.location.search);
const HAIRCUT_ID = PARAMS.get("id");

let currentHaircut = null;
let currentUser = null; 
let comments = []; 
let isLikePending = false;

// =================== ZOOM / LIGHTBOX LOGIC ===================
const setupImageZoom = () => {
    let lightbox = document.getElementById('lightboxOverlay');
    
    // Create lightbox if it doesn't exist
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightboxOverlay';
        lightbox.className = 'lightbox-overlay';
        lightbox.innerHTML = `<img src="" alt="Zoomed View">`;
        document.body.appendChild(lightbox);
        
        lightbox.onclick = () => lightbox.classList.remove('active');
    }

    const mainImg = document.querySelector(".haircut-image img");
    if (mainImg) {
        mainImg.onclick = () => {
            const zoomImg = lightbox.querySelector('img');
            zoomImg.src = mainImg.src;
            lightbox.classList.add('active');
        };
    }
};
// =================== LOADER FUNCTIONS ===================
const showPageLoader = () => {
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        loader.classList.remove('loader-hidden');
    }
};

const hidePageLoader = () => {
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        loader.classList.add('loader-hidden');
    }
};

const showSkeleton = () => {
    const container = document.getElementById("haircutContainer");
    const relatedContainer = document.getElementById("relatedHaircutsContainer");
    const commentsContainer = document.getElementById("commentList");
    
    if (container) {
        container.innerHTML = `
            <div class="skeleton-details">
                <div class="skeleton-title shimmer"></div>
                <div class="skeleton-image shimmer"></div>
                <div class="skeleton-actions">
                    <div class="skeleton-action-btn shimmer"></div>
                    <div class="skeleton-action-btn shimmer"></div>
                    <div class="skeleton-like shimmer"></div>
                </div>
                <div class="skeleton-info">
                    <div class="skeleton-line shimmer"></div>
                    <div class="skeleton-line shimmer"></div>
                    <div class="skeleton-line shimmer"></div>
                </div>
                <div class="skeleton-tags">
                    <div class="skeleton-tag shimmer"></div>
                    <div class="skeleton-tag shimmer"></div>
                    <div class="skeleton-tag shimmer"></div>
                </div>
            </div>
        `;
    }
    
    if (relatedContainer) {
        relatedContainer.innerHTML = `
            <div class="skeleton-related">
                <div class="skeleton-section-title shimmer"></div>
                <div class="skeleton-related-grid">
                    ${Array(4).fill(0).map(() => `
                        <div class="skeleton-related-card">
                            <div class="skeleton-related-img shimmer"></div>
                            <div class="skeleton-related-info">
                                <div class="skeleton-related-title shimmer"></div>
                                <div class="skeleton-related-meta shimmer"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    if (commentsContainer) {
        commentsContainer.innerHTML = `
            <div class="skeleton-comments">
                ${Array(3).fill(0).map(() => `
                    <div class="skeleton-comment">
                        <div class="skeleton-avatar shimmer"></div>
                        <div class="skeleton-comment-content">
                            <div class="skeleton-comment-header shimmer"></div>
                            <div class="skeleton-comment-text shimmer"></div>
                            <div class="skeleton-comment-text shimmer short"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};
const showError = (message) => {
    const container = document.getElementById("haircutContainer");
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">Try Again</button>
            </div>
        `;
    }
    hidePageLoader();
};

// =================== UTILITIES ===================
const normalizeId = (obj) => {
    if (!obj) return null;
    return obj.$oid || obj._id || obj;
};

/**
 * Handle 401 Unauthorized globally for this page
 */
const handleAuthError = () => {
    console.error("Session expired or unauthorized. Logging out UI.");
    currentUser = null;
    updateAuthDependentUI();
};

/**
 * Robust helper to find Firebase Auth.
 */
function getFirebaseAuth() {
    return new Promise((resolve) => {
        const auth = window.firebaseAuth || window.auth;
        if (auth) return resolve(auth);

        const interval = setInterval(() => {
            const currentAuth = window.firebaseAuth || window.auth;
            if (currentAuth) {
                clearInterval(interval);
                resolve(currentAuth);
            }
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            if (!(window.firebaseAuth || window.auth)) resolve(null);
        }, 5000);
    });
}

// =================== AUTH STATE MANAGEMENT ===================
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

// =================== INIT LIFECYCLE ===================
document.addEventListener("DOMContentLoaded", init);

async function init() {
    if (!HAIRCUT_ID) {
        showError("No haircut ID provided in URL");
        return;
    }

    // Show page loader and skeletons
    showPageLoader();
    showSkeleton();

    // 1. Setup Static Event Listeners
    setupStaticEventListeners();

    // 2. Setup Auth Observer
    const authInstance = await getFirebaseAuth();
    if (authInstance) {
        authInstance.onAuthStateChanged(async (user) => {
            currentUser = user;
            // Update the header/navbar auth section
            updateNavigationUI(user);
            // Update comment form and other auth-dependent UI
            updateAuthDependentUI();
            
            // Load data after auth state is known
            if (!currentHaircut) {
                await loadHaircutData();
            } else {
                // Refresh like status if user changes
                await checkLikeStatus();
            }
        });
    } else {
        // If no auth instance, still load data
        await loadHaircutData();
    }
}

/**
 * Finds related haircuts using a prioritized matching strategy.
 */
function getRelatedHaircuts(current, all) {
    if (!current || !Array.isArray(all)) return [];

    const currentId = normalizeId(current);
    const currentFace = Array.isArray(current.faceShape) ? current.faceShape : [];
    const currentType = Array.isArray(current.hairType) ? current.hairType : [];

    return all
        .filter(item => {
            const itemId = normalizeId(item);
            if (itemId === currentId) return false;

            const itemFace = Array.isArray(item.faceShape) ? item.faceShape : [];
            const itemType = Array.isArray(item.hairType) ? item.hairType : [];

            const faceMatch = itemFace.some(shape => currentFace.includes(shape));
            const typeMatch = itemType.some(type => currentType.includes(type));
            const lengthMatch = item.hairLength === current.hairLength;

            return faceMatch || typeMatch || lengthMatch;
        })
        .slice(0, 8);
}

/**
 * Render the related haircuts into the UI
 */
function renderRelatedHaircuts(list) {
    const container = document.getElementById("relatedHaircutsContainer");
    if (!container) {
        console.error("Related container not found in HTML!");
        return;
    }

    if (list.length === 0) {
        container.innerHTML = ""; 
        return;
    }

    container.innerHTML = `
        <h2 style="margin-top: 40px; margin-bottom: 20px;">Related Styles</h2>
        <div class="related-grid">
            ${list.map(h => {
                const id = normalizeId(h);
                return `
                    <div class="related-card" onclick="window.location.search = '?id=${id}'">
                        <img src="${h.imageUrl}" alt="${h.name}" loading="lazy" onerror="this.src='../assets/placeholder.jpg'">
                        <div class="related-info">
                            <h4>${h.name}</h4>
                            <p>${h.hairLength}</p>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

// =================== DATA LOADING ===================
async function loadHaircutData() {
    try {
        const res = await fetch(HAIRCUTS_DATA_PATH);
        if (!res.ok) throw new Error("Data fetch failed");
        const allData = await res.json();

        const haircut = allData.find(x => normalizeId(x) === HAIRCUT_ID);
        if (!haircut) {
            showError("Haircut not found");
            return;
        }
        
        currentHaircut = haircut;
        const index = allData.findIndex(x => normalizeId(x) === HAIRCUT_ID);

        // Primary Render
        renderHaircutDetails(currentHaircut);
        handleNavigation(allData, index);
        
        // Related Content
        const related = getRelatedHaircuts(currentHaircut, allData);
        renderRelatedHaircuts(related);

        // Fetch Comments
        await fetchComments();
        
        // Setup buttons that need haircut data
        setupDynamicEventListeners(currentHaircut);
        setupImageZoom();
        // Check like status
        await checkLikeStatus();
        
        // Hide loader after everything is loaded
        setTimeout(hidePageLoader, 300);
        
    } catch (e) {
        console.error("Load error:", e);
        showError("Failed to load haircut details.");
    }
}

// =================== LIKE LOGIC ===================
async function checkLikeStatus() {
    if (!HAIRCUT_ID) return;
    const saveBtn = document.getElementById("saveBtn");
    const countDisplay = document.getElementById("likeCount");

    try {
        let headers = { 'Content-Type': 'application/json' };
        if (currentUser) {
            const token = await currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE_URL}/haircuts/${HAIRCUT_ID}/like-status`, { headers });
        if (res.status === 401) return handleAuthError();
        
        const data = await res.json();

        if (saveBtn) {
            const hasLiked = !!data.hasLiked;
            saveBtn.classList.toggle("saved", hasLiked);
            saveBtn.style.color = hasLiked ? "red" : ""; 
        }
        if (countDisplay) countDisplay.innerText = `${data.likesCount || 0} Likes`;

    } catch (err) {
        console.error("Like status check failed:", err);
    }
}

/**
 * Manages the Like/Save toggle logic with concurrency protection.
 */
async function toggleLike() {
    if (!currentUser) {
        alert("Please login to like styles!");
        return;
    }
    
    if (isLikePending || !HAIRCUT_ID) return;

    const btn = document.getElementById("saveBtn");
    const countDisplay = document.getElementById("likeCount");
    
    isLikePending = true;
    btn.style.opacity = "0.5";

    try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API_BASE_URL}/haircuts/${HAIRCUT_ID}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.status === 401) return handleAuthError();
        
        if (res.ok) {
            const data = await res.json();
            const hasLiked = !!data.liked;
            btn.classList.toggle("saved", hasLiked);
            btn.style.color = hasLiked ? "red" : "";
            if (countDisplay) countDisplay.innerText = `${data.likesCount} Likes`;
        }
    } catch (err) {
        console.error("Like toggle failed:", err);
    } finally {
        isLikePending = false;
        btn.style.opacity = "1";
    }
}

// =================== COMMENTS ===================
async function fetchComments() {
    const list = document.getElementById("commentList");
    if (list) list.innerHTML = "<div class='loading-comments'>Loading comments...</div>";

    try {
        const res = await fetch(`${API_BASE_URL}/comments/${HAIRCUT_ID}`);
        if (!res.ok) throw new Error("Failed to fetch comments");
        comments = await res.json();
        displayComments(comments);
    } catch (err) {
        console.error("Failed to fetch comments", err);
        if (list) list.innerHTML = "<p class='comments-error'>Could not load comments.</p>";
    }
}

function formatCommentDate(dateSource) {
    if (!dateSource) return "";
    
    const dateValue = dateSource.$date ? new Date(dateSource.$date) : new Date(dateSource);
    
    return dateValue.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Renders comments safely
 */
function displayComments(commentsArray = comments) {
    const list = document.getElementById("commentList");
    if (!list) return;

    if (!commentsArray || commentsArray.length === 0) {
        list.innerHTML = "<p class='no-comments'>No comments yet. Be the first to comment!</p>";
        return;
    }

    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    };

    list.innerHTML = commentsArray.map(c => {
        const cid = normalizeId(c);
        const isOwner = currentUser && (currentUser.uid === c.userId);
        const safeText = escapeHTML(c.text);

        return `
            <div class="comment-item" id="comment-${cid}">
                <img src="${c.userPhoto || '../assets/placeholder.jpg'}" class="comment-avatar" onerror="this.src='../assets/placeholder.jpg'">
                <div class="comment-content">
                    <div class="comment-header">
                        <strong>${escapeHTML(c.userName || 'Anonymous')}</strong>
                        <small>${formatCommentDate(c.createdAt)}</small>
                    </div>
                    <div id="text-container-${cid}">
                        <p class="comment-text">${safeText}</p>
                    </div>
                    ${isOwner ? `
                        <div class="comment-actions">
                            <button class="edit-btn" onclick="enterEditMode('${cid}', \`${safeText.replace(/`/g, '\\`')}\`)">Edit</button>
                            <button class="delete-btn" onclick="deleteComment('${cid}')">Delete</button>
                        </div>
                    ` : ''}
                </div>
            </div>`;
    }).join("");
}

// Global functions for comment editing
window.enterEditMode = enterEditMode;
window.deleteComment = deleteComment;
window.saveEdit = saveEdit;
window.toggleLike = toggleLike;

async function enterEditMode(commentId, currentText) {
    const container = document.getElementById(`text-container-${commentId}`);
    container.innerHTML = `
        <textarea class="edit-textarea" id="edit-input-${commentId}">${currentText}</textarea>
        <button class="save-edit-btn" onclick="saveEdit('${commentId}')">Save</button>
        <button class="cancel-edit-btn" onclick="displayComments()">Cancel</button>
    `;
}

async function saveEdit(commentId) {
    const input = document.getElementById(`edit-input-${commentId}`);
    if (!input) return;
    
    const newText = input.value.trim();
    if (!newText || !currentUser) return;

    try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text: newText })
        });

        if (res.status === 401) return handleAuthError();
        if (res.ok) {
            const idx = comments.findIndex(c => normalizeId(c) === commentId);
            if (idx !== -1) comments[idx].text = newText;
            displayComments();
        }
    } catch (err) { 
        console.error("Edit failed:", err);
        alert("Failed to save edit");
    }
}

async function deleteComment(commentId) {
    if (!confirm("Delete this comment?")) return;

    try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) return handleAuthError();
        if (res.ok) {
            comments = comments.filter(c => normalizeId(c) !== commentId);
            displayComments();
        }
    } catch (err) { 
        console.error("Delete failed:", err);
        alert("Failed to delete comment");
    }
}

// =================== AUTH & SUBMISSION ===================
function updateAuthDependentUI() {
    // 1. Update Comment Form
    const authMsg = document.getElementById("authMessage");
    const input = document.getElementById("commentInput");
    const btn = document.getElementById("submitComment");

    if (currentUser) {
        authMsg.innerHTML = `<span>Commenting as: <b>${currentUser.displayName}</b></span>`;
        input.disabled = false;
        btn.disabled = false;
    } else {
        authMsg.innerHTML = `<p>🔒 Please Login to comment</p>`;
        input.disabled = true;
        btn.disabled = true;
    }

    // 2. Re-render comments to show/hide Edit-Delete buttons
    displayComments();

    // 3. Update Like Button status
    checkLikeStatus();
}

function setupStaticEventListeners() {
    const submitBtn = document.getElementById("submitComment");
    const commentInput = document.getElementById("commentInput");

    if (submitBtn && commentInput) {
        // Enter key support
        commentInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitBtn.click();
            }
        });

        submitBtn.onclick = async () => {
            const text = commentInput.value.trim();
            if (text.length < 5) {
                alert("Comment must be at least 5 characters.");
                return;
            }
            if (!currentUser) {
                alert("Please login first!");
                return;
            }

            submitBtn.disabled = true;
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Sending...";

            try {
                const token = await currentUser.getIdToken();
                const response = await fetch(`${API_BASE_URL}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        haircutId: HAIRCUT_ID, 
                        text 
                    })
                });

                if (response.ok) {
                    const savedComment = await response.json();
                    comments.unshift(savedComment);
                    displayComments(comments);
                    commentInput.value = "";
                } else {
                    alert("Failed to post comment. Try again.");
                }
            } catch (error) {
                console.error(error);
                alert("Server error. Please try again.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
            }
        };
    }

    // Close share options when clicking outside
    document.addEventListener("click", (e) => {
        const shareOptions = document.getElementById("shareOptions");
        if (shareOptions && !shareOptions.contains(e.target) && 
            !e.target.closest("#shareBtn")) {
            shareOptions.classList.remove("open");
        }
    });
}

// =================== HELPERS (UI/NAV) ===================
function handleNavigation(data, currentIndex) {
    const prevBtn = document.getElementById("prevHaircut");
    const nextBtn = document.getElementById("nextHaircut");

    if (prevBtn) {
        if (currentIndex > 0) {
            const prevId = normalizeId(data[currentIndex - 1]);
            prevBtn.onclick = () => window.location.search = `?id=${prevId}`;
            prevBtn.style.visibility = "visible";
        } else {
            prevBtn.style.visibility = "hidden";
        }
    }

    if (nextBtn) {
        if (currentIndex < data.length - 1) {
            const nextId = normalizeId(data[currentIndex + 1]);
            nextBtn.onclick = () => window.location.search = `?id=${nextId}`;
            nextBtn.style.visibility = "visible";
        } else {
            nextBtn.style.visibility = "hidden";
        }
    }
}

function renderHaircutDetails(h) {
    const container = document.getElementById("haircutContainer");
    if (!container) return;
    
    const tagsHtml = (h.tags || []).map(t => `<span class="tag">${t}</span>`).join("");
    
    container.innerHTML = `
        <h1>${h.name}</h1>
        <div class="haircut-image">
            <img src="${h.imageUrl}" alt="${h.name}" onerror="this.src='../assets/placeholder.jpg'">
            <div class="details-actions">
                <div id="shareBtn" class="btn"><i class="fa-solid fa-share"></i></div>
                <div id="saveBtn" class="btn"><i class="fa-solid fa-heart"></i></div>
                <span id="likeCount" class="like-counter">0 Likes</span>
            </div>
            <div id="shareOptions" class="share-options">
                <button data-platform="whatsapp"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>
                <button data-platform="copy"><i class="fa-solid fa-link"></i> Copy Link</button>
            </div>
        </div>
        <div class="haircut-info">
            <p><b>Hair Length:</b> ${h.hairLength || 'N/A'}</p>
            <p><b>Hair Type:</b> ${(h.hairType || []).join(", ") || 'N/A'}</p>
            <p><b>Face Shape:</b> ${(h.faceShape || []).join(", ") || 'N/A'}</p>
        </div>
        <div class="tags">${tagsHtml}</div>
    `;
}

function setupDynamicEventListeners(h) {
    const shareBtn = document.getElementById("shareBtn");
    const shareOptions = document.getElementById("shareOptions");
    const saveBtn = document.getElementById("saveBtn");

    if (shareBtn && shareOptions) {
        shareBtn.onclick = (e) => {
            e.stopPropagation();
            shareOptions.classList.toggle("open");
        };
    }

    if (shareOptions) {
        shareOptions.querySelectorAll("button").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const platform = btn.getAttribute("data-platform");
                const currentUrl = window.location.href;
                const message = `Check out this haircut: ${h.name} - ${currentUrl}`;
                
                if (platform === "whatsapp") {
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
                } else if (platform === "copy") {
                    navigator.clipboard.writeText(currentUrl)
                        .then(() => alert("Link copied to clipboard!"))
                        .catch(() => alert("Failed to copy link"));
                }
                shareOptions.classList.remove("open");
            };
        });
    }

    if (saveBtn) {
        saveBtn.onclick = toggleLike;
    }
}