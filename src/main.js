// Main Application - 3D Magic Particles with Hand Tracking
import * as THREE from 'three';
import './styles/main.css';
import { CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR, CAMERA_Z, HANDS_CONFIG, VIDEO_WIDTH, VIDEO_HEIGHT } from './config.js';
import { FINGER_MESSAGES, SPECIAL_GESTURES } from './messages.js';
import { generateShapes } from './shapes.js';
import { detectGesture, countFingers, isHeartShape, isFaceRevealGesture, isPinchGesture } from './gestures.js';
import { createParticleSystem, updateTargetPositions, interpolatePositions } from './particles.js';

// State management
const state = {
    gesture: 'idle',
    targetPoints: [],
    isHandDetected: false,
    time: 0,
    revealStartTime: 0
};

// Initialize Three.js
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.008);

const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR
);
camera.position.z = CAMERA_Z;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Initialize particle system
const { particles, geometry, positions, targetPositions, randomOffsets } = createParticleSystem();
scene.add(particles);

// Generate shapes
const shapes = generateShapes();

// Animation loop
function animate() {
    state.time += 0.01;
    
    updateTargetPositions({
        gesture: state.gesture,
        shapes,
        targetPositions,
        randomOffsets,
        time: state.time,
        revealStartTime: state.revealStartTime
    });

    interpolatePositions(positions, targetPositions);
    geometry.attributes.position.needsUpdate = true;
    
    // Subtle camera sway
    camera.position.x = Math.sin(state.time * 0.2) * 5;
    camera.position.y = Math.cos(state.time * 0.2) * 5;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Handle MediaPipe results
function onResults(results) {
    const statusText = document.getElementById('status-text');
    const statusDot = document.getElementById('status-dot');
    const revealContainer = document.getElementById('reveal-container');

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        state.isHandDetected = true;
        statusDot.classList.add('active');

        // Collect hand data for gesture detection
        const handData = [];

        for (const landmarks of results.multiHandLandmarks) {
            const { fingerCount } = countFingers(landmarks);
            handData.push({ landmarks, fingerCount });
        }

        // Check for TWO-HAND gestures first
        if (results.multiHandLandmarks.length === 2) {
            const hand1 = results.multiHandLandmarks[0];
            const hand2 = results.multiHandLandmarks[1];
            
            // Face reveal gesture (2 fingers on each hand = peace signs)
            if (isFaceRevealGesture(handData[0].fingerCount, handData[1].fingerCount)) {
                if (state.gesture !== 'face_reveal') {
                    state.revealStartTime = state.time;
                }
                state.gesture = 'face_reveal';
                statusText.innerText = SPECIAL_GESTURES.face_reveal.label;
                revealContainer.classList.add('visible');
                return;
            }

            // Heart shape gesture
            if (isHeartShape(hand1, hand2)) {
                state.gesture = 'double_love';
                statusText.innerText = SPECIAL_GESTURES.double_love.label;
                revealContainer.classList.remove('visible');
                return;
            }
        }

        // Check for SINGLE-HAND pinch gesture (grab photo)
        if (results.multiHandLandmarks.length === 1) {
            const landmarks = results.multiHandLandmarks[0];
            if (isPinchGesture(landmarks)) {
                state.gesture = 'pinch';
                statusText.innerText = '📸 Foto Diambil!';
                revealContainer.classList.add('visible');
                return;
            }
        }

        // Hide photo if not special gesture
        revealContainer.classList.remove('visible');

        // Try Fingerpose detection first (more accurate)
        if (results.multiHandLandmarks.length === 1) {
            const landmarks = results.multiHandLandmarks[0];
            const fpResult = detectGesture(landmarks);
            
            if (fpResult.gesture && fpResult.confidence > 8) {
                // Map Fingerpose gesture to our gesture names
                const gestureMap = {
                    'one_finger': 'finger_1',
                    'two_finger': 'finger_2', 
                    'three_finger': 'finger_3',
                    'four_finger': 'finger_4',
                    'five_finger': 'finger_5',
                    'fist': 'fist',
                    'pinch': 'pinch'
                };
                
                const mappedGesture = gestureMap[fpResult.gesture];
                if (mappedGesture) {
                    state.gesture = mappedGesture;
                    
                    if (mappedGesture === 'fist') {
                        statusText.innerText = SPECIAL_GESTURES.fist.label;
                    } else if (mappedGesture === 'pinch') {
                        statusText.innerText = '📸 Foto Diambil!';
                        revealContainer.classList.add('visible');
                    } else if (mappedGesture.startsWith('finger_')) {
                        const num = parseInt(mappedGesture.split('_')[1]);
                        statusText.innerText = FINGER_MESSAGES[num]?.label || `${num} Jari`;
                    }
                    return;
                }
            }
        }

        // Fallback: Use simple finger counting for multi-hand or if Fingerpose fails
        let totalFingers = 0;
        for (const landmarks of results.multiHandLandmarks) {
            const { fingerCount } = countFingers(landmarks);
            totalFingers += fingerCount;
        }
        
        // Cap at 10 fingers
        totalFingers = Math.min(totalFingers, 10);

        // Determine gesture based on finger count
        if (totalFingers === 0) {
            state.gesture = 'fist';
            statusText.innerText = SPECIAL_GESTURES.fist.label;
        } else if (totalFingers >= 1 && totalFingers <= 10) {
            state.gesture = `finger_${totalFingers}`;
            statusText.innerText = FINGER_MESSAGES[totalFingers]?.label || `${totalFingers} Jari`;
        } else {
            state.gesture = 'idle';
            statusText.innerText = SPECIAL_GESTURES.idle.label;
        }

    } else {
        state.isHandDetected = false;
        state.gesture = 'idle';
        statusDot.classList.remove('active');
        statusText.innerText = 'Mencari Tangan...';
        if (revealContainer && revealContainer.classList.contains('visible')) {
            revealContainer.classList.remove('visible');
        }
    }
}

// Initialize MediaPipe Hands (using CDN-loaded globals)
function initMediaPipe() {
    // Wait for CDN scripts to load
    if (typeof window.Hands === 'undefined' || typeof window.Camera === 'undefined') {
        setTimeout(initMediaPipe, 100);
        return;
    }

    const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions(HANDS_CONFIG);
    hands.onResults(onResults);

    const videoElement = document.getElementById('input-video');
    const cameraUtils = new window.Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT
    });

    cameraUtils.start().then(() => {
        const loader = document.getElementById('loader');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    });
}

initMediaPipe();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Image error handling
const imgEl = document.getElementById('reveal-image');
if (imgEl) {
    imgEl.addEventListener('error', function(e) {
        if (this.src.includes('jpeg')) {
            this.style.display = 'none';
            document.getElementById('error-message').style.display = 'block';
        }
    });
}
