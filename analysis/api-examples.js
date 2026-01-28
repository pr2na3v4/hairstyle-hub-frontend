/* =====================================================================
   HairstyleHub API Integration Examples
   Complete request/response examples and testing utilities
   ===================================================================== */

// =====================================================================
// 1. BASIC API CALL EXAMPLE
// =====================================================================

async function exampleBasicApiCall() {
    const imageFile = document.getElementById('photoInput').files[0];
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch('http://localhost:8000/api/v1/analyze-and-recommend', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Analysis Result:', result);
        return result;

    } catch (error) {
        console.error('Error:', error);
    }
}


// =====================================================================
// 2. EXPECTED API RESPONSE FORMAT
// =====================================================================

const EXPECTED_API_RESPONSE = {
    "face_shape": "oval",           // Required: oval, round, square, heart, oblong, diamond, triangle
    "confidence": 0.95,              // Required: 0.0 - 1.0
    "measurements": {                // Optional: facial measurements
        "width": 145.5,              // Face width in pixels
        "height": 195.3,             // Face height in pixels
        "forehead_width": 130.2,     // Forehead width in pixels
        "jaw_width": 125.8           // Jaw width in pixels
    },
    "recommendations": [             // Required: Array of hairstyles
        {
            "id": "hairstyle_001",
            "name": "Layered Bob",
            "description": "A modern layered bob that adds volume and movement",
            "detailed_description": "Perfect for oval faces. This cut features layers throughout for texture and depth. Works well with straight, wavy, or curly hair.",
            "image_url": "https://cdn.hairstylehub.com/hairstyles/layered-bob.jpg",
            "match_score": 0.92,     // 0.0 - 1.0 confidence
            "tags": ["Trendy", "Low Maintenance", "Versatile"],
            "hairType": ["straight", "wavy", "curly"],
            "difficulty": "medium"
        },
        {
            "id": "hairstyle_002",
            "name": "Side Part",
            "description": "Elegant side-parted style with volume",
            "detailed_description": "Flatters oval faces beautifully. The side part creates asymmetry that's visually interesting.",
            "image_url": "https://cdn.hairstylehub.com/hairstyles/side-part.jpg",
            "match_score": 0.88,
            "tags": ["Professional", "Timeless"],
            "hairType": ["straight", "wavy"],
            "difficulty": "easy"
        },
        {
            "id": "hairstyle_003",
            "name": "Pixie Cut",
            "description": "Short and chic pixie cut",
            "detailed_description": "Bold choice that works with confident styling. Requires regular trims.",
            "image_url": "https://cdn.hairstylehub.com/hairstyles/pixie-cut.jpg",
            "match_score": 0.85,
            "tags": ["Bold", "Modern"],
            "hairType": ["straight", "wavy"],
            "difficulty": "easy"
        }
    ]
};


// =====================================================================
// 3. ERROR RESPONSE EXAMPLES
// =====================================================================

const ERROR_RESPONSES = {
    // No face detected
    noFaceDetected: {
        status: 400,
        response: {
            error: "No face detected",
            message: "Could not detect a face in the provided image. Please ensure the image shows a clear front-facing face.",
            suggestion: "Try uploading a clear photo with your face visible from the front."
        }
    },

    // Poor image quality
    poorImageQuality: {
        status: 400,
        response: {
            error: "Poor image quality",
            message: "The image is too blurry or low resolution for accurate analysis.",
            suggestion: "Please use a well-lit, clear image with better resolution."
        }
    },

    // Invalid image format
    invalidImageFormat: {
        status: 400,
        response: {
            error: "Invalid image format",
            message: "Only JPEG and PNG images are supported.",
            suggestion: "Please convert your image to JPEG or PNG format."
        }
    },

    // File too large
    fileTooLarge: {
        status: 413,
        response: {
            error: "Payload too large",
            message: "The image file is too large. Maximum size is 10MB.",
            suggestion: "Please compress your image and try again."
        }
    },

    // Server error
    serverError: {
        status: 500,
        response: {
            error: "Internal server error",
            message: "An unexpected error occurred during analysis.",
            suggestion: "Please try again later or contact support."
        }
    },

    // Service unavailable
    serviceUnavailable: {
        status: 503,
        response: {
            error: "Service unavailable",
            message: "The analysis service is temporarily unavailable.",
            suggestion: "Please try again in a few moments."
        }
    }
};


// =====================================================================
// 4. ADVANCED API CALL WITH RETRY LOGIC
// =====================================================================

class HairstyleHubAPI {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
        this.maxRetries = 3;
        this.retryDelay = 1000; // ms
        this.timeout = 30000; // ms
    }

    /**
     * Analyze photo and get hairstyle recommendations
     * @param {File} imageFile - Image file to analyze
     * @param {Object} options - Configuration options
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeAndRecommend(imageFile, options = {}) {
        const {
            retries = this.maxRetries,
            onProgress = null
        } = options;

        const formData = new FormData();
        formData.append('image', imageFile);

        try {
            return await this.fetchWithRetry(
                '/api/v1/analyze-and-recommend',
                {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                },
                retries,
                onProgress
            );
        } catch (error) {
            throw this.parseError(error);
        }
    }

    /**
     * Fetch with automatic retry logic
     */
    async fetchWithRetry(endpoint, options, retries = 3, onProgress = null) {
        let lastError;

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                if (onProgress) {
                    onProgress({
                        status: 'attempting',
                        attempt: attempt + 1,
                        totalAttempts: retries
                    });
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                const response = await fetch(
                    `${this.baseUrl}${endpoint}`,
                    {
                        ...options,
                        signal: controller.signal
                    }
                );

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new APIError(
                        errorData.error || 'API Error',
                        response.status,
                        errorData
                    );
                }

                const data = await response.json();

                if (onProgress) {
                    onProgress({
                        status: 'success',
                        result: data
                    });
                }

                return data;

            } catch (error) {
                lastError = error;

                if (error instanceof APIError && !error.isRetryable) {
                    throw error;
                }

                if (attempt < retries - 1) {
                    const delay = this.retryDelay * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * Parse error response and provide user-friendly message
     */
    parseError(error) {
        if (error instanceof APIError) {
            return {
                title: this.getErrorTitle(error.message),
                message: this.getErrorMessage(error.message),
                suggestion: this.getErrorSuggestion(error.message),
                details: error.data
            };
        }

        if (error.name === 'AbortError') {
            return {
                title: 'Request Timeout',
                message: 'The request took too long to complete.',
                suggestion: 'Please try again with a smaller image file.'
            };
        }

        if (error instanceof TypeError) {
            return {
                title: 'Connection Error',
                message: 'Could not connect to the server.',
                suggestion: 'Please check your internet connection.'
            };
        }

        return {
            title: 'Unknown Error',
            message: error.message,
            suggestion: 'Please try again or contact support.'
        };
    }

    getErrorTitle(errorType) {
        const titles = {
            'No face detected': 'No Face Detected',
            'Poor image quality': 'Poor Image Quality',
            'Invalid image format': 'Invalid Image Format',
            'Payload too large': 'File Too Large',
            'Internal server error': 'Server Error',
            'Service unavailable': 'Service Unavailable'
        };
        return titles[errorType] || 'Analysis Failed';
    }

    getErrorMessage(errorType) {
        const messages = {
            'No face detected': 'We couldn\'t detect a face in the image. Please ensure the image shows a clear front-facing face.',
            'Poor image quality': 'The image is too blurry or low resolution. Please use a well-lit, clear image.',
            'Invalid image format': 'Only JPEG and PNG images are supported.',
            'Payload too large': 'The image file is too large. Maximum size is 10MB.',
            'Internal server error': 'An unexpected error occurred during analysis.',
            'Service unavailable': 'The analysis service is temporarily unavailable.'
        };
        return messages[errorType] || 'Could not analyze the image.';
    }

    getErrorSuggestion(errorType) {
        const suggestions = {
            'No face detected': 'Try uploading a clear photo with your face visible from the front.',
            'Poor image quality': 'Please compress your image and try again.',
            'Invalid image format': 'Please convert your image to JPEG or PNG format.',
            'Payload too large': 'Please compress your image and try again.',
            'Internal server error': 'Please try again later or contact support.',
            'Service unavailable': 'Please try again in a few moments.'
        };
        return suggestions[errorType] || 'Please try again.';
    }
}

// Custom error class
class APIError extends Error {
    constructor(message, status, data = {}) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
        this.isRetryable = status >= 500; // Retry on server errors
    }
}


// =====================================================================
// 5. USAGE EXAMPLE WITH API CLASS
// =====================================================================

async function exampleWithAPIClass() {
    const api = new HairstyleHubAPI('http://localhost:8000');
    const imageFile = document.getElementById('photoInput').files[0];

    try {
        const result = await api.analyzeAndRecommend(imageFile, {
            retries: 3,
            onProgress: (event) => {
                if (event.status === 'attempting') {
                    console.log(`Attempt ${event.attempt}/${event.totalAttempts}`);
                } else if (event.status === 'success') {
                    console.log('Analysis complete:', event.result);
                }
            }
        });

        console.log('Face Shape:', result.face_shape);
        console.log('Confidence:', Math.round(result.confidence * 100) + '%');
        console.log('Recommendations:', result.recommendations);

        return result;

    } catch (error) {
        console.error('Analysis failed:', error);
        // Error already contains user-friendly title, message, suggestion
        showErrorToUser(error);
    }
}


// =====================================================================
// 6. MOCK API FOR TESTING (No Backend Required)
// =====================================================================

class MockHairstyleHubAPI extends HairstyleHubAPI {
    async analyzeAndRecommend(imageFile, options = {}) {
        const { onProgress } = options;

        // Simulate processing
        return new Promise((resolve) => {
            if (onProgress) {
                onProgress({
                    status: 'attempting',
                    attempt: 1,
                    totalAttempts: 1
                });
            }

            // Simulate delay
            setTimeout(() => {
                const mockResult = {
                    face_shape: this.getRandomFaceShape(),
                    confidence: 0.85 + Math.random() * 0.15,
                    measurements: {
                        width: 140 + Math.random() * 20,
                        height: 185 + Math.random() * 30,
                        forehead_width: 120 + Math.random() * 20,
                        jaw_width: 110 + Math.random() * 30
                    },
                    recommendations: this.getMockRecommendations()
                };

                if (onProgress) {
                    onProgress({
                        status: 'success',
                        result: mockResult
                    });
                }

                resolve(mockResult);
            }, 2000);
        });
    }

    getRandomFaceShape() {
        const shapes = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond', 'triangle'];
        return shapes[Math.floor(Math.random() * shapes.length)];
    }

    getMockRecommendations() {
        return [
            {
                id: 'mock_1',
                name: 'Layered Bob',
                description: 'A modern layered bob that adds volume',
                detailed_description: 'Perfect choice with easy styling.',
                image_url: 'https://via.placeholder.com/400x500?text=Layered+Bob',
                match_score: 0.92,
                tags: ['Trendy', 'Easy'],
                hairType: ['straight', 'wavy'],
                difficulty: 'easy'
            },
            {
                id: 'mock_2',
                name: 'Side Part',
                description: 'Elegant side-parted style',
                detailed_description: 'Professional and timeless.',
                image_url: 'https://via.placeholder.com/400x500?text=Side+Part',
                match_score: 0.88,
                tags: ['Professional'],
                hairType: ['straight', 'wavy'],
                difficulty: 'easy'
            },
            {
                id: 'mock_3',
                name: 'Pixie Cut',
                description: 'Short and chic pixie cut',
                detailed_description: 'Bold and modern.',
                image_url: 'https://via.placeholder.com/400x500?text=Pixie+Cut',
                match_score: 0.85,
                tags: ['Bold', 'Modern'],
                hairType: ['straight'],
                difficulty: 'medium'
            }
        ];
    }
}


// =====================================================================
// 7. TESTING UTILITIES
// =====================================================================

// Use mock API for development
const isDevelopment = process.env.NODE_ENV === 'development';
const API = isDevelopment 
    ? new MockHairstyleHubAPI()
    : new HairstyleHubAPI();

// Test the API
async function testAPI() {
    console.log('Testing HairstyleHub API...');

    // Create a test image (using canvas)
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, 400, 300);
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(200, 100, 50, 0, Math.PI * 2);
    ctx.fill();

    canvas.toBlob(async (blob) => {
        const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });

        try {
            const result = await API.analyzeAndRecommend(file);
            console.log('✓ API Test Passed');
            console.log('Result:', result);
        } catch (error) {
            console.error('✗ API Test Failed');
            console.error('Error:', error);
        }
    }, 'image/jpeg');
}

// Export for use
window.HairstyleHubAPI = HairstyleHubAPI;
window.MockHairstyleHubAPI = MockHairstyleHubAPI;
window.testAPI = testAPI;
