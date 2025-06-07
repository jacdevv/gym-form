# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multipurpose React TypeScript application that analyzes workout form in real-time using MediaPipe pose detection. The system uses a modular architecture to support multiple exercise types (squats, push-ups, deadlifts, bicep curls) with exercise-specific form analysis and feedback.

### Supported Workouts
- **Squat** - Knee angle, torso angle, depth analysis
- **Push-up** - Elbow angle, body line analysis  
- **Deadlift** - Hip angle, back position analysis
- **Bicep Curl** - Elbow flexion, shoulder stability analysis

## Technology Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **MediaPipe** (@mediapipe/pose) for pose detection
- **shadcn/ui** for UI components (Card, Badge, Button)
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Architecture

### Modular Workout System

The application uses a plugin-like architecture where each workout type has its own analyzer while sharing common infrastructure:

- **Workout Analyzers** (`utils/workoutAnalyzers/`) - Exercise-specific logic for calculating metrics, detecting reps, and generating feedback
- **Workout Configs** (`config/workouts.ts`) - Exercise definitions including landmarks, metrics, thresholds, and instructions
- **Generic Hooks** (`hooks/common/`) - Reusable pose detection and video control logic
- **Shared Components** (`components/common/`) - Generic dashboard and workout selector

### Key Design Patterns

- **Strategy Pattern**: `WorkoutAnalyzer` interface allows swapping exercise analysis logic
- **Configuration-driven UI**: Metrics cards and instructions generated from workout configs
- **Separation of Concerns**: Video handling, pose detection, and workout analysis are decoupled

### MediaPipe Integration

Uses MediaPipe Pose with standardized configuration across all workouts:
- Model complexity: 1 (balance of speed/accuracy)
- Detection confidence: 0.5
- Tracking confidence: 0.5
- Right-side landmarks for side-view analysis (landmarks defined per workout in configs)

### Adding New Workouts

1. Create analyzer in `utils/workoutAnalyzers/` implementing `WorkoutAnalyzer` interface
2. Add configuration in `config/workouts.ts` defining landmarks, metrics, and thresholds
3. Import analyzer in `App.tsx` and add to `getAnalyzer()` switch statement

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## File Structure

```
src/
├── types/
│   ├── pose.ts              # MediaPipe pose types and landmarks
│   └── workouts.ts          # Workout abstraction interfaces
├── config/
│   └── workouts.ts          # Workout configurations and metadata
├── utils/
│   ├── poseAnalysis.ts      # Common pose calculation utilities
│   └── workoutAnalyzers/    # Exercise-specific analysis logic
│       ├── squatAnalyzer.ts
│       ├── pushupAnalyzer.ts
│       ├── deadliftAnalyzer.ts
│       └── bicepCurlAnalyzer.ts
├── hooks/common/
│   ├── usePoseDetection.ts  # Generic pose detection hook
│   └── useVideoControl.ts   # Video handling utilities
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── common/              # Shared workout components
│   │   ├── WorkoutDashboard.tsx
│   │   └── WorkoutSelector.tsx
│   └── SquatDashboard.tsx   # Legacy component (kept for reference)
└── App.tsx                  # Main app with workout switching
```

## Key Dependencies

```json
{
  "@mediapipe/pose": "^0.5.1675469404",
  "@mediapipe/drawing_utils": "^0.3.1675466124", 
  "@mediapipe/camera_utils": "^0.3.1675466862",
  "react": "^19.1.0",
  "lucide-react": "^0.513.0"
}
```

## Workout Analysis Framework

### WorkoutAnalyzer Interface
Each workout implements three core methods:
- `calculateMetrics()` - Computes exercise-specific measurements from pose landmarks
- `detectRep()` - Determines rep start/end and triggers counting logic
- `generateFeedback()` - Provides form analysis based on rep performance
- `getMetricFeedback()` - Real-time feedback for individual metrics

### Common Analysis Utilities
- `calculateAngle()` - Three-point angle calculation for joint analysis
- `areLandmarksValid()` - Visibility and boundary checking for pose data
- `getDepthStatus()` - Y-coordinate comparison for depth analysis

### Rep Detection Pattern
Each analyzer uses threshold-based state transitions:
1. **Entry Detection** - Exercise-specific angle drops below entry threshold
2. **Tracking Phase** - Monitor deepest/best metrics during exercise
3. **Exit Detection** - Angle rises above exit threshold, triggering rep count
4. **Feedback Generation** - Analyze tracked metrics for form recommendations

## Browser Compatibility

- Requires modern browser with WebRTC support for webcam
- MediaPipe works in Chrome, Firefox, Safari (latest versions)
- File upload works across all modern browsers

## Performance Considerations

- MediaPipe processing runs at ~30fps for real-time analysis
- Canvas overlay for pose visualization
- Efficient React hooks prevent unnecessary re-renders
- Async frame processing to avoid blocking UI

## Troubleshooting

### Common Issues
1. **Webcam not working** - Check browser permissions
2. **MediaPipe loading errors** - Ensure CDN access for model files
3. **Performance issues** - Lower video resolution or frame rate

### Development Notes
- MediaPipe models load from CDN (jsDelivr)
- Video element must be playing before pose detection works
- Canvas overlay matches video dimensions automatically
- Side-view positioning required for accurate analysis
- Each workout analyzer is independent and can be developed/tested separately