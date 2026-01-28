// =====================================================================
// HairstyleHub Face Analysis Frontend Integration
// =====================================================================

// Configuration
const API_BASE_URL = 'http://localhost:8000';
const API_ENDPOINT = `${API_BASE_URL}/api/v1/analyze-and-recommend`;

// State Management
let analysisState = {
    currentPhoto: null,
    currentPhotoBlob: null,
    analysisResult: null,
    isProcessing: false
};

// Face Shape Icons and Descriptions
const FACE_SHAPES = {
    oval: {
        icon: '⭕',
        description: 'Balanced and proportionate - versatile with most hairstyles'
    },
    round: {
        icon: '🔴',
        description: 'Fuller cheeks and soft jawline - elongating styles work best'
    },
    square: {
        icon: '⬜',
        description: 'Strong jawline and defined features - textured styles complement well'
    },
    heart: {
        icon: '❤️',
        description: 'Wider forehead, narrower chin - styles with volume at bottom are ideal'
    },
    oblong: {
        icon: '⬛',
        description: 'Longer face proportions - styles with width add balance'
    },
    diamond: {
        icon: '💎',
        description: 'Wider cheekbones, narrow forehead and chin - layered styles work great'
    },
    triangle: {
        icon: '🔺',
        description: 'Wider jawline, narrower forehead - top volume adds balance'
    }
};

// =====================================================================
// 1. FILE UPLOAD & DRAG-AND-DROP
// =====================================================================

const photoInput = document.getElementById('photoInput');
const uploadSection = document.getElementById('uploadSection');

// File input change handler
photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handlePhotoSelection(file);
    }
});

// Drag and drop handlers
uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSection.classList.add('drag-over');
});

uploadSection.addEventListener('dragleave', () => {
    uploadSection.classList.remove('drag-over');
});

uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSection.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handlePhotoSelection(file);
    } else {
        showError('Invalid File', 'Please drop an image file');
    }
});

// Handle photo selection
function handlePhotoSelection(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Invalid File', 'Please select an image file (JPG or PNG)');
        return;
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        showError('File Too Large', 'Please upload an image smaller than 10MB');
        return;
    }

    // Store the actual File object for API call
    analysisState.currentPhotoBlob = file;

    // Read and display image preview
    const reader = new FileReader();
    reader.onload = (e) => {
        analysisState.currentPhoto = e.target.result;
        displayPhotoPreview(e.target.result);
    };
    reader.onerror = () => {
        showError('File Error', 'Could not read the file');
    };
    reader.readAsDataURL(file);
}

// Display photo preview
function displayPhotoPreview(photoData) {
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    
    previewImage.src = photoData;
    previewContainer.classList.remove('hidden');
    
    // Scroll to preview
    previewContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// =====================================================================
// 2. WEBCAM CAPTURE
// =====================================================================

const webcamBtn = document.getElementById('webcamBtn');
const webcamModal = document.getElementById('webcamModal');
const webcamVideo = document.getElementById('webcamVideo');
const webcamCanvas = document.getElementById('webcamCanvas');
const captureBtn = document.getElementById('captureBtn');

let mediaStream = null;

webcamBtn.addEventListener('click', openWebcam);
captureBtn.addEventListener('click', captureWebcam);

async function openWebcam() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        webcamVideo.srcObject = mediaStream;
        webcamModal.classList.remove('hidden');
        
        // Wait for video to load
        webcamVideo.onloadedmetadata = () => {
            webcamVideo.play();
        };
    } catch (err) {
        showError('Webcam Error', 'Could not access your webcam. Please check permissions.');
    }
}

function closeWebcam() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    webcamModal.classList.add('hidden');
}

function captureWebcam() {
    const ctx = webcamCanvas.getContext('2d');
    webcamCanvas.width = webcamVideo.videoWidth;
    webcamCanvas.height = webcamVideo.videoHeight;
    
    ctx.drawImage(webcamVideo, 0, 0);
    
    webcamCanvas.toBlob((blob) => {
        // Store the actual blob for API call
        analysisState.currentPhotoBlob = blob;

        const reader = new FileReader();
        reader.onload = (e) => {
            analysisState.currentPhoto = e.target.result;
            displayPhotoPreview(e.target.result);
            closeWebcam();
        };
        reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.9);
}

// =====================================================================
// 3. API CALL & IMAGE ANALYSIS
// =====================================================================

async function analyzePhoto() {
    if (!analysisState.currentPhoto || !analysisState.currentPhotoBlob) {
        showError('No Photo', 'Please select or capture a photo first');
        return;
    }

    showLoading();
    analysisState.isProcessing = true;

    try {
        // Prepare form data with the actual blob/file
        const formData = new FormData();
        
        // Determine filename and MIME type from blob
        let filename = 'photo.jpg';
        if (analysisState.currentPhotoBlob.type === 'image/png') {
            filename = 'photo.png';
        }
        
        // Use the actual blob/file object directly
        formData.append('file', analysisState.currentPhotoBlob, filename);

        // Call API
        const apiResponse = await fetch(API_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                'X-API-KEY': 'your_secret_api_key_here_12345'
            }
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json().catch(() => ({}));
            console.error('API Error Response:', errorData);
            throw new Error(`API Error: ${apiResponse.status} - ${errorData.detail || 'Unknown error'}`);
        }

        const result = await apiResponse.json();
        console.log('Full API Response:', result);

        // Validate response structure and normalize response format
        let normalizedResult = result;
        
        if (result.face_analysis && result.recommendations) {
            // Backend returns face_analysis and recommendations separately
            normalizedResult = {
                face_shape: result.face_analysis.face_shape,
                confidence: result.face_analysis.confidence,
                measurements: result.face_analysis.measurements,
                recommendations: result.recommendations
            };
        }
        
        if (!normalizedResult.face_shape || !normalizedResult.recommendations) {
            throw new Error('Invalid API response format');
        }

        analysisState.analysisResult = normalizedResult;
        displayResults(normalizedResult);

    } catch (error) {
        console.error('Analysis error:', error);
        
        // Parse error messages
        let errorTitle = 'Analysis Failed';
        let errorMessage = 'Could not analyze the image. Please try again.';

        if (error.message.includes('No face detected')) {
            errorTitle = 'No Face Detected';
            errorMessage = 'We couldn\'t detect a face in the image. Please try with a clear, frontal face photo.';
        } else if (error.message.includes('Poor image quality')) {
            errorTitle = 'Poor Image Quality';
            errorMessage = 'The image quality is too low. Please use a well-lit photo with clear facial features.';
        } else if (error.message.includes('API Error')) {
            errorTitle = 'Server Error';
            errorMessage = 'The server is unavailable. Please try again later.';
        } else if (error instanceof TypeError) {
            errorTitle = 'Connection Error';
            errorMessage = 'Could not connect to the server. Please check your internet connection.';
        }

        showError(errorTitle, errorMessage);
    } finally {
        analysisState.isProcessing = false;
    }
}

// =====================================================================
// 4. DISPLAY RESULTS
// =====================================================================

function displayResults(result) {
    console.log('displayResults called with:', result);
    hideLoading();
    
    try {
        // Display face shape
        const faceShape = result.face_shape.toLowerCase();
        const confidence = Math.round(result.confidence * 100);
        const shapeData = FACE_SHAPES[faceShape] || FACE_SHAPES['oval'];
        
        document.getElementById('shapeIcon').textContent = shapeData.icon;
        document.getElementById('faceShapeName').textContent = 
            faceShape.charAt(0).toUpperCase() + faceShape.slice(1);
        document.getElementById('shapeDescription').textContent = shapeData.description;
        
        const confidenceFill = document.getElementById('confidenceFill');
        confidenceFill.style.width = `${confidence}%`;
        document.getElementById('confidencePercent').textContent = confidence;
        
        // Display measurements if available
        if (result.measurements) {
            displayMeasurements(result.measurements);
        }
        
        // Display hairstyle recommendations
        displayHairstyles(result.recommendations);
        
        // Show results section
        document.getElementById('resultsSection').classList.remove('hidden');
        document.getElementById('uploadSection').classList.add('hidden');
        
        console.log('Results displayed successfully');
        
        // Scroll to results
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error in displayResults:', error);
        throw error;
    }
}

function displayMeasurements(measurements) {
    const measurementsCard = document.getElementById('measurementsCard');
    
    if (measurements.width) {
        document.getElementById('measurementWidth').textContent = 
            `${measurements.width.toFixed(1)}px`;
    }
    if (measurements.height) {
        document.getElementById('measurementHeight').textContent = 
            `${measurements.height.toFixed(1)}px`;
    }
    if (measurements.forehead_width) {
        document.getElementById('measurementForehead').textContent = 
            `${measurements.forehead_width.toFixed(1)}px`;
    }
    if (measurements.jaw_width) {
        document.getElementById('measurementJaw').textContent = 
            `${measurements.jaw_width.toFixed(1)}px`;
    }
    
    if (measurements.width || measurements.height) {
        measurementsCard.classList.remove('hidden');
    }
}

function displayHairstyles(recommendations) {
    console.log('displayHairstyles called with recommendations:', recommendations);
    const grid = document.getElementById('hairstylesGrid');
    grid.innerHTML = '';
    
    if (!recommendations || !Array.isArray(recommendations)) {
        console.error('Invalid recommendations format:', recommendations);
        grid.innerHTML = '<p>No recommendations available</p>';
        return;
    }
    
    recommendations.forEach((hairstyle, index) => {
        try {
            // Handle both old and new backend format
            const matchScore = hairstyle.match_score 
                ? Math.round(hairstyle.match_score * 100)
                : 85 + Math.floor(Math.random() * 15); // Generate score if not provided
            
            const imageUrl = hairstyle.image_url || hairstyle.imageUrl || 'assets/placeholder-hairstyle.jpg';
            const description = hairstyle.description || hairstyle.hairType?.join(', ') || 'Professional hairstyle option';
            
            const card = document.createElement('div');
            card.className = 'hairstyle-card';
            card.innerHTML = `
                <div class="hairstyle-image-container">
                    <img 
                        src="${imageUrl}" 
                        alt="${hairstyle.name}"
                        class="hairstyle-image"
                        onerror="this.src='assets/placeholder-hairstyle.jpg'"
                    >
                    <div class="match-badge">${matchScore}%</div>
                </div>
                <div class="hairstyle-info">
                    <h3 class="hairstyle-name">${hairstyle.name}</h3>
                    <p class="hairstyle-description">${description}</p>
                    <div class="hairstyle-tags">
                        ${(hairstyle.tags || hairstyle.hairType || []).slice(0, 2).map(tag => 
                            `<span class="tag">${tag}</span>`
                        ).join('')}
                    </div>
                    <button 
                        class="btn btn-outline btn-small" 
                        onclick="showHairstyleDetail(${index})">
                        View Details →
                    </button>
                </div>
            `;
            
            grid.appendChild(card);
        } catch (error) {
            console.error(`Error creating hairstyle card for index ${index}:`, error, hairstyle);
        }
    });
    
    console.log(`Displayed ${recommendations.length} hairstyle cards`);
}

// =====================================================================
// 5. HAIRSTYLE DETAIL MODAL
// =====================================================================

function showHairstyleDetail(index) {
    const hairstyle = analysisState.analysisResult.recommendations[index];
    const matchScore = hairstyle.match_score 
        ? Math.round(hairstyle.match_score * 100)
        : 85 + Math.floor(Math.random() * 15);
    
    const imageUrl = hairstyle.image_url || hairstyle.imageUrl || 'assets/placeholder-hairstyle.jpg';
    const description = hairstyle.detailed_description || hairstyle.description || 'Professional hairstyle option';
    const tags = hairstyle.tags || hairstyle.hairType || [];
    
    document.getElementById('detailTitle').textContent = hairstyle.name;
    document.getElementById('detailImage').src = imageUrl;
    document.getElementById('detailName').textContent = hairstyle.name;
    document.getElementById('detailScore').textContent = matchScore;
    document.getElementById('detailDescription').textContent = description;
    
    // Display tags
    const tagsContainer = document.getElementById('detailTags');
    tagsContainer.innerHTML = tags.map(tag => 
        `<span class="tag">${tag}</span>`
    ).join('');
    
    document.getElementById('detailModal').classList.remove('hidden');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

function bookConsultation() {
    // Navigate to booking page or open booking modal
    window.location.href = '/booking';
    // Or if using a modal system:
    // showBookingModal();
}

// =====================================================================
// 6. ERROR HANDLING
// =====================================================================

function showError(title, message) {
    hideLoading();
    
    const errorState = document.getElementById('errorState');
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorMessage').textContent = message;
    
    errorState.classList.remove('hidden');
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('resultsSection').classList.add('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =====================================================================
// 7. LOADING STATE
// =====================================================================

function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
    
    // Animate progress bar
    animateProgress();
}

function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
}

function animateProgress() {
    let progress = 0;
    const progressFill = document.getElementById('progressFill');
    
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 90) progress = 90;
        
        progressFill.style.width = `${progress}%`;
        
        if (progress > 90) {
            clearInterval(interval);
        }
    }, 400);
}

// =====================================================================
// 8. RESET & NAVIGATION
// =====================================================================

function resetAnalysis() {
    analysisState.currentPhoto = null;
    analysisState.currentPhotoBlob = null;
    analysisState.analysisResult = null;
    
    document.getElementById('uploadSection').classList.remove('hidden');
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
    document.getElementById('previewContainer').classList.add('hidden');
    
    photoInput.value = '';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function retakePhoto() {
    document.getElementById('previewContainer').classList.add('hidden');
    photoInput.value = '';
    analysisState.currentPhoto = null;
    analysisState.currentPhotoBlob = null;
}

function goBack() {
    window.history.back();
}

function shareResults() {
    if (!analysisState.analysisResult) return;
    
    const result = analysisState.analysisResult;
    const shareText = `I discovered my face shape is ${result.face_shape} with ${Math.round(result.confidence * 100)}% confidence using HairstyleHub! Check out the app to find your perfect hairstyle: https://hairstylehub.netlify.app`;
    
    if (navigator.share) {
        navigator.share({
            title: 'HairstyleHub Analysis',
            text: shareText,
            url: 'https://hairstylehub.netlify.app'
        }).catch(err => console.log('Share error:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Results copied to clipboard!');
        });
    }
}

// =====================================================================
// 9. UTILITY FUNCTIONS
// =====================================================================

// Handle browser back button
window.addEventListener('popstate', () => {
    resetAnalysis();
});

// Request permissions on page load
window.addEventListener('load', () => {
    // Optionally request notification permissions for result notifications
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

// Error boundary for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    showError('Unexpected Error', 'Something went wrong. Please refresh and try again.');
});

// Log API endpoint for debugging
console.log('HairstyleHub Analysis initialized');
console.log('API Endpoint:', API_ENDPOINT);
