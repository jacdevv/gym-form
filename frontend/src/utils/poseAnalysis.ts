import { PoseLandmark } from '@/types/pose';

/**
 * Calculate the angle between three points
 * @param point1 First point (typically the "arm" of the angle)
 * @param point2 Vertex point (the point where the angle is measured)
 * @param point3 Third point (typically the other "arm" of the angle)
 * @returns Angle in degrees
 */
export const calculateAngle = (
  point1: PoseLandmark,
  point2: PoseLandmark,
  point3: PoseLandmark
): number => {
  const a = [point1.x, point1.y];
  const b = [point2.x, point2.y];
  const c = [point3.x, point3.y];

  const radians = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
  let angle = Math.abs(radians * 180.0 / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }

  return angle;
};

/**
 * Calculate the distance between two points
 */
export const calculateDistance = (point1: PoseLandmark, point2: PoseLandmark): number => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Get depth status by comparing y-coordinates
 */
export const getDepthStatus = (upperPoint: PoseLandmark, lowerPoint: PoseLandmark): string => {
  return upperPoint.y > lowerPoint.y ? "Below Parallel" : "Above Parallel";
};

/**
 * Check if landmarks are visible and valid
 */
export const areLandmarksValid = (landmarks: PoseLandmark[], minVisibility = 0.5): boolean => {
  return landmarks.every(landmark => 
    landmark && 
    landmark.visibility >= minVisibility &&
    landmark.x >= 0 && landmark.x <= 1 &&
    landmark.y >= 0 && landmark.y <= 1
  );
};

/**
 * Smooth angle values to reduce jitter
 */
export const smoothAngle = (currentAngle: number, previousAngle: number, factor = 0.7): number => {
  if (previousAngle === 0) return currentAngle;
  return factor * currentAngle + (1 - factor) * previousAngle;
};