import { WorkoutAnalyzer, WorkoutMetrics, WorkoutState, RepResult, RepData } from '@/types/workouts';
import { PoseLandmark, LandmarkType } from '@/types/pose';
import { calculateAngle, areLandmarksValid } from '@/utils/poseAnalysis';

export const deadliftAnalyzer: WorkoutAnalyzer = {
  calculateMetrics: (landmarks: PoseLandmark[]): WorkoutMetrics => {
    const shoulder = landmarks[LandmarkType.RIGHT_SHOULDER];
    const hip = landmarks[LandmarkType.RIGHT_HIP];
    const knee = landmarks[LandmarkType.RIGHT_KNEE];
    const ankle = landmarks[LandmarkType.RIGHT_ANKLE];

    if (!areLandmarksValid([shoulder, hip, knee, ankle])) {
      return {
        hipAngle: 0,
        backAngle: 0
      };
    }

    const hipAngle = calculateAngle(shoulder, hip, knee);
    const backAngle = calculateAngle(landmarks[LandmarkType.LEFT_SHOULDER] || shoulder, shoulder, hip);

    return {
      hipAngle,
      backAngle
    };
  },

  detectRep: (metrics: WorkoutMetrics, state: WorkoutState): RepResult => {
    const hipAngle = metrics.hipAngle as number;
    const DEADLIFT_ENTRY_THRESHOLD = 120;
    const DEADLIFT_EXIT_THRESHOLD = 160;

    if (hipAngle === 0) {
      return { shouldCount: false };
    }

    // Entering deadlift position (going down)
    if (hipAngle < DEADLIFT_ENTRY_THRESHOLD && !state.inExercise) {
      return {
        shouldCount: false,
        enteringExercise: true
      };
    }

    // Exiting deadlift position (standing up) - count rep
    if (state.inExercise && hipAngle >= DEADLIFT_EXIT_THRESHOLD) {
      const feedback = deadliftAnalyzer.generateFeedback(state.deepestMetrics);
      return {
        shouldCount: true,
        exitingExercise: true,
        feedback
      };
    }

    return { shouldCount: false };
  },

  generateFeedback: (repData: RepData): string => {
    const deepestHip = repData.hipAngle || 180;
    const backAngle = repData.backAngle || 0;
    const feedbackLines: string[] = [];

    // Analyze hip hinge
    if (deepestHip >= 120) {
      feedbackLines.push("Shallow hip hinge");
    } else if (deepestHip >= 90) {
      feedbackLines.push("Good hip hinge");
    } else if (deepestHip >= 60) {
      feedbackLines.push("Deep hip hinge");
    } else {
      feedbackLines.push("Excellent hip mobility");
    }

    // Analyze back angle
    if (backAngle >= 15 && backAngle <= 45) {
      feedbackLines.push("Good back position");
    } else if (backAngle < 15) {
      feedbackLines.push("Too upright");
    } else {
      feedbackLines.push("Back too horizontal");
    }

    return feedbackLines.join(" | ");
  },

  getMetricFeedback: (metricName: string, value: number | string) => {
    switch (metricName) {
      case 'hipAngle':
        const angle = value as number;
        if (angle === 0) return { text: "No data", variant: "secondary" as const };
        if (angle >= 160) return { text: "Standing", variant: "default" as const };
        if (angle >= 90) return { text: "Good hinge", variant: "default" as const };
        if (angle >= 60) return { text: "Deep hinge", variant: "default" as const };
        return { text: "Very deep", variant: "secondary" as const };

      case 'backAngle':
        const backAngle = value as number;
        if (backAngle === 0) return { text: "No data", variant: "secondary" as const };
        if (backAngle >= 15 && backAngle <= 45) return { text: "Good position", variant: "default" as const };
        if (backAngle < 15) return { text: "Too upright", variant: "secondary" as const };
        return { text: "Too horizontal", variant: "destructive" as const };

      default:
        return { text: "Unknown", variant: "secondary" as const };
    }
  }
};