/**
 * PROFILE PAGE LOGIC - WITH IMAGE ZOOM
 */

const API_BASE_URL = "https://hairstyle-hub-backend.onrender.com/api";
const CLOUD_NAME = "dgd1rnqe1"; 
const UPLOAD_PRESET = "profile_pics"; 
let currentUser = null;

// =================== DOM ELEMENTS ===================
const elements = {
    loader: () => document.getElementById("loader-wrapper"),
    userName: () => document.getElementById("userName"),
    userEmail: () => document.getElementById("userEmail"),
    userPhoto: () => document.getElementById("userPhoto"),
    editModal: () => document.getElementById("editModal"),
    editProfileBtn: () => document.getElementById("editProfileBtn"),
    closeModalBtn: () => document.getElementById("closeModalBtn"),
    saveProfileBtn: () => document.getElementById("saveProfileBtn"),
    editNameInput: () => document.getElementById("editNameInput"),
    editPhotoInput: () => document.getElementById("editPhotoInput"),
    imagePreview: () => document.getElementById("imagePreview"),
    likesGrid: () => document.getElementById("likesGrid"),
    commentsList: () => document.getElementById("commentsList"),
    logoutBtn: () => document.getElementById("logoutBtn")
};

// Add this at the top of profile.js
const normalizeId = (obj) => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    return obj.$oid || obj._id || obj;
};
// =================== LIGHTBOX LOGIC ===================
const setupImageZoom = () => {
    // Create lightbox element dynamically if it doesn't exist
    let lightbox = document.getElementById('imageLightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'imageLightbox';
        lightbox.className = 'image-lightbox';
        lightbox.innerHTML = `<img src="" alt="Zoomed Profile">`;
        document.body.appendChild(lightbox);
        
        lightbox.onclick = () => lightbox.classList.remove('active');
    }

    // Make the profile photo clickable
    const photoEl = elements.userPhoto();
    if (photoEl) {
        photoEl.style.cursor = 'zoom-in';
        photoEl.onclick = () => {
            const fullImg = lightbox.querySelector('img');
            fullImg.src = photoEl.src;
            lightbox.classList.add('active');
        };
    }
};

// =================== AUTH MANAGEMENT ===================
const setupAuthListener = () => {
    const auth = window.firebaseAuth || window.auth || (window.firebase && window.firebase.auth());
    if (!auth) {
        setTimeout(setupAuthListener, 200);
        return;
    }

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            updateUserProfileUI(user);
            setupImageZoom(); // Initialize zoom after UI updates
            await loadUserData(user);
        } else {
            window.location.href = "../login/login.html";
        }
    });
};

const updateUserProfileUI = (user) => {
    const nameEl = elements.userName();
    const emailEl = elements.userEmail();
    const photoEl = elements.userPhoto();
    
    if (nameEl) nameEl.innerText = user.displayName || "User";
    if (emailEl) emailEl.innerText = user.email || "";
    if (photoEl) {
        photoEl.src = user.photoURL || "https://www.w3schools.com/howto/img_avatar.png";
    }
};

// =================== DATA LOADING (LIKES/COMMENTS) ===================
const loadUserData = async (user) => {
    showSpinner();
    try {
        const token = await user.getIdToken();
        await Promise.all([
            loadUserLikes(token),
            loadUserComments(token)
        ]);
    } catch (err) {
        console.error("Error loading user data:", err);
    } finally {
        hideSpinner();
    }
};

const loadUserLikes = async (token) => {
    const container = elements.likesGrid();
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/users/me/likes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch likes");

        const data = await res.json();
        
        // Ensure we handle different possible API response structures
        const likesArray = Array.isArray(data) ? data : [];

        if (likesArray.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-heart"></i>
                    <p>You haven't liked any hairstyles yet.</p>
                    <a href="../home/home.html" class="discover-btn">Explore Styles</a>
                </div>`;
            return;
        }

        // 3. Render the cards
        container.innerHTML = likesArray.map(item => {
            // Support both direct objects or nested 'haircutId' objects from MongoDB populated fields
            const style = item.haircutId || item; 
            const styleId = normalizeId(style);

            return `
                <div class="card">
                    <img src="${style.imageUrl || 'https://via.placeholder.com/150'}" 
                         onerror="this.src='https://via.placeholder.com/150'">
                    <h4 class="card-title">${style.name || 'Style'}</h4>
                    <a href="../details/hairdetail.html?id=${styleId}" class="view-link">View Details</a>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Likes Load Error:", err);
        container.innerHTML = `
            <div class="error-state">
                <p>Error loading likes. Please try refreshing.</p>
            </div>`;
    }
};

const loadUserComments = async (token) => {
    const container = elements.commentsList();
    if (!container) return;
    try {
        const res = await fetch(`${API_BASE_URL}/users/me/comments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const commentsArray = await res.json();
        if (!Array.isArray(commentsArray) || commentsArray.length === 0) {
            container.innerHTML = "<p class='empty-statep'>No comments yet.</p>";
            return;
        }
        container.innerHTML = commentsArray.map(c => `
            <div class="comment-item" id="comment-container-${c._id?.$oid || c._id}">
                <p><strong>On: ${c.haircutName}</strong></p>
                <p class="comment-text">${c.text}</p>
                <button onclick="deleteProfileComment('${c._id?.$oid || c._id}')" class="delete-btn">Delete</button>
            </div>
        `).join("");
    } catch (err) { container.innerHTML = `<p>Error loading comments.</p>`; }
};

// =================== PROFILE EDITING & CLOUDINARY ===================
const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        return data.secure_url;
    } catch (err) { return null; }
};

const setupProfileEditing = () => {
    const modal = elements.editModal();
    const photoInput = elements.editPhotoInput();
    const preview = elements.imagePreview();

    if (photoInput) {
        photoInput.onchange = () => {
            const [file] = photoInput.files;
            if (file && preview) {
                preview.style.display = 'block';
                const reader = new FileReader();
                reader.onload = (e) => preview.src = e.target.result;
                reader.readAsDataURL(file);
            }
        };
    }

    if (elements.editProfileBtn()) {
        elements.editProfileBtn().onclick = () => {
            elements.editNameInput().value = currentUser.displayName || "";
            modal.style.display = "block";
        };
    }

    if (elements.closeModalBtn()) elements.closeModalBtn().onclick = () => modal.style.display = "none";

    if (elements.saveProfileBtn()) {
        elements.saveProfileBtn().onclick = async () => {
            const newName = elements.editNameInput().value.trim();
            const file = photoInput.files[0];
            let finalPhotoUrl = currentUser.photoURL;

            if (!newName) return alert("Name required");
            showSpinner();
            try {
                if (file) {
                    const uploadedUrl = await uploadImageToCloudinary(file);
                    if (uploadedUrl) finalPhotoUrl = uploadedUrl;
                }

                if (typeof window.updateFirebaseProfile === 'function') {
                    await window.updateFirebaseProfile(currentUser, { displayName: newName, photoURL: finalPhotoUrl });
                }

                const token = await currentUser.getIdToken();
                await fetch(`${API_BASE_URL}/users/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ displayName: newName, photoURL: finalPhotoUrl })
                });

                alert("Updated!");
                modal.style.display = "none";
                updateUserProfileUI(currentUser);
                location.reload(); // Refresh to ensure all states sync
            } catch (err) { alert("Update failed"); } finally { hideSpinner(); }
        };
    }
};

// =================== UTILS & INIT ===================
const showSpinner = () => { if (elements.loader()) elements.loader().style.display = "flex"; };
const hideSpinner = () => { if (elements.loader()) elements.loader().style.display = "none"; };

window.deleteProfileComment = async (id) => {
    if (!confirm("Delete?")) return;
    try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API_BASE_URL}/comments/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) document.getElementById(`comment-container-${id}`).remove();
    } catch (err) { alert("Error"); }
};

const setupLogout = () => {
    if (elements.logoutBtn()) {
        elements.logoutBtn().onclick = () => {
            const auth = window.firebaseAuth || window.auth || (window.firebase && window.firebase.auth());
            auth.signOut().then(() => window.location.href = "../home/home.html");
        };
    }
};

const initProfile = () => {
    setupAuthListener();
    setupProfileEditing();
    setupLogout();
};

initProfile();