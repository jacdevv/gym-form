# Gym Form Analysis - Python Backend

A computer vision application that analyzes squat biomechanics in real-time using MediaPipe pose estimation and OpenCV.

## Overview

This Python backend provides real-time squat form analysis through computer vision. The system tracks key body landmarks and calculates three primary metrics:

1. **Knee Angle** - Hip-knee-ankle angle to measure squat depth (~180° standing, smaller when squatting)
2. **Torso Angle** - Shoulder-hip-knee angle to assess forward lean and back posture  
3. **Vertical Depth Status** - Binary parallel check comparing hip and knee y-coordinates

## Features

- **Real-time Pose Detection** - Uses MediaPipe for automatic body landmark detection
- **Rep Counting** - Automatic repetition counting with form feedback
- **Form Analysis** - Post-rep analysis with specific improvement recommendations
- **Multi-input Support** - Works with webcam feed or video files
- **Alternative Implementation** - Manual point selection fallback when MediaPipe unavailable

## Requirements

**Python Version**: Requires Python 3.11 due to MediaPipe compatibility issues with Python 3.13+

### Dependencies

```
opencv-python==4.8.1.78
mediapipe==0.10.8
numpy==1.24.3
```

## Installation

1. **Create Python 3.11 virtual environment:**
   ```bash
   uv venv --python python3.11 venv311
   source venv311/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   uv pip install -r requirements.txt
   ```

## Usage

### Activate Environment
```bash
source venv311/bin/activate
```

### Run Main Application (MediaPipe)
```bash
python3.11 squat_dashboard.py
```

**Options:**
1. Use webcam for live analysis
2. Test with `deep_squat.mp4` video
3. Test with `parallel_squat.mp4` video

### Run Alternative Version (Manual Selection)
```bash
python3.11 squat_dashboard_opencv.py
```

**Setup:**
- Position yourself sideways to camera
- Click to set: SHOULDER → HIP → KNEE → ANKLE
- Press 'r' to reset points, 'q' to quit

## Form Feedback System

The application provides targeted feedback after each repetition:

### Knee Angle Analysis
- **110-135°**: Perfect depth
- **135-170°**: Shallow squat
- **90-110°**: Good depth
- **70-90°**: Parallel squat
- **<70°**: Very deep squat

### Torso Angle Analysis
- **30-45°**: Good torso angle
- **<30°**: Too upright
- **45-60°**: Slight forward lean
- **>60°**: Too much forward lean

## File Structure

```
python/
├── squat_dashboard.py          # Main MediaPipe-based application
├── squat_dashboard_opencv.py   # Manual point selection version
├── requirements.txt            # Python dependencies
├── CLAUDE.md                   # Development guidance
├── videos/                     # Test video files
│   ├── deep_squat.mp4
│   └── parallel_squat.mp4
└── venv311/                    # Python 3.11 virtual environment
```

## Technical Details

### MediaPipe Configuration
- Model complexity: 1 (balance of speed/accuracy)
- Detection confidence: 0.5
- Tracking confidence: 0.5
- Uses right-side landmarks for side-view analysis

### Angle Calculations
- **Knee Angle**: Hip-knee-ankle angle using arctangent mathematics
- **Torso Angle**: Shoulder-hip-knee angle for posture assessment
- **Depth Status**: Y-coordinate comparison between hip and knee positions

### Rep Counting Logic
- Enters squat when knee angle < 140°
- Tracks deepest angles during descent
- Counts rep on return to standing (knee angle ≥ 140°)
- Generates feedback based on deepest position reached

## Troubleshooting

### MediaPipe GL Context Warnings
MediaPipe may show GL context warnings on first run - these are typically harmless and won't affect functionality.

### Python Version Issues
If you encounter MediaPipe import errors, ensure you're using Python 3.11:
```bash
python --version  # Should show Python 3.11.x
```

### Camera Access
If webcam doesn't work, check:
- Camera permissions
- No other applications using the camera
- Try different camera index (change `VideoCapture(0)` to `VideoCapture(1)`)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and setup instructions.