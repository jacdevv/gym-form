# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Squat Dashboard is a computer vision application that analyzes squat biomechanics in real-time using MediaPipe pose estimation. The system tracks key body landmarks and calculates three primary metrics:

1. **Knee Angle** - Hip-knee-ankle angle to measure squat depth (~180° standing, smaller when squatting)
2. **Torso Angle** - Shoulder-hip-knee angle to assess forward lean and back posture
3. **Vertical Depth Status** - Binary parallel check comparing hip and knee y-coordinates

## Development Environment

**Python Version Requirement**: This project requires Python 3.11 due to MediaPipe compatibility issues with Python 3.13+.

### Environment Setup
```bash
# Create and activate Python 3.11 virtual environment
uv venv --python python3.11 venv311
source venv311/bin/activate

# Install dependencies (requires Python 3.11)
uv pip install opencv-python mediapipe numpy
```

### Running the Application
```bash
# Activate environment first
source venv311/bin/activate

# Run main application
python3.11 squat_dashboard.py

# Run alternative OpenCV-only version (manual point selection)
python3.11 squat_dashboard_opencv.py
```

## Architecture

### Core Components

- **SquatDashboard class**: Main application logic containing MediaPipe pose detection, angle calculations, video processing, and form feedback system
- **MediaPipe Integration**: Uses RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE landmarks for side-view analysis
- **Real-time Processing**: Frame-by-frame analysis with overlay graphics showing metrics and pose skeleton
- **Rep Tracking & Feedback**: Post-rep analysis system that provides form feedback after each completed repetition

### Key Methods

- `calculate_angle()`: Three-point angle calculation using arctangent mathematics
- `get_depth_status()`: Y-coordinate comparison for parallel detection
- `process_frame()`: Main processing pipeline converting video frames to analyzed output
- `update_rep_count()`: Rep counting with metric tracking during descent/ascent phases
- `generate_rep_feedback()`: Post-rep analysis providing specific form recommendations
- `draw_metrics()`: Overlay rendering with timed feedback display
- `run_webcam()`/`run_video()`: Video input handlers for live camera or file playback

### Form Feedback System

The application tracks metrics throughout each rep and provides targeted feedback after completion:
- **Knee Angle Analysis**: Optimal depth range 110-135°, with feedback for shallow/deep squats
- **Torso Angle Analysis**: Optimal range 30-45° forward lean, with warnings for excessive lean/uprightness
- **Timed Display**: Feedback appears for 3 seconds after each rep completion
- **Deepest Position Tracking**: Stores worst angles reached during the descent for analysis

### Alternative Implementation

`squat_dashboard_opencv.py` provides a fallback version using manual point selection instead of automatic pose detection, useful when MediaPipe is unavailable or for testing specific landmark positions.

## Video Assets

The `videos/` directory contains test files:
- `deep_squat.mp4`: Example of below-parallel squat motion
- `parallel_squat.mp4`: Example of parallel squat motion

These are used for testing and validating the measurement algorithms without requiring live camera input.

## MediaPipe Dependencies

MediaPipe requires specific system libraries and may show GL context warnings on first run. The application uses:
- Model complexity: 1 (balance of speed/accuracy)
- Detection confidence: 0.5
- Tracking confidence: 0.5
- Side-view orientation assumed (user positioned sideways to camera)