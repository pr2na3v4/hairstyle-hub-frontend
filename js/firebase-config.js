import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"; // <-- ADD updateProfile HERE

const firebaseConfig = {
  apiKey: "AIzaSyA9ptGsJbPvZFLAPMoWum1wnIv3q9hI8XE",
  authDomain: "hairstylehub-aaff8.firebaseapp.com",
  projectId: "hairstylehub-aaff8",
  storageBucket: "hairstylehub-aaff8.firebasestorage.app",
  messagingSenderId: "271269922724",
  appId: "1:271269922724:web:1aeac0983691c33423a331",
  measurementId: "G-ZBHHGGBFYW"
};

// 1. Initialize
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// 2. ✅ GLOBAL BRIDGE - This stops the TIMEOUT error
window.firebaseAuth = auth; 
window.googleProvider = provider;
window.updateFirebaseProfile = updateProfile; // <-- ADD THIS BRIDGE
console.log("🚀 Firebase Initialized and exported to window.firebaseAuth");