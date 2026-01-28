# HairstyleHub Face Analysis Frontend Integration

Complete frontend implementation for face analysis and hairstyle recommendations.

## 📁 Files Included

```
analysis/
├── analysis.html       # Main UI with upload/webcam forms and results display
├── analysis.js         # API integration, image processing, and state management
├── analysis.css        # Modern, responsive styling
└── README.md          # This file
```

## 🚀 Quick Start

### 1. Setup

Copy the files to your frontend directory:
```bash
frontend/
└── analysis/
    ├── analysis.html
    ├── analysis.js
    └── analysis.css
```

### 2. Configure API Endpoint

Edit `analysis.js` and set your API base URL:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_ENDPOINT = `${API_BASE_URL}/api/v1/analyze-and-recommend`;
```

**Options:**
- **Environment Variable:** Set `REACT_APP_API_URL` in your `.env` file
- **Direct URL:** Replace the hardcoded value
- **Dynamic Detection:** Add logic to auto-detect based on environment

### 3. Link from Navigation

Add a link to the analysis page in your main navigation:

```html
<a href="analysis/analysis.html">Find Your Style</a>
```

Or create a dedicated page that loads the analysis module.

## 📋 Features

### ✅ Image Input Methods
- **File Upload:** Drag-and-drop or click to select photos
- **Webcam Capture:** Real-time webcam access with snapshot capability
- **Image Validation:** File size check (max 10MB), format validation

### ✅ User Experience
- **Loading States:** Animated spinner with progress bar
- **Error Handling:** Specific error messages for common issues
  - No face detected
  - Poor image quality
  - API connection errors
  - Invalid file formats

### ✅ Results Display
- **Face Shape Recognition:** Icon, name, and description
- **Confidence Meter:** Visual confidence percentage display
- **Face Measurements:** Optional measurements visualization
- **Hairstyle Grid:** Responsive grid with match scores
- **Match Scoring:** 0-100% confidence for each recommendation

### ✅ Mobile Responsive
- Adapts to all screen sizes (480px - 1920px+)
- Touch-friendly buttons and interactions
- Optimized layout for mobile/tablet/desktop

### ✅ Privacy & Security
- Privacy notice displayed prominently
- Images not persisted locally
- API-based processing only
- No analytics or tracking

## 🔌 API Integration

### Expected Response Format

The `/api/v1/analyze-and-recommend` endpoint should return:

```json
{
  "face_shape": "oval",
  "confidence": 0.95,
  "measurements": {
    "width": 145,
    "height": 195,
    "forehead_width": 130,
    "jaw_width": 125
  },
  "recommendations": [
    {
      "name": "Layered Bob",
      "description": "Classic layered bob with volume at the crown",
      "detailed_description": "Perfect for oval faces, adds texture and movement",
      "image_url": "https://example.com/layered-bob.jpg",
      "match_score": 0.92,
      "tags": ["Trendy", "Low Maintenance"]
    },
    {
      "name": "Side Part",
      "description": "Elegant side-parted style",
      "detailed_description": "Flatters most face shapes with side volume",
      "image_url": "https://example.com/side-part.jpg",
      "match_score": 0.88,
      "tags": ["Professional", "Versatile"]
    }
  ]
}
```

### Request Format

The form sends a `multipart/form-data` POST request with:
- **Field:** `image`
- **Type:** JPEG/PNG image file
- **Size:** Up to 10MB

## 🎨 Customization

### Colors & Theming

Modify CSS variables in `analysis.css`:

```css
:root {
    --primary: #6366f1;           /* Main brand color */
    --secondary: #ec4899;         /* Accent color */
    --success: #10b981;           /* Success states */
    --error: #ef4444;             /* Error states */
    --text-primary: #1f2937;      /* Main text */
    --bg-primary: #ffffff;        /* Background */
}
```

### Layout Adjustments

Grid and container sizes:

```css
:root {
    --spacing-md: 1rem;           /* Base spacing unit */
    --radius-lg: 0.75rem;         /* Border radius */
}
```

### Animations

Transition speeds:

```css
:root {
    --transition-base: 200ms ease-in-out;  /* Standard timing */
}
```

## 📱 Responsive Breakpoints

| Breakpoint | Screen Size | Behavior |
|-----------|-----------|----------|
| Desktop | 768px+ | 2-column grids, full sidebar |
| Tablet | 481-767px | Adjusted spacing, single column |
| Mobile | ≤480px | Full width, stacked layout |

## 🔧 JavaScript API

### Main Functions

#### `analyzePhoto()`
Initiates image analysis via API
```javascript
analyzePhoto(); // Processes current photo
```

#### `retakePhoto()`
Resets preview, allows new photo selection
```javascript
retakePhoto();
```

#### `resetAnalysis()`
Clears all results and returns to initial state
```javascript
resetAnalysis();
```

#### `showHairstyleDetail(index)`
Opens detail modal for hairstyle at given index
```javascript
showHairstyleDetail(0); // Show first recommendation
```

#### `shareResults()`
Shares results using native share or clipboard
```javascript
shareResults();
```

### State Management

```javascript
analysisState = {
    currentPhoto: null,        // Base64 or blob
    analysisResult: null,      // API response
    isProcessing: false        // Loading flag
}
```

## 🚨 Error Handling

### Automatic Error Messages

| Error | Message |
|-------|---------|
| No face detected | "We couldn't detect a face in the image..." |
| Poor image quality | "The image quality is too low..." |
| File too large | "Please upload an image smaller than 10MB" |
| Invalid file type | "Please drop an image file" |
| API unavailable | "The server is unavailable..." |
| Network error | "Could not connect to the server..." |

### Handling Custom Errors

Add handlers in `analyzePhoto()`:

```javascript
if (error.message.includes('CUSTOM_ERROR')) {
    showError('Custom Title', 'Custom message');
}
```

## 🔐 Privacy & Compliance

### Data Handling
- ✅ Images processed in-memory only
- ✅ No local storage of images
- ✅ No transmission logs
- ✅ Privacy notice displayed
- ✅ GDPR compliant (no data retention)

### Permissions
- Camera access: User consent via browser dialog
- File access: User selects files (no directory access)

## 📦 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full (iOS 14.5+) |
| Edge | ✅ Full |
| IE 11 | ❌ Not supported |

### Required APIs
- Fetch API
- Canvas API
- File API
- MediaDevices API (for webcam)

## 🐛 Debugging

### Enable Debug Logging

Add to top of `analysis.js`:

```javascript
const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) console.log('[HairstyleHub]', ...args);
}
```

### Common Issues

**Webcam not working:**
- Check HTTPS (required for camera access)
- Verify browser permissions
- Try different browser

**API not responding:**
- Check CORS headers from backend
- Verify endpoint URL
- Check network tab in DevTools

**Images not displaying:**
- Verify image URLs are accessible
- Check CORS for image CDN
- Add fallback placeholder image

## 🎯 Integration Checklist

- [ ] Copy files to `frontend/analysis/`
- [ ] Update API endpoint URL in `analysis.js`
- [ ] Test file upload locally
- [ ] Test webcam capture
- [ ] Verify API responses format
- [ ] Test on mobile devices
- [ ] Check accessibility (a11y)
- [ ] Optimize image loading
- [ ] Add authentication if needed
- [ ] Setup error tracking/monitoring

## 🔄 Backend Integration

### Expected Backend Endpoint

```python
@app.post("/api/v1/analyze-and-recommend")
async def analyze_and_recommend(image: UploadFile):
    """
    Analyze face shape and recommend hairstyles
    
    Args:
        image: JPEG/PNG image file with face
        
    Returns:
        {
            "face_shape": str,
            "confidence": float,
            "measurements": dict,
            "recommendations": list
        }
    """
    pass
```

### Example Python Implementation

```python
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/analyze-and-recommend")
async def analyze_and_recommend(image: UploadFile):
    content = await image.read()
    # Process image
    result = analyze_face(content)
    return result
```

## 📊 Performance Optimization

### Image Processing
- Max file size: 10MB
- Compression: JPEG 0.9 quality
- Canvas dimensions: Native webcam resolution

### API Calls
- Single request per analysis
- No polling/retries
- Timeout: Browser default (30s)

### Bundle Size
- HTML: ~15KB
- CSS: ~20KB
- JS: ~18KB
- **Total: ~53KB**

## 📚 Additional Resources

### Face Detection Libraries (Optional)
- `face-api.js` - TensorFlow face detection
- `ml5.js` - Simple face detection
- `tracking.js` - Real-time face tracking

### UI Framework Integration

**React Example:**
```jsx
import './analysis/analysis.css';

function FaceAnalysis() {
    return (
        <iframe 
            src="analysis/analysis.html" 
            style={{width: '100%', height: '100vh', border: 'none'}}
        />
    );
}
```

**Vue Example:**
```vue
<template>
    <iframe 
        src="analysis/analysis.html" 
        style="width: 100%; height: 100vh; border: none;"
    />
</template>
```

## 📝 License

This code is part of HairstyleHub and follows the project's license terms.

## 🤝 Support

For issues or questions:
1. Check this README
2. Review browser console for errors
3. Verify API endpoint is accessible
4. Check network tab in DevTools

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Created for:** HairstyleHub
