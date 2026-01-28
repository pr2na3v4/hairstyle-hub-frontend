<!-- 
    INTEGRATION GUIDE: How to integrate the Face Analysis module into HairstyleHub
    Copy this as a reference for your main frontend pages
-->

<!-- ========================================================
     OPTION 1: Direct Link to Analysis Page
     ======================================================== -->
<!-- Add to navigation in index.html or main menu -->
<nav class="main-nav">
    <ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="categories/categories.html">Categories</a></li>
        <li><a href="analysis/analysis.html" class="cta-btn">Analyze My Face</a></li>
        <li><a href="profile/profile.html">Profile</a></li>
    </ul>
</nav>


<!-- ========================================================
     OPTION 2: Embedded in Existing Page (via iframe)
     ======================================================== -->
<!-- Create a new page: frontend/face-analysis-page.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Face Analysis - HairstyleHub</title>
    <link rel="stylesheet" href="global.css">
    <style>
        body {
            margin: 0;
            padding: 0;
        }
        
        .page-container {
            display: flex;
            min-height: 100vh;
        }
        
        .sidebar {
            width: 250px;
            background: #f9fafb;
            padding: 1.5rem;
            border-right: 1px solid #e5e7eb;
        }
        
        .content {
            flex: 1;
        }
        
        .sidebar-nav {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .sidebar-nav li {
            margin-bottom: 1rem;
        }
        
        .sidebar-nav a {
            color: #6b7280;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
        }
        
        .sidebar-nav a:hover,
        .sidebar-nav a.active {
            color: #6366f1;
        }
        
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <div class="page-container">
        <aside class="sidebar">
            <nav>
                <ul class="sidebar-nav">
                    <li><a href="index.html">Home</a></li>
                    <li><a href="categories/categories.html">Hairstyles</a></li>
                    <li><a href="face-analysis-page.html" class="active">Face Analysis</a></li>
                    <li><a href="profile/profile.html">Profile</a></li>
                </ul>
            </nav>
        </aside>
        
        <main class="content">
            <iframe src="analysis/analysis.html"></iframe>
        </main>
    </div>
</body>
</html>


<!-- ========================================================
     OPTION 3: JavaScript Module Integration (for React/Vue)
     ======================================================== -->
<!-- For React: frontend/src/pages/FaceAnalysis.jsx -->

import React from 'react';
import '../analysis/analysis.css';

const FaceAnalysis = () => {
    React.useEffect(() => {
        // Dynamically load the JavaScript
        const script = document.createElement('script');
        script.src = '/analysis/analysis.js';
        script.async = true;
        document.body.appendChild(script);
        
        return () => {
            // Cleanup if needed
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    return (
        <div id="analysis-root">
            <div className="analysis-container">
                {/* The HTML structure from analysis.html goes here */}
                {/* Or load it dynamically via fetch */}
            </div>
        </div>
    );
};

export default FaceAnalysis;


<!-- ========================================================
     OPTION 4: Home Page Integration (CTA Section)
     ======================================================== -->
<!-- Add this section to home/home.html -->

<section class="face-analysis-cta">
    <div class="cta-content">
        <h2>Discover Your Perfect Hairstyle</h2>
        <p>Upload a photo or use your webcam to get AI-powered hairstyle recommendations based on your unique face shape.</p>
        
        <div class="cta-features">
            <div class="feature">
                <span class="icon">📸</span>
                <h3>Photo Upload</h3>
                <p>Select from your photos</p>
            </div>
            <div class="feature">
                <span class="icon">📷</span>
                <h3>Live Webcam</h3>
                <p>Capture instantly</p>
            </div>
            <div class="feature">
                <span class="icon">✨</span>
                <h3>AI Analysis</h3>
                <p>Get personalized matches</p>
            </div>
        </div>
        
        <a href="analysis/analysis.html" class="btn btn-primary">
            Start Analysis →
        </a>
    </div>
    
    <style>
        .face-analysis-cta {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 4rem 2rem;
            border-radius: 1.5rem;
            margin: 2rem 0;
        }

        .cta-content h2 {
            font-size: 2rem;
            margin-bottom: 1rem;
        }

        .cta-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }

        .feature {
            text-align: center;
        }

        .feature .icon {
            font-size: 2rem;
            display: block;
            margin-bottom: 0.5rem;
        }

        .btn {
            background: white;
            color: #6366f1;
            padding: 0.75rem 2rem;
            border-radius: 0.5rem;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            margin-top: 1.5rem;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
    </style>
</section>


<!-- ========================================================
     OPTION 5: Navigation Integration
     ======================================================== -->
<!-- Update main navigation in js/navbar.js -->

const navigationItems = [
    { label: 'Home', href: 'index.html' },
    { label: 'Categories', href: 'categories/categories.html' },
    { 
        label: 'Analyze My Face', 
        href: 'analysis/analysis.html',
        highlight: true  // Make it stand out as primary CTA
    },
    { label: 'Profile', href: 'profile/profile.html' },
];

// Render navigation
navigationItems.forEach(item => {
    const link = document.createElement('a');
    link.href = item.href;
    link.textContent = item.label;
    
    if (item.highlight) {
        link.className = 'nav-highlight';
        link.style.cssText = `
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 0.5rem 1.5rem;
            border-radius: 0.5rem;
        `;
    }
    
    navbar.appendChild(link);
});


<!-- ========================================================
     OPTION 6: Results Integration (Profile Page)
     ======================================================== -->
<!-- Add to profile/profile.html -->

<section class="profile-section">
    <h2>Your Face Shape Analysis</h2>
    
    <div id="analysisHistory">
        <!-- Previous analysis results -->
        <div class="analysis-result">
            <h3>Recent Analysis</h3>
            <p id="faceShapeDisplay">Not analyzed yet</p>
            <a href="../analysis/analysis.html" class="btn-secondary">
                Run New Analysis
            </a>
        </div>
    </div>
</section>

<script>
    // Restore previous analysis results from localStorage
    function loadAnalysisHistory() {
        const saved = localStorage.getItem('lastFaceAnalysis');
        if (saved) {
            const result = JSON.parse(saved);
            document.getElementById('faceShapeDisplay').textContent = 
                `Face Shape: ${result.face_shape} (${Math.round(result.confidence * 100)}% confidence)`;
        }
    }

    // In analysis.js, save results to localStorage
    function displayResults(result) {
        // ... existing code ...
        
        // Save to localStorage for profile access
        localStorage.setItem('lastFaceAnalysis', JSON.stringify(result));
    }

    loadAnalysisHistory();
</script>


<!-- ========================================================
     API CONFIGURATION
     ======================================================== -->
<!-- Create frontend/config.js -->

const CONFIG = {
    // API Configuration
    api: {
        baseUrl: process.env.REACT_APP_API_URL || 
                 (process.env.NODE_ENV === 'production' 
                     ? 'https://api.hairstylehub.com'
                     : 'http://localhost:8000'),
        
        endpoints: {
            analyzeAndRecommend: '/api/v1/analyze-and-recommend',
            getHairstyles: '/api/v1/hairstyles',
            bookConsultation: '/api/v1/bookings',
        },
        
        timeout: 30000, // 30 seconds
    },

    // Feature Flags
    features: {
        webcamCapture: true,
        faceDetection: true,
        measurementsVisualization: true,
        shareResults: true,
    },

    // UI Configuration
    ui: {
        theme: 'light', // or 'dark'
        animationsEnabled: true,
        imagePlaceholder: '/assets/placeholder-hairstyle.jpg',
    },

    // Privacy Settings
    privacy: {
        storeImages: false,
        trackAnalysis: false,
        showPrivacyNotice: true,
    }
};

// Use in analysis.js
import CONFIG from '../config.js';
const API_ENDPOINT = CONFIG.api.baseUrl + CONFIG.api.endpoints.analyzeAndRecommend;


<!-- ========================================================
     ENVIRONMENT VARIABLES (.env)
     ======================================================== -->

# API Configuration
REACT_APP_API_URL=https://api.hairstylehub.com
REACT_APP_ENV=production

# Feature Flags
REACT_APP_ENABLE_WEBCAM=true
REACT_APP_ENABLE_MEASUREMENTS=true

# Analytics (optional)
REACT_APP_ANALYTICS_ID=google-analytics-id


<!-- ========================================================
     TESTING SETUP
     ======================================================== -->
<!-- frontend/test-analysis.html - Local testing without backend -->

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Face Analysis - Test Mode</title>
    <link rel="stylesheet" href="analysis/analysis.css">
</head>
<body>
    <div class="analysis-container">
        <h1>Face Analysis - Test Mode</h1>
        <button onclick="simulateAnalysis()">Simulate Analysis</button>
    </div>

    <script>
        // Mock API response
        function simulateAnalysis() {
            const mockResponse = {
                face_shape: "oval",
                confidence: 0.92,
                measurements: {
                    width: 145,
                    height: 195,
                    forehead_width: 130,
                    jaw_width: 125
                },
                recommendations: [
                    {
                        name: "Layered Bob",
                        description: "Classic layered bob",
                        match_score: 0.92,
                        image_url: "https://via.placeholder.com/400x300?text=Layered+Bob",
                        tags: ["Trendy", "Easy"]
                    },
                    {
                        name: "Side Part",
                        description: "Elegant side parting",
                        match_score: 0.88,
                        image_url: "https://via.placeholder.com/400x300?text=Side+Part",
                        tags: ["Professional"]
                    }
                ]
            };

            // Display results (mock function)
            console.log('Analysis Result:', mockResponse);
            // Call your display function here
        }
    </script>
</body>
</html>

---

## Quick Integration Steps

1. **Copy files** to `frontend/analysis/`
2. **Add link** to navigation/home page
3. **Set API URL** in `analysis.js`
4. **Test** file upload and webcam
5. **Deploy** to production

Choose the integration option that best fits your frontend architecture!
