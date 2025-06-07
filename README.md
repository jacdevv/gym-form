# Gym Form Analysis

A comprehensive workout form analysis application using computer vision to provide real-time feedback on exercise technique. The system supports multiple workout types and offers both web-based and Python implementations.

## Project Structure

This repository contains two main components:

### 🌐 Frontend (`/frontend`)

A modern React TypeScript web application that analyzes workout form in real-time using MediaPipe pose detection.

**Features:**
- Real-time pose detection with webcam or video files
- Support for multiple workout types (squats, push-ups, deadlifts, bicep curls)
- Live metrics display and form feedback
- Automatic rep counting and performance analysis
- Responsive UI with visual pose overlay

**Tech Stack:**
- React 19 with TypeScript
- MediaPipe for pose detection
- Vite for build tooling
- Tailwind CSS & shadcn/ui components

**Quick Start:**
```bash
cd frontend
npm install
npm run dev
```

### 🐍 Python (`/python`)

A Python-based squat analysis dashboard using MediaPipe and OpenCV for real-time biomechanics analysis.

**Features:**
- Real-time squat form analysis
- Knee angle, torso angle, and depth tracking
- Rep counting with detailed feedback
- Support for webcam and video file input
- Alternative OpenCV-only implementation

**Tech Stack:**
- Python 3.11 (required for MediaPipe compatibility)
- MediaPipe for pose estimation
- OpenCV for video processing
- NumPy for calculations

**Quick Start:**
```bash
cd python
source venv311/bin/activate  # Python 3.11 required
python squat_dashboard.py
```

## Key Metrics Analyzed

- **Knee Angle**: Hip-knee-ankle alignment for depth assessment
- **Torso Angle**: Forward lean and back posture analysis
- **Depth Tracking**: Parallel detection and range of motion
- **Rep Counting**: Automatic detection with performance feedback

## Supported Workouts

| Exercise | Frontend | Python |
|----------|----------|---------|
| Squats | ✅ | ✅ |
| Push-ups | ✅ | ❌ |
| Deadlifts | ✅ | ❌ |
| Bicep Curls | ✅ | ❌ |

## Getting Started

Choose your preferred implementation:

- **Web Application**: Use the frontend for multi-exercise support and modern UI
- **Python Application**: Use for focused squat analysis with advanced biomechanics tracking

Both implementations use MediaPipe pose detection with side-view positioning for optimal accuracy.

## Requirements

- **Frontend**: Modern browser with WebRTC support for webcam access
- **Python**: Python 3.11 (MediaPipe compatibility requirement)
- **Camera**: Webcam or video files for analysis
- **Positioning**: Side-view orientation recommended for accurate measurements