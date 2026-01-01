// Configuration constants for the particle system

export const PARTICLE_COUNT = 20000;
export const PARTICLE_SIZE = 0.5;
export const TEXT_SAMPLE_DENSITY = 3;
export const LERP_SPEED = 0.05; // Faster transitions

// Color configuration
export const COLOR_START = 0x00aaff;
export const COLOR_END = 0xff00aa;

// Camera settings
export const CAMERA_FOV = 60;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000;
export const CAMERA_Z = 60;
export const CAMERA_Z_MOBILE = 130; // Optimized for mobile text visibility

// MediaPipe Hands settings
export const HANDS_CONFIG = {
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
};

// Camera Utils settings
export const VIDEO_WIDTH = 640;
export const VIDEO_HEIGHT = 480;
