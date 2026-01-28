
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    toggleBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        // Change icon
        toggleBtn.innerHTML = navLinks.classList.contains('active') ? '✕' : '☰';
    });
    
    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            toggleBtn.innerHTML = '☰';
        });
    });
});
 const cards = document.querySelectorAll('.tilt-card');
    const hoverSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ...'); // Add a subtle hover sound
    const surpriseMessages = [
        "✨ Magic! ✨", "🌟 Wow! 🌟", "💫 Amazing! 💫",
        "🔥 Fire! 🔥", "⚡ Zapped! ⚡", "🌈 Rainbow! 🌈"
    ];

    // Initialize AudioContext for sound reactivity
    let audioContext, analyser, dataArray;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
        console.log("Audio context not supported");
    }

    cards.forEach((card, index) => {
        // Enhanced sparkles with gradient colors
        const sparkles = document.createElement('div');
        sparkles.className = 'sparkle-particles';
        sparkles.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 10; opacity: 0;
        background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(255,255,255,0.1) 0%,
            transparent 50%);
    `;
        card.appendChild(sparkles);

        // Add audio visualizer bar
        const visualizer = document.createElement('div');
        visualizer.className = 'audio-visualizer';
        card.appendChild(visualizer);

        // Add holographic border
        const borderGlow = document.createElement('div');
        borderGlow.className = 'border-glow';
        borderGlow.style.cssText = `
        position: absolute; inset: -2px; border-radius: inherit;
        background: conic-gradient(from 0deg, 
            ${['#ff6b6b', '#4ecdc4', '#ffe66d', '#9d4edd'][index % 4]},
            ${['#4ecdc4', '#ffe66d', '#9d4edd', '#ff6b6b'][index % 4]},
            ${['#ffe66d', '#9d4edd', '#ff6b6b', '#4ecdc4'][index % 4]},
            ${['#9d4edd', '#ff6b6b', '#4ecdc4', '#ffe66d'][index % 4]}
        );
        z-index: -1; opacity: 0; filter: blur(10px);
        transition: opacity 0.3s;
    `;
        card.appendChild(borderGlow);

        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;
        let glowIntensity = 0;
        let floatOffsetX = Math.sin(index) * 25;
        let floatOffsetY = Math.cos(index) * 20;
        let trailPoints = [];
        let lastTime = 0;
        let surpriseTriggered = false;

        // Enhanced mousemove with trail and ripple effects
        card.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastTime < 16) return; // ~60fps throttle
            lastTime = now;

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const normalizedX = (x - centerX) / centerX;
            const normalizedY = (y - centerY) / centerY;

            // Dynamic 3D tilt with depth
            const rotateX = normalizedY * -20;
            const rotateY = normalizedX * 20;
            const rotateZ = normalizedX * normalizedY * 5;

            // Magnetic movement with smooth easing
            const strength = 0.12;
            targetX = normalizedX * 40 + floatOffsetX;
            targetY = normalizedY * 40 + floatOffsetY;

            mouseX += (targetX - mouseX) * 0.15;
            mouseY += (targetY - mouseY) * 0.15;

            // Dynamic glow and effects
            glowIntensity = Math.min(Math.hypot(normalizedX, normalizedY), 1);

            // Update sparkle gradient position
            sparkles.style.setProperty('--mouse-x', `${x}px`);
            sparkles.style.setProperty('--mouse-y', `${y}px`);

            // Premium transform with parallax layers
            card.style.transform = `
            perspective(1500px) 
            translate3d(${mouseX * 0.7}px, ${mouseY * 0.7}px, ${glowIntensity * 50}px)
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg)
            rotateZ(${rotateZ}deg)
            scale3d(${1 + glowIntensity * 0.12}, ${1 + glowIntensity * 0.12}, 1)
        `;

            // Dynamic multi-layer shadow
            const shadowX = rotateY * -3;
            const shadowY = rotateX * 3;
            card.style.boxShadow = `
            ${shadowX}px ${shadowY}px 40px rgba(0,0,0,0.4),
            0 0 80px rgba(59, 130, 246, ${glowIntensity * 0.6}),
            0 0 120px rgba(147, 51, 234, ${glowIntensity * 0.4}),
            inset 0 0 40px rgba(255,255,255,${glowIntensity * 0.3})
        `;

            // Border glow effect
            borderGlow.style.opacity = glowIntensity * 0.8;

            // Create trail dots
            createTrail(card, x, y, index);

            // Enhanced sparkles with colors
            createSparkles(sparkles, x, y, index);

            // Audio visualizer reaction
            updateVisualizer(visualizer, glowIntensity);

            // Surprise ripple effect every 2 seconds
            if (!surpriseTriggered && glowIntensity > 0.8) {
                createRipple(card, x, y);
                surpriseTriggered = true;
                setTimeout(() => surpriseTriggered = false, 2000);
            }

            // Mouse trail with fading
            trailPoints.push({ x, y, time: now });
            trailPoints = trailPoints.filter(p => now - p.time < 500);
            updateTrail(trailPoints);
        });

        card.addEventListener('mouseenter', (e) => {
            card.style.transition = 'none';
            sparkles.style.opacity = '1';
            borderGlow.style.opacity = '0.5';

            // Gentle pulse animation on enter
            card.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.05)' },
                { transform: 'scale(1)' }
            ], {
                duration: 600,
                easing: 'cubic-bezier(0.23, 1, 0.32, 1)'
            });

            // Play subtle hover sound
            if (hoverSound) {
                hoverSound.currentTime = 0;
                hoverSound.volume = 0.3;
                hoverSound.play();
            }

            // Show surprise message occasionally
            if (Math.random() > 0.7) {
                showSurpriseMessage(card, e);
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = `
            transform 0.8s cubic-bezier(0.23, 1, 0.32, 1),
            box-shadow 0.8s cubic-bezier(0.23, 1, 0.32, 1),
            border-color 0.8s ease
        `;
            card.style.transform = `
            perspective(1500px) 
            translate3d(0, 0, 0) 
            rotateX(0deg) rotateY(0deg) rotateZ(0deg) 
            scale3d(1, 1, 1)
        `;
            card.style.boxShadow = '0 30px 60px rgba(0,0,0,0.25)';
            sparkles.style.opacity = '0';
            borderGlow.style.opacity = '0';
            visualizer.style.opacity = '0';

            // Clean up trail points
            trailPoints = [];
        });

        // Floating animation with smooth curves
        let floatAngle = index * Math.PI / 3;
        function floatAnimation() {
            floatOffsetX = Math.sin(floatAngle) * 15;
            floatOffsetY = Math.cos(floatAngle * 0.7) * 12;
            floatAngle += 0.02;

            // Apply gentle floating to non-hovered cards
            if (!card.matches(':hover')) {
                card.style.transform = `
                perspective(1500px)
                translate3d(${floatOffsetX}px, ${floatOffsetY}px, 0)
            `;
            }

            requestAnimationFrame(floatAnimation);
        }
        floatAnimation();
    });

    // Enhanced particle system
    function createSparkles(container, x, y, colorIndex) {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#ffe66d', '#9d4edd',
            '#00ff9d', '#ff4081', '#18ffff', '#ff9100'
        ];

        for (let i = 0; i < 4; i++) {
            const sparkle = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const color = colors[(colorIndex + i) % colors.length];

            sparkle.style.cssText = `
            position: absolute; width: ${3 + Math.random() * 4}px; 
            height: ${3 + Math.random() * 4}px;
            background: radial-gradient(circle, ${color}, transparent);
            border-radius: 50%; opacity: 0.9;
            pointer-events: none; z-index: 20;
            left: ${x}px; top: ${y}px;
            animation: sparkleFloat 0.8s ease-out forwards;
            --tx: ${tx}px; --ty: ${ty}px;
            filter: drop-shadow(0 0 3px ${color});
        `;
            container.appendChild(sparkle);

            setTimeout(() => sparkle.remove(), 800);
        }
    }

    // Trail effect
    function createTrail(card, x, y, colorIndex) {
        const trail = document.createElement('div');
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#9d4edd'];

        trail.className = 'trail-dot';
        trail.style.cssText = `
        left: ${x}px; top: ${y}px;
        background: ${colors[colorIndex % colors.length]};
        transform: scale(0);
        animation: trailFade 0.6s ease-out forwards;
    `;
        card.appendChild(trail);

        setTimeout(() => trail.remove(), 600);
    }

    // Ripple shockwave effect
    function createRipple(card, x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
        left: ${x}px; top: ${y}px;
        border-color: #${Math.floor(Math.random() * 16777215).toString(16)};
        animation: shockwave 1s ease-out;
    `;
        card.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
    }

    // Update trail points
    function updateTrail(points) {
        points.forEach((point, i) => {
            const opacity = 1 - (i / points.length);
            // Update existing trail dots opacity
        });
    }

    // Audio visualizer update
    function updateVisualizer(visualizer, intensity) {
        visualizer.style.opacity = intensity;
        visualizer.style.transform = `scaleX(${0.3 + intensity * 0.7})`;
        visualizer.style.filter = `hue-rotate(${intensity * 360}deg)`;
    }

    // Surprise message popup
    function showSurpriseMessage(card, event) {
        const message = document.createElement('div');
        const msg = surpriseMessages[Math.floor(Math.random() * surpriseMessages.length)];

        message.textContent = msg;
        message.style.cssText = `
        position: absolute; top: ${event.clientY}px; left: ${event.clientX}px;
        background: rgba(0,0,0,0.8); color: white; padding: 8px 16px;
        border-radius: 20px; font-weight: bold; z-index: 1000;
        pointer-events: none; transform: translate(-50%, -100%);
        animation: float 2s ease-out forwards, chromaticAberration 0.3s infinite;
    `;
        document.body.appendChild(message);

        setTimeout(() => message.remove(), 2000);
    }

    // Add keyboard interaction
    document.addEventListener('keydown', (e) => {
        if (e.key === 'r') { // Press 'r' for rainbow mode
            document.documentElement.style.setProperty('--neon-glow',
                `hsl(${Math.random() * 360}, 100%, 50%)`);
        }
    });

    // Initialize with random colors on load
    window.addEventListener('load', () => {
        document.documentElement.style.setProperty('--sparkle-color-1',
            `hsl(${Math.random() * 360}, 100%, 70%)`);
    });
/**import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
    import { getAuth, GoogleAuthProvider, signInWithPopup } 
        from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

    const firebaseConfig = {
        apiKey: "AIzaSyA9ptGsJbPvZFLAPMoWum1wnIv3q9hI8XE",
        authDomain: "hairstylehub-aaff8.firebaseapp.com",
        projectId: "hairstylehub-aaff8",
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    // GLOBAL LOGIN FUNCTION
    window.googleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const token = await user.getIdToken();

            localStorage.setItem("authToken", token);
            localStorage.setItem("userName", user.displayName);
            localStorage.setItem("userPhoto", user.photoURL);

            alert("Logged in as " + user.displayName);
        } catch (err) {
            console.error(err);
        }*/