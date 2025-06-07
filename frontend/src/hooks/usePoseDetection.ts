import { useRef, useEffect, useState, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseResults {
  poseLandmarks?: PoseLandmark[];
}

export interface SquatMetrics {
  kneeAngle: number;
  torsoAngle: number;
  depthStatus: string;
}

export interface RepData {
  kneeAngle: number;
  torsoAngle: number;
}

export interface RepFeedback {
  repNumber: number;
  feedback: string;
  deepestKneeAngle: number;
  deepestTorsoAngle: number;
}

export interface SquatState {
  repCount: number;
  inSquat: boolean;
  currentRepMetrics: RepData[];
  deepestKneeAngle: number;
  deepestTorsoAngle: number;
  repFeedbacks: RepFeedback[];
}

const SQUAT_THRESHOLD = 140;
const FEEDBACK_DURATION = 180; // 3 seconds at 60fps

export const usePoseDetection = () => {
  const poseRef = useRef<Pose | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [squatState, setSquatState] = useState<SquatState>({
    repCount: 0,
    inSquat: false,
    currentRepMetrics: [],
    deepestKneeAngle: 180,
    deepestTorsoAngle: 0,
    repFeedbacks: [],
  });

  const calculateAngle = useCallback((point1: PoseLandmark, point2: PoseLandmark, point3: PoseLandmark): number => {
    const a = [point1.x, point1.y];
    const b = [point2.x, point2.y];
    const c = [point3.x, point3.y];

    const radians = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
    let angle = Math.abs(radians * 180.0 / Math.PI);

    if (angle > 180.0) {
      angle = 360 - angle;
    }

    return angle;
  }, []);

  const getDepthStatus = useCallback((hip: PoseLandmark, knee: PoseLandmark): string => {
    return hip.y > knee.y ? "Below Parallel" : "Above Parallel";
  }, []);

  const generateRepFeedback = useCallback((deepestKnee: number, deepestTorso: number): string => {
    const feedbackLines: string[] = [];

    // Analyze knee angle (depth)
    if (deepestKnee >= 170) {
      feedbackLines.push("Too shallow - go deeper");
    } else if (deepestKnee > 135) {
      feedbackLines.push("Shallow squat - try for more depth");
    } else if (deepestKnee >= 110) {
      feedbackLines.push("Perfect depth!");
    } else if (deepestKnee >= 90) {
      feedbackLines.push("Good depth");
    } else if (deepestKnee >= 70) {
      feedbackLines.push("Parallel depth achieved");
    } else {
      feedbackLines.push("Very deep - be careful");
    }

    // Analyze torso angle
    if (deepestTorso >= 30 && deepestTorso <= 45) {
      feedbackLines.push("Good torso position");
    } else if (deepestTorso < 30) {
      feedbackLines.push("Torso too upright");
    } else if (deepestTorso <= 60) {
      feedbackLines.push("Slight forward lean");
    } else {
      feedbackLines.push("Too much forward lean");
    }

    return feedbackLines.join(" | ");
  }, []);

  const updateRepCount = useCallback((kneeAngle: number, torsoAngle: number) => {
    if (kneeAngle > 0) {
      setSquatState(prev => {
        const newState = { ...prev };

        if (kneeAngle < SQUAT_THRESHOLD && !prev.inSquat) {
          // Entering squat position
          newState.inSquat = true;
          newState.deepestKneeAngle = kneeAngle;
          newState.deepestTorsoAngle = torsoAngle;
          newState.currentRepMetrics = [];
        } else if (prev.inSquat) {
          // Currently in squat - track deepest angles
          if (kneeAngle < prev.deepestKneeAngle) {
            newState.deepestKneeAngle = kneeAngle;
            newState.deepestTorsoAngle = torsoAngle;
          }

          // Store current metrics
          newState.currentRepMetrics = [...prev.currentRepMetrics, { kneeAngle, torsoAngle }];

          if (kneeAngle >= SQUAT_THRESHOLD) {
            // Exiting squat position - count rep and generate feedback
            newState.inSquat = false;
            newState.repCount = prev.repCount + 1;
            
            const feedback = generateRepFeedback(prev.deepestKneeAngle, prev.deepestTorsoAngle);
            newState.repFeedbacks = [...prev.repFeedbacks, {
              repNumber: newState.repCount,
              feedback,
              deepestKneeAngle: prev.deepestKneeAngle,
              deepestTorsoAngle: prev.deepestTorsoAngle
            }];
            
            // Log rep completion for debugging
            console.log(`🏋️‍♂️ REP ${newState.repCount} - Deepest knee: ${prev.deepestKneeAngle.toFixed(1)}°, Deepest torso: ${prev.deepestTorsoAngle.toFixed(1)}°`);
          }
        }

        return newState;
      });
    }
  }, [generateRepFeedback]);

  const [currentMetrics, setCurrentMetrics] = useState<SquatMetrics>({
    kneeAngle: 0,
    torsoAngle: 0,
    depthStatus: "Unknown"
  });

  const processFrame = useCallback(async (
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ): Promise<SquatMetrics> => {
    if (!poseRef.current || !isInitialized) {
      return { kneeAngle: 0, torsoAngle: 0, depthStatus: "Unknown" };
    }

    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
      return { kneeAngle: 0, torsoAngle: 0, depthStatus: "Unknown" };
    }

    // Set canvas size to match video
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    // Clear and draw video frame
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    // Send frame to MediaPipe
    try {
      await poseRef.current.send({ image: videoElement });
    } catch (error) {
      console.error('Error processing frame:', error);
    }

    return currentMetrics;
  }, [isInitialized, currentMetrics]);

  const initializePose = useCallback(() => {
    if (poseRef.current) return;

    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults((results: PoseResults) => {
      // Process pose results here
      if (results.poseLandmarks) {
        const landmarks = results.poseLandmarks;
        
        // Get key landmarks (using right side landmarks for side view)
        const shoulder = landmarks[12]; // RIGHT_SHOULDER
        const hip = landmarks[24]; // RIGHT_HIP
        const knee = landmarks[26]; // RIGHT_KNEE
        const ankle = landmarks[28]; // RIGHT_ANKLE

        if (shoulder && hip && knee && ankle) {
          const kneeAngle = calculateAngle(hip, knee, ankle);
          const torsoAngle = calculateAngle(shoulder, hip, knee);
          const depthStatus = getDepthStatus(hip, knee);

          // Log angles for debugging
          console.log(`Knee: ${kneeAngle.toFixed(1)}°, Torso: ${torsoAngle.toFixed(1)}°, Depth: ${depthStatus}`);

          // Update current metrics
          setCurrentMetrics({ kneeAngle, torsoAngle, depthStatus });
          
          // Update rep count
          updateRepCount(kneeAngle, torsoAngle);
        }
      }
    });

    poseRef.current = pose;
    setIsInitialized(true);
  }, [calculateAngle, getDepthStatus, updateRepCount]);

  useEffect(() => {
    initializePose();

    return () => {
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
    };
  }, [initializePose]);

  return {
    pose: poseRef.current,
    isInitialized,
    squatState,
    currentMetrics,
    processFrame,
    calculateAngle,
    getDepthStatus,
  };
};