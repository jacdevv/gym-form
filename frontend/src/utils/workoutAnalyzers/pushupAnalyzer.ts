import { WorkoutAnalyzer, WorkoutMetrics, WorkoutState, RepResult, RepData } from '@/types/workouts';
import { PoseLandmark, LandmarkType } from '@/types/pose';
import { calculateAngle, areLandmarksValid } from '@/utils/poseAnalysis';

export const pushupAnalyzer: WorkoutAnalyzer = {
  calculateMetrics: (landmarks: PoseLandmark[]): WorkoutMetrics => {
    const shoulder = landmarks[LandmarkType.RIGHT_SHOULDER];
    const elbow = landmarks[LandmarkType.RIGHT_ELBOW];
    const wrist = landmarks[LandmarkType.RIGHT_WRIST];
    const hip = landmarks[LandmarkType.RIGHT_HIP];

    if (!areLandmarksValid([shoulder, elbow, wrist, hip])) {
      return {
        elbowAngle: 0,
        bodyAngle: 0
      };
    }

    const elbowAngle = calculateAngle(shoulder, elbow, wrist);
    const bodyAngle = calculateAngle(shoulder, hip, landmarks[LandmarkType.RIGHT_KNEE]);

    return {
      elbowAngle,
      bodyAngle
    };
  },

  detectRep: (metrics: WorkoutMetrics, state: WorkoutState): RepResult => {
    const elbowAngle = metrics.elbowAngle as number;
    const PUSHUP_THRESHOLD = 120;

    if (elbowAngle === 0) {
      return { shouldCount: false };
    }

    // Entering pushup position (going down)
    if (elbowAngle < PUSHUP_THRESHOLD && !state.inExercise) {
      return {
        shouldCount: false,
        enteringExercise: true
      };
    }

    // Exiting pushup position (going up) - count rep
    if (state.inExercise && elbowAngle >= PUSHUP_THRESHOLD) {
      const feedback = pushupAnalyzer.generateFeedback(state.deepestMetrics);
      return {
        shouldCount: true,
        exitingExercise: true,
        feedback
      };
    }

    return { shouldCount: false };
  },

  generateFeedback: (repData: RepData): string => {
    const deepestElbow = repData.elbowAngle || 180;
    const bodyAngle = repData.bodyAngle || 180;
    const feedbackLines: string[] = [];

    // Analyze elbow angle (depth)
    if (deepestElbow >= 140) {
      feedbackLines.push("Too shallow - go deeper");
    } else if (deepestElbow > 100) {
      feedbackLines.push("Shallow pushup - try for more depth");
    } else if (deepestElbow >= 80) {
      feedbackLines.push("Perfect depth!");
    } else if (deepestElbow >= 60) {
      feedbackLines.push("Good depth");
    } else {
      feedbackLines.push("Very deep - excellent range");
    }

    // Analyze body line
    if (bodyAngle >= 170) {
      feedbackLines.push("Good body line");
    } else if (bodyAngle >= 160) {
      feedbackLines.push("Slight body sag");
    } else {
      feedbackLines.push("Keep body straight");
    }

    return feedbackLines.join(" | ");
  },

  getMetricFeedback: (metricName: string, value: number | string) => {
    switch (metricName) {
      case 'elbowAngle':
        const angle = value as number;
        if (angle === 0) return { text: "No data", variant: "secondary" as const };
        if (angle >= 150) return { text: "Arms extended", variant: "default" as const };
        if (angle > 100) return { text: "Shallow", variant: "secondary" as const };
        if (angle >= 80) return { text: "Perfect depth!", variant: "default" as const };
        if (angle >= 60) return { text: "Good depth", variant: "default" as const };
        return { text: "Very deep", variant: "default" as const };

      case 'bodyAngle':
        const bodyAngle = value as number;
        if (bodyAngle === 0) return { text: "No data", variant: "secondary" as const };
        if (bodyAngle >= 170) return { text: "Good body line", variant: "default" as const };
        if (bodyAngle >= 160) return { text: "Slight sag", variant: "secondary" as const };
        return { text: "Body sagging", variant: "destructive" as const };

      default:
        return { text: "Unknown", variant: "secondary" as const };
    }
  }
};