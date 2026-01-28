const API_BASE_URL = "http://localhost:5000/api";

/**
 * HELPER: Get Fresh Token
 * Never trust localStorage alone; Firebase refreshes the token automatically.
 */
async function getAuthHeader() {
    const user = window.firebaseAuth?.currentUser; // Ensure you expose auth to window
    if (!user) return {};
    
    try {
        const token = await user.getIdToken();
        return { 'Authorization': `Bearer ${token}` };
    } catch (e) {
        console.error("Token Retrieval Failed:", e);
        return {};
    }
}

export async function addComment(haircutId, text) {
    console.log(`🚀 Sending comment to ${haircutId}...`);
    
    try {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${API_BASE_URL}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify({ haircutId, text })
        });

        // VITAL: Identify failures before parsing JSON
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server responded with ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.error("❌ addComment Error:", err.message);
        throw err; // Re-throw so the UI can show an alert
    }
}

export async function getComments(haircutId) {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${haircutId}`);
        if (!response.ok) throw new Error("Failed to fetch comments");
        return await response.json();
    } catch (err) {
        console.error("❌ getComments Error:", err);
        return []; // Return empty array to avoid breaking the UI
    }
}