import { useRef, useEffect, useState, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
import { PoseResults, PoseLandmark } from '@/types/pose';
import { WorkoutAnalyzer, WorkoutMetrics, WorkoutState, RepData } from '@/types/workouts';

const FEEDBACK_DURATION = 180; // 3 seconds at 60fps

export const usePoseDetection = (analyzer: WorkoutAnalyzer) => {
  const poseRef = useRef<Pose | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [workoutState, setWorkoutState] = useState<WorkoutState>({
    repCount: 0,
    inExercise: false,
    currentRepMetrics: [],
    deepestMetrics: {},
    repFeedbacks: [],
  });

  const [currentMetrics, setCurrentMetrics] = useState<WorkoutMetrics>({});

  const updateRepCount = useCallback((metrics: WorkoutMetrics) => {
    setWorkoutState(prev => {
      const newState = { ...prev };
      const repResult = analyzer.detectRep(metrics, prev);

      if (repResult.enteringExercise) {
        newState.inExercise = true;
        newState.deepestMetrics = { ...metrics } as RepData;
        newState.currentRepMetrics = [];
      } else if (prev.inExercise) {
        // Track deepest/best metrics during exercise
        const updatedDeepest = { ...prev.deepestMetrics };
        
        // For squats, track the smallest knee angle (deepest position)
        if (metrics.kneeAngle && typeof metrics.kneeAngle === 'number') {
          if (!updatedDeepest.kneeAngle || metrics.kneeAngle < updatedDeepest.kneeAngle) {
            updatedDeepest.kneeAngle = metrics.kneeAngle;
          }
        }
        
        // Track corresponding torso angle at deepest position
        if (metrics.torsoAngle && typeof metrics.torsoAngle === 'number') {
          updatedDeepest.torsoAngle = metrics.torsoAngle;
        }

        newState.deepestMetrics = updatedDeepest;
        newState.currentRepMetrics = [...prev.currentRepMetrics, { ...metrics } as RepData];

        if (repResult.shouldCount && repResult.exitingExercise) {
          newState.inExercise = false;
          newState.repCount = prev.repCount + 1;
          
          if (repResult.feedback) {
            newState.repFeedbacks = [...prev.repFeedbacks, {
              repNumber: newState.repCount,
              feedback: repResult.feedback,
              metrics: prev.deepestMetrics
            }];
          }
          
          console.log(`🏋️‍♂️ REP ${newState.repCount} - Metrics:`, prev.deepestMetrics);
        }
      }

      return newState;
    });
  }, [analyzer]);

  const processFrame = useCallback(async (
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ): Promise<WorkoutMetrics> => {
    if (!poseRef.current || !isInitialized) {
      return {};
    }

    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
      return {};
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
      if (results.poseLandmarks) {
        const landmarks = results.poseLandmarks as PoseLandmark[];
        const metrics = analyzer.calculateMetrics(landmarks);
        
        // Log metrics for debugging
        console.log('Calculated metrics:', metrics);

        // Update current metrics
        setCurrentMetrics(metrics);
        
        // Update rep count
        updateRepCount(metrics);
      }
    });

    poseRef.current = pose;
    setIsInitialized(true);
  }, [analyzer, updateRepCount]);

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
    workoutState,
    currentMetrics,
    processFrame,
  };
};