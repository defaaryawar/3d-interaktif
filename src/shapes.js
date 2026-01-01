// Shape generation utilities for particle system
import { PARTICLE_COUNT, TEXT_SAMPLE_DENSITY } from './config.js';
import { FINGER_MESSAGES } from './messages.js';

/**
 * Create points from text for particle formation
 * @param {string[]} textLines - Array of text lines to render
 * @param {number} fontSize - Font size for rendering
 * @returns {Array} Array of {x, y, z} points
 */
export function createTextPoints(textLines, fontSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 2048;
    const height = 1024;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.font = `900 ${fontSize}px "Segoe UI", sans-serif`;

    const lineHeight = fontSize * 1.2;
    const startY = (height - (textLines.length - 1) * lineHeight) / 2;

    textLines.forEach((line, index) => {
        ctx.fillText(line.toUpperCase(), width / 2, startY + index * lineHeight);
    });

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const points = [];

    for (let y = 0; y < height; y += TEXT_SAMPLE_DENSITY) {
        for (let x = 0; x < width; x += TEXT_SAMPLE_DENSITY) {
            if (data[(y * width + x) * 4] > 128) {
                points.push({
                    x: (x - width / 2) * 0.08,
                    y: -(y - height / 2) * 0.08,
                    z: 0
                });
            }
        }
    }
    return points;
}

/**
 * Create vortex shape for face reveal animation
 * @returns {Array} Array of {x, y, z} points
 */
export function createVortex() {
    const points = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 * 10;
        const r = 160 + Math.random() * 100;
        points.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            z: (Math.random() - 0.5) * 50
        });
    }
    return points;
}

/**
 * Create Christmas tree shape for idle animation 🎄
 * @returns {Array} Array of {x, y, z} points
 */
export function createChristmasTree() {
    const points = [];
    const treeHeight = 80;
    const baseWidth = 50;
    const layers = 5;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const t = Math.random();
        
        // Tree layers (cone shape)
        const layer = Math.floor(Math.random() * layers);
        const layerY = treeHeight / 2 - (layer / layers) * treeHeight;
        const layerWidth = baseWidth * (1 - layer / layers * 0.7);
        
        // Random angle around the cone
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * layerWidth;
        
        // Add some variation for "branches"
        const branchNoise = Math.sin(angle * 8 + layer * 2) * 5;
        
        points.push({
            x: Math.cos(angle) * (r + branchNoise),
            y: layerY + (Math.random() - 0.5) * 10,
            z: Math.sin(angle) * (r + branchNoise)
        });
    }
    
    // Add trunk
    for (let i = 0; i < 500; i++) {
        points[i] = {
            x: (Math.random() - 0.5) * 8,
            y: -treeHeight / 2 - Math.random() * 15,
            z: (Math.random() - 0.5) * 8
        };
    }
    
    // Add star on top ⭐
    for (let i = 500; i < 800; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const r = 3 + Math.sin(angle * 5) * 2;
        points[i] = {
            x: Math.cos(angle) * r,
            y: treeHeight / 2 + 8,
            z: Math.sin(angle) * r
        };
    }
    
    return points;
}

/**
 * Create photo frame shape - particles surround where photo will appear
 * @returns {Array} Array of {x, y, z} points
 */
export function createPhotoFrame() {
    const points = [];
    const frameSize = 40; // Match the reveal container size ratio
    const frameThickness = 8;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const t = i / PARTICLE_COUNT;
        
        // Create frame border particles
        if (i < PARTICLE_COUNT * 0.7) {
            // Frame edges
            const side = Math.floor(t * 4) % 4;
            const pos = (t * 4) % 1;
            
            let x, y;
            switch (side) {
                case 0: x = -frameSize + pos * frameSize * 2; y = -frameSize; break; // Top
                case 1: x = frameSize; y = -frameSize + pos * frameSize * 2; break; // Right
                case 2: x = frameSize - pos * frameSize * 2; y = frameSize; break; // Bottom
                case 3: x = -frameSize; y = frameSize - pos * frameSize * 2; break; // Left
            }
            
            // Add thickness and sparkle
            const sparkle = Math.sin(i * 0.5) * 3;
            points.push({
                x: x + (Math.random() - 0.5) * frameThickness,
                y: y + (Math.random() - 0.5) * frameThickness,
                z: (Math.random() - 0.5) * 10 + sparkle
            });
        } else {
            // Floating particles around frame
            const angle = Math.random() * Math.PI * 2;
            const r = frameSize + 20 + Math.random() * 40;
            points.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r,
                z: (Math.random() - 0.5) * 30
            });
        }
    }
    
    return points;
}

/**
 * Generate all shapes including finger messages
 * @returns {Object} Object containing all precomputed shapes
 */
export function generateShapes() {
    const shapes = {
        vortex: createVortex(),
        christmasTree: createChristmasTree(),
        photoFrame: createPhotoFrame(),
        specialLove: createTextPoints(['FOR YOU', 'BEAUTIFUL WOMAN', 'NAJMITA ZAHIRA'], 130),
        missing: createTextPoints(['MASUKKAN FILE', 'us.jpeg', 'KE FOLDER'], 100)
    };

    // Generate shapes for each finger count (1-10)
    for (let i = 1; i <= 10; i++) {
        const msg = FINGER_MESSAGES[i];
        if (msg) {
            shapes[`finger_${i}`] = createTextPoints(msg.text, msg.fontSize);
        }
    }

    return shapes;
}
