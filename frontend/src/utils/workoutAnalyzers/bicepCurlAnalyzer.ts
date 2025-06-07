import { WorkoutAnalyzer, WorkoutMetrics, WorkoutState, RepResult, RepData } from '@/types/workouts';
import { PoseLandmark, LandmarkType } from '@/types/pose';
import { calculateAngle, areLandmarksValid } from '@/utils/poseAnalysis';

export const bicepCurlAnalyzer: WorkoutAnalyzer = {
  calculateMetrics: (landmarks: PoseLandmark[]): WorkoutMetrics => {
    const shoulder = landmarks[LandmarkType.RIGHT_SHOULDER];
    const elbow = landmarks[LandmarkType.RIGHT_ELBOW];
    const wrist = landmarks[LandmarkType.RIGHT_WRIST];

    if (!areLandmarksValid([shoulder, elbow, wrist])) {
      return {
        elbowAngle: 0,
        shoulderStability: 0
      };
    }

    const elbowAngle = calculateAngle(shoulder, elbow, wrist);
    // Measure shoulder position relative to hip for stability
    const hip = landmarks[LandmarkType.RIGHT_HIP];
    const shoulderStability = hip ? Math.abs(shoulder.x - hip.x) * 100 : 0;

    return {
      elbowAngle,
      shoulderStability
    };
  },

  detectRep: (metrics: WorkoutMetrics, state: WorkoutState): RepResult => {
    const elbowAngle = metrics.elbowAngle as number;
    const CURL_THRESHOLD = 120;

    if (elbowAngle === 0) {
      return { shouldCount: false };
    }

    // Entering curl position (curling up)
    if (elbowAngle < CURL_THRESHOLD && !state.inExercise) {
      return {
        shouldCount: false,
        enteringExercise: true
      };
    }

    // Exiting curl position (lowering down) - count rep
    if (state.inExercise && elbowAngle >= CURL_THRESHOLD) {
      const feedback = bicepCurlAnalyzer.generateFeedback(state.deepestMetrics);
      return {
        shouldCount: true,
        exitingExercise: true,
        feedback
      };
    }

    return { shouldCount: false };
  },

  generateFeedback: (repData: RepData): string => {
    const tightestElbow = repData.elbowAngle || 180;
    const shoulderMovement = repData.shoulderStability || 0;
    const feedbackLines: string[] = [];

    // Analyze elbow flexion
    if (tightestElbow >= 120) {
      feedbackLines.push("Incomplete curl - flex more");
    } else if (tightestElbow >= 60) {
      feedbackLines.push("Good curl range");
    } else if (tightestElbow >= 30) {
      feedbackLines.push("Perfect curl!");
    } else {
      feedbackLines.push("Excellent range of motion");
    }

    // Analyze shoulder stability
    if (shoulderMovement <= 2) {
      feedbackLines.push("Good shoulder stability");
    } else if (shoulderMovement <= 5) {
      feedbackLines.push("Slight shoulder movement");
    } else {
      feedbackLines.push("Keep shoulders stable");
    }

    return feedbackLines.join(" | ");
  },

  getMetricFeedback: (metricName: string, value: number | string) => {
    switch (metricName) {
      case 'elbowAngle':
        const angle = value as number;
        if (angle === 0) return { text: "No data", variant: "secondary" as const };
        if (angle >= 150) return { text: "Arms extended", variant: "default" as const };
        if (angle >= 90) return { text: "Partial curl", variant: "secondary" as const };
        if (angle >= 45) return { text: "Good curl", variant: "default" as const };
        if (angle >= 30) return { text: "Perfect curl!", variant: "default" as const };
        return { text: "Full flexion", variant: "default" as const };

      case 'shoulderStability':
        const stability = value as number;
        if (stability === 0) return { text: "No data", variant: "secondary" as const };
        if (stability <= 2) return { text: "Very stable", variant: "default" as const };
        if (stability <= 5) return { text: "Slight movement", variant: "secondary" as const };
        return { text: "Too much movement", variant: "destructive" as const };

      default:
        return { text: "Unknown", variant: "secondary" as const };
    }
  }
};