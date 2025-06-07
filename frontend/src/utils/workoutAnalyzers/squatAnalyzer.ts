import { WorkoutAnalyzer, WorkoutMetrics, WorkoutState, RepResult, RepData } from '@/types/workouts';
import { PoseLandmark, LandmarkType } from '@/types/pose';
import { calculateAngle, getDepthStatus, areLandmarksValid } from '@/utils/poseAnalysis';

export const squatAnalyzer: WorkoutAnalyzer = {
  calculateMetrics: (landmarks: PoseLandmark[]): WorkoutMetrics => {
    const shoulder = landmarks[LandmarkType.RIGHT_SHOULDER];
    const hip = landmarks[LandmarkType.RIGHT_HIP];
    const knee = landmarks[LandmarkType.RIGHT_KNEE];
    const ankle = landmarks[LandmarkType.RIGHT_ANKLE];

    if (!areLandmarksValid([shoulder, hip, knee, ankle])) {
      return {
        kneeAngle: 0,
        torsoAngle: 0,
        depthStatus: "Unknown"
      };
    }

    const kneeAngle = calculateAngle(hip, knee, ankle);
    const torsoAngle = calculateAngle(shoulder, hip, knee);
    const depthStatus = getDepthStatus(hip, knee);

    return {
      kneeAngle,
      torsoAngle,
      depthStatus
    };
  },

  detectRep: (metrics: WorkoutMetrics, state: WorkoutState): RepResult => {
    const kneeAngle = metrics.kneeAngle as number;
    const torsoAngle = metrics.torsoAngle as number;
    const SQUAT_THRESHOLD = 140;

    if (kneeAngle === 0) {
      return { shouldCount: false };
    }

    // Entering squat position
    if (kneeAngle < SQUAT_THRESHOLD && !state.inExercise) {
      return {
        shouldCount: false,
        enteringExercise: true
      };
    }

    // Exiting squat position - count rep
    if (state.inExercise && kneeAngle >= SQUAT_THRESHOLD) {
      const feedback = squatAnalyzer.generateFeedback(state.deepestMetrics);
      return {
        shouldCount: true,
        exitingExercise: true,
        feedback
      };
    }

    return { shouldCount: false };
  },

  generateFeedback: (repData: RepData): string => {
    const deepestKnee = repData.kneeAngle || 180;
    const deepestTorso = repData.torsoAngle || 0;
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
  },

  getMetricFeedback: (metricName: string, value: number | string) => {
    switch (metricName) {
      case 'kneeAngle':
        const angle = value as number;
        if (angle === 0) return { text: "No data", variant: "secondary" as const };
        if (angle >= 170) return { text: "Standing position", variant: "default" as const };
        if (angle > 135) return { text: "Shallow squat", variant: "secondary" as const };
        if (angle >= 110) return { text: "Perfect depth!", variant: "default" as const };
        if (angle >= 90) return { text: "Good depth", variant: "default" as const };
        if (angle >= 70) return { text: "Parallel squat", variant: "secondary" as const };
        return { text: "Very deep squat", variant: "destructive" as const };

      case 'torsoAngle':
        const torsoAngle = value as number;
        if (torsoAngle === 0) return { text: "No data", variant: "secondary" as const };
        if (torsoAngle >= 30 && torsoAngle <= 45) return { text: "Good torso angle", variant: "default" as const };
        if (torsoAngle < 30) return { text: "Too upright", variant: "secondary" as const };
        if (torsoAngle <= 60) return { text: "Slight forward lean", variant: "secondary" as const };
        return { text: "Too much forward lean", variant: "destructive" as const };

      case 'depthStatus':
        const status = value as string;
        return {
          text: status === "Below Parallel" ? "Good Depth" : "Shallow",
          variant: status === "Below Parallel" ? "default" as const : "secondary" as const
        };

      default:
        return { text: "Unknown", variant: "secondary" as const };
    }
  }
};