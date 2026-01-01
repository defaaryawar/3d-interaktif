// Gesture detection using Fingerpose library
import * as fp from 'fingerpose';

// Define custom gestures for each finger count
const gestures = {};

// 1 Finger - Index pointing up
const oneFingerGesture = new fp.GestureDescription('one_finger');
oneFingerGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
oneFingerGesture.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 0.7);
oneFingerGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
oneFingerGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
oneFingerGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
gestures.one_finger = oneFingerGesture;

// 2 Fingers - Peace sign
const twoFingerGesture = new fp.GestureDescription('two_finger');
twoFingerGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
twoFingerGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
twoFingerGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
twoFingerGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
gestures.two_finger = twoFingerGesture;

// 3 Fingers
const threeFingerGesture = new fp.GestureDescription('three_finger');
threeFingerGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
threeFingerGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
threeFingerGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.NoCurl, 1.0);
threeFingerGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
gestures.three_finger = threeFingerGesture;

// 4 Fingers (all except thumb)
const fourFingerGesture = new fp.GestureDescription('four_finger');
fourFingerGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
fourFingerGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
fourFingerGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.NoCurl, 1.0);
fourFingerGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);
fourFingerGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);
gestures.four_finger = fourFingerGesture;

// 5 Fingers - Open hand
const fiveFingerGesture = new fp.GestureDescription('five_finger');
fiveFingerGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
fiveFingerGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
fiveFingerGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
fiveFingerGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.NoCurl, 1.0);
fiveFingerGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);
gestures.five_finger = fiveFingerGesture;

// Fist - All curled
const fistGesture = new fp.GestureDescription('fist');
fistGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
fistGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
fistGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
fistGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
fistGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
gestures.fist = fistGesture;

// Pinch gesture - Thumb and index touching
const pinchGesture = new fp.GestureDescription('pinch');
pinchGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 0.8);
pinchGesture.addCurl(fp.Finger.Index, fp.FingerCurl.HalfCurl, 0.8);
pinchGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
pinchGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
pinchGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
gestures.pinch = pinchGesture;

// Create gesture estimator with all gestures
const GE = new fp.GestureEstimator([
    gestures.one_finger,
    gestures.two_finger,
    gestures.three_finger,
    gestures.four_finger,
    gestures.five_finger,
    gestures.fist,
    gestures.pinch
]);

/**
 * Convert MediaPipe landmarks to Fingerpose format
 * MediaPipe gives normalized coords, Fingerpose expects pixel coords
 */
function convertLandmarks(landmarks) {
    return landmarks.map(lm => [
        lm.x * 640,  // Scale to video width
        lm.y * 480,  // Scale to video height  
        lm.z * 100   // Scale Z
    ]);
}

/**
 * Detect gesture using Fingerpose library
 * @param {Array} landmarks - MediaPipe hand landmarks
 * @returns {Object} Detected gesture info
 */
export function detectGesture(landmarks) {
    const converted = convertLandmarks(landmarks);
    const result = GE.estimate(converted, 7.5); // 7.5 = confidence threshold
    
    if (result.gestures.length > 0) {
        // Get gesture with highest confidence
        const best = result.gestures.reduce((a, b) => 
            a.score > b.score ? a : b
        );
        return {
            gesture: best.name,
            confidence: best.score
        };
    }
    
    return { gesture: null, confidence: 0 };
}

/**
 * Simple finger count (fallback when Fingerpose doesn't detect)
 */
export function countFingers(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const thumbIP = landmarks[3];
    const indexBase = landmarks[6];
    const middleBase = landmarks[10];
    const ringBase = landmarks[14];
    const pinkyBase = landmarks[18];
    const wrist = landmarks[0];

    const isIndexUp = indexTip.y < indexBase.y;
    const isMiddleUp = middleTip.y < middleBase.y;
    const isRingUp = ringTip.y < ringBase.y;
    const isPinkyUp = pinkyTip.y < pinkyBase.y;
    
    const thumbTipDist = Math.abs(thumbTip.x - wrist.x);
    const thumbIPDist = Math.abs(thumbIP.x - wrist.x);
    const isThumbUp = thumbTipDist > thumbIPDist * 1.1;

    let count = 0;
    if (isThumbUp) count++;
    if (isIndexUp) count++;
    if (isMiddleUp) count++;
    if (isRingUp) count++;
    if (isPinkyUp) count++;

    return {
        fingerCount: count,
        isThumbUp,
        isIndexUp,
        isMiddleUp,
        isRingUp,
        isPinkyUp
    };
}

/**
 * Check if two hands are making heart shape
 */
export function isHeartShape(hand1, hand2) {
    const thumb1 = hand1[4];
    const thumb2 = hand2[4];
    const index1 = hand1[8];
    const index2 = hand2[8];
    
    const thumbDist = Math.hypot(thumb1.x - thumb2.x, thumb1.y - thumb2.y);
    const indexDist = Math.hypot(index1.x - index2.x, index1.y - index2.y);
    
    return thumbDist < 0.15 && indexDist < 0.15;
}

/**
 * Check if two hands are showing peace sign
 */
export function isFaceRevealGesture(hand1Fingers, hand2Fingers) {
    return hand1Fingers === 2 && hand2Fingers === 2;
}

/**
 * Check if hand is making pinch gesture
 */
export function isPinchGesture(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    
    const middleBase = landmarks[10];
    const ringBase = landmarks[14];
    const pinkyBase = landmarks[18];
    
    const isMiddleDown = middleTip.y > middleBase.y;
    const isRingDown = ringTip.y > ringBase.y;
    const isPinkyDown = pinkyTip.y > pinkyBase.y;
    
    return pinchDist < 0.08 && isMiddleDown && isRingDown && isPinkyDown;
}
