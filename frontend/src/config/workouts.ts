import { WorkoutConfig, WorkoutType } from '@/types/workouts';
import { LandmarkType } from '@/types/pose';

export const workoutConfigs: Record<WorkoutType, WorkoutConfig> = {
  squat: {
    name: 'squat',
    displayName: 'Squat',
    description: 'Analyze squat form and depth',
    landmarks: [
      LandmarkType.RIGHT_SHOULDER,
      LandmarkType.RIGHT_HIP,
      LandmarkType.RIGHT_KNEE,
      LandmarkType.RIGHT_ANKLE
    ],
    metrics: [
      {
        name: 'kneeAngle',
        displayName: 'Knee Angle',
        unit: '°',
        optimal: { min: 110, max: 135 }
      },
      {
        name: 'torsoAngle',
        displayName: 'Torso Angle',
        unit: '°',
        optimal: { min: 30, max: 45 }
      },
      {
        name: 'depthStatus',
        displayName: 'Depth Status',
        unit: ''
      }
    ],
    thresholds: {
      entry: 140,
      exit: 140,
      metric: 'kneeAngle'
    },
    instructions: [
      'Position yourself sideways to the camera',
      'Ensure your full body is visible in the frame',
      'Perform squats with controlled movement',
      'Aim for knee angles between 110-135° for optimal depth',
      'Maintain torso angle between 30-45° for good form'
    ]
  },
  
  pushup: {
    name: 'pushup',
    displayName: 'Push-up',
    description: 'Analyze push-up form and range of motion',
    landmarks: [
      LandmarkType.RIGHT_SHOULDER,
      LandmarkType.RIGHT_ELBOW,
      LandmarkType.RIGHT_WRIST,
      LandmarkType.RIGHT_HIP
    ],
    metrics: [
      {
        name: 'elbowAngle',
        displayName: 'Elbow Angle',
        unit: '°',
        optimal: { min: 80, max: 100 }
      },
      {
        name: 'bodyAngle',
        displayName: 'Body Line',
        unit: '°',
        optimal: { min: 170, max: 180 }
      }
    ],
    thresholds: {
      entry: 120,
      exit: 120,
      metric: 'elbowAngle'
    },
    instructions: [
      'Position yourself sideways to the camera',
      'Keep your body in a straight line',
      'Lower until elbows reach 80-100° for optimal depth',
      'Maintain rigid core throughout movement'
    ]
  },
  
  deadlift: {
    name: 'deadlift',
    displayName: 'Deadlift',
    description: 'Analyze deadlift form and hip hinge',
    landmarks: [
      LandmarkType.RIGHT_SHOULDER,
      LandmarkType.RIGHT_HIP,
      LandmarkType.RIGHT_KNEE,
      LandmarkType.RIGHT_ANKLE
    ],
    metrics: [
      {
        name: 'hipAngle',
        displayName: 'Hip Angle',
        unit: '°',
        optimal: { min: 45, max: 90 }
      },
      {
        name: 'backAngle',
        displayName: 'Back Angle',
        unit: '°',
        optimal: { min: 15, max: 45 }
      }
    ],
    thresholds: {
      entry: 120,
      exit: 160,
      metric: 'hipAngle'
    },
    instructions: [
      'Position yourself sideways to the camera',
      'Keep the bar close to your body',
      'Hinge at the hips, not the knees',
      'Maintain neutral spine throughout movement'
    ]
  },
  
  'bicep-curl': {
    name: 'bicep-curl',
    displayName: 'Bicep Curl',
    description: 'Analyze bicep curl form and range of motion',
    landmarks: [
      LandmarkType.RIGHT_SHOULDER,
      LandmarkType.RIGHT_ELBOW,
      LandmarkType.RIGHT_WRIST
    ],
    metrics: [
      {
        name: 'elbowAngle',
        displayName: 'Elbow Angle',
        unit: '°',
        optimal: { min: 30, max: 45 }
      },
      {
        name: 'shoulderStability',
        displayName: 'Shoulder Position',
        unit: '°'
      }
    ],
    thresholds: {
      entry: 120,
      exit: 120,
      metric: 'elbowAngle'
    },
    instructions: [
      'Position yourself sideways to the camera',
      'Keep elbows at your sides',
      'Control the weight throughout the movement',
      'Achieve full range of motion'
    ]
  }
};

export const getWorkoutConfig = (workoutType: WorkoutType): WorkoutConfig => {
  return workoutConfigs[workoutType];
};

export const getAllWorkoutTypes = (): WorkoutType[] => {
  return Object.keys(workoutConfigs) as WorkoutType[];
};