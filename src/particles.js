// Particle system module
import * as THREE from 'three';
import { PARTICLE_COUNT, PARTICLE_SIZE, COLOR_START, COLOR_END, LERP_SPEED } from './config.js';

/**
 * Generate sprite texture for particles
 * @returns {THREE.Texture} Generated texture
 */
function generateSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * Create the particle system
 * @returns {Object} Object containing particles, geometry, and helper arrays
 */
export function createParticleSystem() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const randomOffsets = new Float32Array(PARTICLE_COUNT * 3);

    const colorStart = new THREE.Color(COLOR_START);
    const colorEnd = new THREE.Color(COLOR_END);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Initial chaotic positions
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

        randomOffsets[i * 3] = Math.random();
        randomOffsets[i * 3 + 1] = Math.random();
        randomOffsets[i * 3 + 2] = Math.random();

        // Color gradient with boosted brightness
        const mix = Math.random();
        const col = colorStart.clone().lerp(colorEnd, mix);
        col.r = Math.min(1, col.r * 1.5);
        col.g = Math.min(1, col.g * 1.5);
        col.b = Math.min(1, col.b * 1.5);
        
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: PARTICLE_SIZE * 1.5,
        vertexColors: true,
        map: generateSprite(),
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);

    return {
        particles,
        geometry,
        positions: geometry.attributes.position.array,
        targetPositions,
        randomOffsets
    };
}

/**
 * Update target positions based on current gesture
 * @param {Object} params - Update parameters
 */
export function updateTargetPositions({ gesture, shapes, targetPositions, randomOffsets, time, revealStartTime }) {
    // IDLE MODE - Christmas Tree 🎄 with gentle rotation
    if (gesture === 'idle') {
        const shape = shapes.christmasTree;
        if (shape && shape.length > 0) {
            const len = shape.length;
            const rotationSpeed = 0.3;
            
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const pt = shape[i % len];
                
                // Rotate tree slowly
                const angle = time * rotationSpeed;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                
                // Apply rotation around Y axis
                const rotatedX = pt.x * cos - pt.z * sin;
                const rotatedZ = pt.x * sin + pt.z * cos;
                
                // Add subtle twinkling
                const twinkle = Math.sin(time * 3 + i * 0.1) * 0.5;
                
                targetPositions[i * 3] = rotatedX + twinkle;
                targetPositions[i * 3 + 1] = pt.y;
                targetPositions[i * 3 + 2] = rotatedZ;
            }
        }
    }
    // FIST MODE - Black Hole Implosion
    else if (gesture === 'fist') {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = i * 0.1 + time * 2;
            const radius = 2 + randomOffsets[i * 3] * 3;
            
            targetPositions[i * 3] = Math.cos(angle) * radius;
            targetPositions[i * 3 + 1] = Math.sin(angle) * radius;
            targetPositions[i * 3 + 2] = (randomOffsets[i * 3 + 2] - 0.5) * 5;
        }
    }
    // PINCH MODE - Photo Frame with grab effect 📸
    else if (gesture === 'pinch') {
        const shape = shapes.photoFrame;
        const len = shape.length;
        
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const pt = shape[i % len];
            
            // Pulsing glow effect
            const pulse = Math.sin(time * 4) * 2;
            const sparkle = Math.sin(time * 8 + i * 0.3) * 1.5;
            
            targetPositions[i * 3] = pt.x + sparkle;
            targetPositions[i * 3 + 1] = pt.y + pulse * 0.3;
            targetPositions[i * 3 + 2] = pt.z + Math.sin(time * 2 + i * 0.1) * 3;
        }
    }
    // FACE REVEAL MODE - Vortex (2 peace signs)
    else if (gesture === 'face_reveal') {
        const shape = shapes.vortex;
        const len = shape.length;
        
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const pt = shape[i % len];
            
            const revealDuration = 1.5;
            const elapsed = time - revealStartTime;
            const progress = Math.min(elapsed / revealDuration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            const baseAngle = Math.atan2(pt.y, pt.x);
            const spinSpeed = 2.0 - progress * 1.5;
            const angle = baseAngle + time * spinSpeed;
            
            const startRadius = 20;
            const endRadius = Math.hypot(pt.x, pt.y);
            const r = startRadius + (endRadius - startRadius) * easeOut;
            
            const sparkle = Math.sin(time * 8 + i * 0.5) * (1 - progress) * 15;
            
            targetPositions[i * 3] = Math.cos(angle) * (r + sparkle);
            targetPositions[i * 3 + 1] = Math.sin(angle) * (r + sparkle);
            targetPositions[i * 3 + 2] = pt.z + Math.sin(time * 3 + i) * 20 * (1 - progress);
        }
    }
    // DOUBLE LOVE MODE
    else if (gesture === 'double_love') {
        const shape = shapes.specialLove;
        const len = shape.length;
        
        if (len > 0) {
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const pt = shape[i % len];
                const wobbleX = Math.sin(time * 2 + i) * 0.05;
                const wobbleY = Math.cos(time * 1.5 + i) * 0.05;
                
                if (i >= len) {
                    targetPositions[i * 3] = (Math.random() - 0.5) * 500;
                    targetPositions[i * 3 + 1] = (Math.random() - 0.5) * 500;
                    targetPositions[i * 3 + 2] = -500;
                } else {
                    targetPositions[i * 3] = pt.x + wobbleX;
                    targetPositions[i * 3 + 1] = pt.y + wobbleY;
                    targetPositions[i * 3 + 2] = pt.z;
                }
            }
        }
    }
    // FINGER COUNT MODE (1-10 fingers)
    else if (gesture.startsWith('finger_')) {
        const fingerNum = parseInt(gesture.split('_')[1]);
        const shapeKey = `finger_${fingerNum}`;
        const shape = shapes[shapeKey];
        
        if (shape && shape.length > 0) {
            const len = shape.length;
            
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const pt = shape[i % len];
                const wobbleX = Math.sin(time * 2 + i) * 0.05;
                const wobbleY = Math.cos(time * 1.5 + i) * 0.05;
                
                if (i >= len) {
                    targetPositions[i * 3] = (Math.random() - 0.5) * 500;
                    targetPositions[i * 3 + 1] = (Math.random() - 0.5) * 500;
                    targetPositions[i * 3 + 2] = -500;
                } else {
                    targetPositions[i * 3] = pt.x + wobbleX;
                    targetPositions[i * 3 + 1] = pt.y + wobbleY;
                    targetPositions[i * 3 + 2] = pt.z;
                }
            }
        }
    }
}

/**
 * Interpolate particles towards target positions
 * @param {Float32Array} current - Current positions
 * @param {Float32Array} target - Target positions
 */
export function interpolatePositions(current, target) {
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
        const dist = target[i] - current[i];
        current[i] += dist * LERP_SPEED;
    }
}
