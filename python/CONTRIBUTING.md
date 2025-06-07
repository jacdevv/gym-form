# Contributing to Gym Form Analysis Python Backend

Thank you for your interest in contributing to the Gym Form Analysis Python backend! This guide will help you get started with development.

## Development Setup

### Prerequisites

- Python 3.11 (required for MediaPipe compatibility)
- `uv` package manager (recommended) or `pip`
- Webcam or test video files for testing

### Environment Setup

1. **Clone the repository and navigate to the Python directory:**
   ```bash
   cd gym-form/python
   ```

2. **Create Python 3.11 virtual environment:**
   ```bash
   uv venv --python python3.11 venv311
   source venv311/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   uv pip install -r requirements.txt
   ```

4. **Verify installation:**
   ```bash
   python3.11 squat_dashboard.py
   ```

## Project Architecture

### Core Components

- **`squat_dashboard.py`**: Main MediaPipe-based application with automatic pose detection
- **`squat_dashboard_opencv.py`**: Alternative manual point selection implementation
- **`requirements.txt`**: Python dependencies with pinned versions
- **`videos/`**: Test video files for development and validation

### Key Classes and Methods

#### SquatDashboard Class (squat_dashboard.py)

**Core Methods:**
- `calculate_angle(point1, point2, point3)`: Three-point angle calculation
- `process_frame(image)`: Main processing pipeline
- `update_rep_count(knee_angle, torso_angle)`: Rep counting logic
- `generate_rep_feedback()`: Post-rep form analysis
- `draw_metrics(image, ...)`: Overlay rendering

**Form Analysis:**
- `get_knee_feedback(knee_angle)`: Depth assessment
- `get_torso_feedback(torso_angle)`: Posture analysis
- `get_overall_feedback(knee_angle, torso_angle)`: Combined assessment

## Development Guidelines

### Code Style

- Follow PEP 8 conventions
- Use descriptive variable names
- Add docstrings to all public methods
- Keep methods focused and under 50 lines when possible

### MediaPipe Integration

When working with MediaPipe pose detection:

```python
# Standard MediaPipe setup
self.mp_pose = mp.solutions.pose
self.pose = self.mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    enable_segmentation=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Use right-side landmarks for side-view analysis
shoulder = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
hip = landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP]
knee = landmarks[self.mp_pose.PoseLandmark.RIGHT_KNEE]
ankle = landmarks[self.mp_pose.PoseLandmark.RIGHT_ANKLE]
```

### Angle Calculation Standards

All angle calculations should use the established three-point method:

```python
def calculate_angle(self, point1, point2, point3):
    """Calculate angle between three points using arctangent"""
    a = np.array([point1.x, point1.y])
    b = np.array([point2.x, point2.y])  # Vertex point
    c = np.array([point3.x, point3.y])
    
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
        
    return angle
```

### Form Feedback System

When adding new feedback mechanisms:

1. **Track metrics during rep**: Store values in `self.current_rep_metrics`
2. **Identify deepest position**: Update `self.deepest_knee_angle` and `self.deepest_torso_angle`
3. **Generate targeted feedback**: Use ranges to provide specific recommendations
4. **Time-limited display**: Use `self.feedback_timer` for temporary feedback overlay

## Testing

### Manual Testing

1. **Webcam Testing:**
   ```bash
   python3.11 squat_dashboard.py
   # Choose option 1 for webcam
   ```

2. **Video File Testing:**
   ```bash
   python3.11 squat_dashboard.py
   # Choose option 2 or 3 for test videos
   ```

3. **Alternative Implementation:**
   ```bash
   python3.11 squat_dashboard_opencv.py
   ```

### Test Cases to Verify

- **Angle calculations**: Verify knee and torso angles are reasonable (90-180° range)
- **Rep counting**: Ensure transitions from standing to squat and back trigger counts
- **Depth detection**: Confirm parallel detection works correctly
- **Feedback system**: Check that post-rep feedback appears and disappears appropriately
- **Video looping**: Verify test videos loop correctly for continuous testing

## Adding New Features

### New Workout Types

To add support for additional exercises:

1. **Create new analyzer class** following the `SquatDashboard` pattern
2. **Define relevant landmarks** for the exercise
3. **Implement exercise-specific angle calculations**
4. **Add appropriate feedback ranges**
5. **Update main menu** to include new option

### New Metrics

To add new measurement capabilities:

1. **Identify required landmarks** for the metric
2. **Implement calculation method** following existing patterns
3. **Add feedback ranges** and color coding
4. **Update overlay rendering** in `draw_metrics()`
5. **Include in rep tracking** if relevant for form assessment

### Performance Optimizations

When optimizing performance:

- **Profile frame processing time** using `time.time()`
- **Consider reducing MediaPipe model complexity** for faster processing
- **Optimize overlay rendering** by reducing drawing operations
- **Test on various hardware** to ensure broad compatibility

## Common Issues and Solutions

### MediaPipe Installation Problems

If MediaPipe fails to install:
```bash
# Ensure Python 3.11 is being used
python --version

# Clear pip cache and reinstall
pip cache purge
pip install --no-cache-dir mediapipe==0.10.8
```

### Camera Access Issues

For camera permission problems:
- Check system camera permissions
- Try different camera indices (0, 1, 2)
- Ensure no other applications are using the camera

### Performance Issues

For slow processing:
- Reduce MediaPipe model complexity to 0
- Lower detection/tracking confidence thresholds
- Reduce overlay drawing complexity

## Submitting Changes

1. **Test thoroughly** with both webcam and video files
2. **Verify angle calculations** produce reasonable values
3. **Check rep counting** works correctly across multiple repetitions
4. **Ensure feedback system** provides helpful guidance
5. **Update documentation** if adding new features

## Questions and Support

For development questions:
1. Check existing code comments and docstrings
2. Review `CLAUDE.md` for technical implementation details
3. Test with provided video files to isolate issues
4. Consider creating minimal test cases to reproduce problems

## Dependencies Management

When updating dependencies:

1. **Test compatibility** with Python 3.11
2. **Verify MediaPipe functionality** after updates
3. **Update version pins** in `requirements.txt`
4. **Document any breaking changes** in commit messages

Current pinned versions are tested and known to work together. Exercise caution when upgrading, especially MediaPipe which has frequent API changes.