import { PoseLandmark, LandmarkType } from './pose';

export interface WorkoutMetrics {
  [key: string]: number | string;
}

export interface RepData {
  [key: string]: number;
}

export interface RepFeedback {
  repNumber: number;
  feedback: string;
  metrics: RepData;
}

export interface WorkoutState {
  repCount: number;
  inExercise: boolean;
  currentRepMetrics: RepData[];
  deepestMetrics: RepData;
  repFeedbacks: RepFeedback[];
}

export interface RepResult {
  shouldCount: boolean;
  enteringExercise?: boolean;
  exitingExercise?: boolean;
  feedback?: string;
}

export interface WorkoutConfig {
  name: string;
  displayName: string;
  description: string;
  landmarks: LandmarkType[];
  metrics: {
    name: string;
    displayName: string;
    unit: string;
    optimal?: {
      min: number;
      max: number;
    };
  }[];
  thresholds: {
    entry: number;
    exit: number;
    metric: string;
  };
  instructions: string[];
}

export interface WorkoutAnalyzer {
  calculateMetrics: (landmarks: PoseLandmark[]) => WorkoutMetrics;
  detectRep: (metrics: WorkoutMetrics, state: WorkoutState) => RepResult;
  generateFeedback: (repData: RepData) => string;
  getMetricFeedback: (metricName: string, value: number | string) => {
    text: string;
    variant: 'default' | 'secondary' | 'destructive';
  };
}

export type WorkoutType = 'squat' | 'pushup' | 'deadlift' | 'bicep-curl';