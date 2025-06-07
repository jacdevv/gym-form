# Contributing to Gym Form Dashboard

Welcome to the Gym Form Dashboard project! This guide will help you understand the codebase and start contributing effectively.

## Table of Contents

- [Quick Start](#quick-start)
- [Project Overview](#project-overview)
- [Architecture Deep Dive](#architecture-deep-dive)
- [Development Workflow](#development-workflow)
- [Adding New Workouts](#adding-new-workouts)
- [Code Style & Standards](#code-style--standards)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or equivalent package manager
- Modern browser with WebRTC support
- Webcam access for testing

### Setup

```bash
# Clone and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### First Contribution

1. Browse the running app to understand the UI
2. Try different workout types (squat, push-up, deadlift, bicep curl)
3. Check the browser console for any errors
4. Read through this guide and examine the code structure

## Project Overview

This is a **real-time workout form analysis application** built with React and MediaPipe. It uses computer vision to analyze exercise form and provide feedback.

### Key Features

- **Multiple Exercise Support**: Squat, push-up, deadlift, bicep curl
- **Real-time Analysis**: Live pose detection and metric calculation
- **Form Feedback**: Exercise-specific recommendations after each rep
- **Modular Architecture**: Easy to add new exercise types

### Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Computer Vision**: MediaPipe Pose Detection
- **State Management**: React hooks (no external library)

## Architecture Deep Dive

The application uses a **plugin-based architecture** where each exercise type is self-contained but shares common infrastructure.

### Directory Structure

```
src/
├── types/                    # TypeScript definitions
│   ├── pose.ts              # MediaPipe pose types
│   └── workouts.ts          # Workout interfaces
├── config/
│   └── workouts.ts          # Exercise configurations
├── utils/
│   ├── poseAnalysis.ts      # Common pose calculations
│   └── workoutAnalyzers/    # Exercise-specific logic
│       ├── squatAnalyzer.ts
│       ├── pushupAnalyzer.ts
│       ├── deadliftAnalyzer.ts
│       └── bicepCurlAnalyzer.ts
├── hooks/
│   ├── usePoseDetection.ts  # Legacy hook
│   └── common/              # Reusable hooks
│       ├── usePoseDetection.ts
│       └── useVideoControl.ts
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── common/              # Shared workout components
│   │   ├── WorkoutDashboard.tsx
│   │   └── WorkoutSelector.tsx
│   └── SquatDashboard.tsx   # Legacy component
└── App.tsx                  # Main app with workout switching
```

### Core Concepts

#### 1. WorkoutAnalyzer Interface

Every exercise implements this interface (`src/types/workouts.ts`):

```typescript
interface WorkoutAnalyzer {
  calculateMetrics(landmarks: PoseLandmarks): WorkoutMetrics;
  detectRep(metrics: WorkoutMetrics, currentState: any): RepDetectionResult;
  generateFeedback(repData: RepData): string[];
  getMetricFeedback(metrics: WorkoutMetrics): MetricFeedback;
}
```

#### 2. Workout Configuration

Each exercise has a configuration object (`src/config/workouts.ts`):

```typescript
interface WorkoutConfig {
  name: string;
  landmarks: PoseLandmarkName[];  // Required pose points
  metrics: MetricConfig[];        // What to measure
  instructions: string[];         // Setup instructions
  commonIssues: string[];        // Troubleshooting tips
}
```

#### 3. Data Flow

```
Camera/Video → MediaPipe → Pose Landmarks → Workout Analyzer → Metrics + Feedback → UI
```

### Key Files to Understand

| File | Purpose | When to Modify |
|------|---------|----------------|
| `App.tsx` | Main application, workout switching | Adding new workout types |
| `WorkoutDashboard.tsx` | Generic dashboard UI | UI improvements |
| `config/workouts.ts` | Exercise definitions | Adding workout configs |
| `utils/workoutAnalyzers/` | Exercise logic | Adding new exercises |
| `hooks/common/usePoseDetection.ts` | Pose detection logic | MediaPipe changes |

## Development Workflow

### 1. Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Type checking
npm run build  # includes tsc -b

# Linting
npm run lint

# Production preview
npm run preview
```

### 2. Making Changes

#### For UI Changes:
1. Modify components in `src/components/`
2. Use existing shadcn/ui components when possible
3. Follow Tailwind CSS patterns
4. Test in different browser sizes

#### For Exercise Logic:
1. Modify analyzer in `src/utils/workoutAnalyzers/`
2. Update config in `src/config/workouts.ts` if needed
3. Test with webcam and video files
4. Verify feedback messages are helpful

#### For New Features:
1. Plan the architecture (discuss in issues)
2. Add types in `src/types/`
3. Implement core logic
4. Add UI components
5. Update documentation

### 3. Testing Your Changes

```bash
# Always test these scenarios:
1. Webcam feed works
2. Video file upload works  
3. Exercise switching works
4. Metrics calculate correctly
5. Rep counting is accurate
6. Feedback appears and is helpful
7. No console errors
8. Responsive design
```

## Adding New Workouts

### Step-by-Step Guide

#### 1. Create the Analyzer

Create `src/utils/workoutAnalyzers/yourExerciseAnalyzer.ts`:

```typescript
import { WorkoutAnalyzer, WorkoutMetrics, RepDetectionResult } from '@/types/workouts';
import { PoseLandmarks } from '@/types/pose';
import { calculateAngle, areLandmarksValid } from '@/utils/poseAnalysis';

export const yourExerciseAnalyzer: WorkoutAnalyzer = {
  calculateMetrics(landmarks: PoseLandmarks): WorkoutMetrics {
    // Calculate exercise-specific angles/measurements
    const yourAngle = calculateAngle(
      landmarks.LEFT_SHOULDER,
      landmarks.LEFT_ELBOW, 
      landmarks.LEFT_WRIST
    );
    
    return {
      yourAngle: Math.round(yourAngle),
      // Add other metrics...
    };
  },

  detectRep(metrics: WorkoutMetrics, currentState: any): RepDetectionResult {
    // Implement rep detection logic
    // Return { repCompleted: boolean, newState: any, repData?: RepData }
  },

  generateFeedback(repData: RepData): string[] {
    // Analyze rep performance and return feedback array
  },

  getMetricFeedback(metrics: WorkoutMetrics): MetricFeedback {
    // Return real-time feedback for current pose
  }
};
```

#### 2. Add Configuration

Add to `src/config/workouts.ts`:

```typescript
'your-exercise': {
  name: 'Your Exercise',
  landmarks: ['LEFT_SHOULDER', 'LEFT_ELBOW', 'LEFT_WRIST'],
  metrics: [
    {
      name: 'Your Angle',
      key: 'yourAngle',
      unit: '°',
      goodRange: [90, 120],
      target: 90
    }
  ],
  instructions: [
    'Position yourself sideways to camera',
    'Keep your form controlled',
    // Add setup instructions...
  ],
  commonIssues: [
    'Make sure camera can see your full body',
    // Add troubleshooting tips...
  ]
}
```

#### 3. Register in App

Add to `src/types/workouts.ts`:
```typescript
export type WorkoutType = 'squat' | 'pushup' | 'deadlift' | 'bicep-curl' | 'your-exercise';
```

Add to `App.tsx`:
```typescript
import { yourExerciseAnalyzer } from '@/utils/workoutAnalyzers/yourExerciseAnalyzer';

const getAnalyzer = (workoutType: WorkoutType) => {
  switch (workoutType) {
    // existing cases...
    case 'your-exercise':
      return yourExerciseAnalyzer;
  }
};
```

#### 4. Test Thoroughly

- Verify metrics calculate correctly
- Test rep detection with actual movements
- Check feedback quality
- Ensure UI displays properly

## Code Style & Standards

### TypeScript

- Use strict typing, avoid `any`
- Define interfaces for complex objects
- Use proper return types for functions
- Leverage type inference where appropriate

### React

- Use functional components with hooks
- Keep components focused and single-purpose
- Use proper dependency arrays in useEffect
- Handle loading/error states

### File Organization

- One component per file
- Group related files in directories
- Use descriptive file and variable names
- Keep imports organized (external → internal → relative)

### Naming Conventions

- Components: PascalCase (`WorkoutDashboard`)
- Hooks: camelCase starting with 'use' (`usePoseDetection`)
- Utils: camelCase (`calculateAngle`)
- Types: PascalCase (`WorkoutMetrics`)
- Files: kebab-case for multi-word (`workout-analyzers`)

## Testing

### Manual Testing Checklist

- [ ] Webcam permission and access works
- [ ] Video file upload and playback works
- [ ] All workout types switch correctly
- [ ] Metrics update in real-time
- [ ] Rep counting is accurate
- [ ] Feedback messages are clear and helpful
- [ ] UI is responsive on mobile/desktop
- [ ] No console errors or warnings
- [ ] Performance is smooth (30fps)

### Browser Testing

Test in multiple browsers:
- Chrome (primary target)
- Firefox 
- Safari (WebRTC support)
- Mobile browsers

### MediaPipe Testing

- Test in good and poor lighting
- Test with different camera angles
- Test with partially visible poses
- Verify landmark detection accuracy

## Troubleshooting

### Common Issues

#### MediaPipe Not Loading
- Check browser console for CDN errors
- Verify internet connection
- Try incognito mode to rule out extensions

#### Webcam Not Working
- Check browser permissions
- Verify camera is not used by other apps
- Test in different browsers

#### Performance Issues
- Lower video resolution
- Check if other apps are using camera
- Monitor browser dev tools performance

#### Rep Detection Issues
- Ensure proper camera positioning (side view)
- Check that required landmarks are visible
- Verify threshold values in workout config

### Debug Tools

- Browser DevTools Console
- React DevTools extension
- MediaPipe visualization (enable in code)
- Performance monitor in browser

### Getting Help

1. Check existing issues on GitHub
2. Search documentation (CLAUDE.md files)
3. Ask questions in discussions
4. Provide minimal reproduction steps

## Resources

- [MediaPipe Pose Documentation](https://google.github.io/mediapipe/solutions/pose.html)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

Thank you for contributing to Gym Form Dashboard! Your efforts help make fitness technology more accessible and effective.