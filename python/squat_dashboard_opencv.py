import cv2
import numpy as np
import math

class SquatDashboard:
    def __init__(self):
        self.tracking_points = {
            'shoulder': None,
            'hip': None,
            'knee': None,
            'ankle': None
        }
        self.setup_complete = False
        self.current_point = 'shoulder'
        self.point_order = ['shoulder', 'hip', 'knee', 'ankle']
        self.point_index = 0
        
    def mouse_callback(self, event, x, y, flags, param):
        """Handle mouse clicks for point selection"""
        if event == cv2.EVENT_LBUTTONDOWN and not self.setup_complete:
            current = self.point_order[self.point_index]
            self.tracking_points[current] = (x, y)
            print(f"Set {current} at ({x}, {y})")
            
            self.point_index += 1
            if self.point_index >= len(self.point_order):
                self.setup_complete = True
                print("Setup complete! Now tracking squat metrics.")
            else:
                self.current_point = self.point_order[self.point_index]
                print(f"Click to set {self.current_point}")
    
    def calculate_angle(self, point1, point2, point3):
        """Calculate angle between three points"""
        a = np.array(point1)
        b = np.array(point2)
        c = np.array(point3)
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
            
        return angle
    
    def get_depth_status(self, hip, knee):
        """Determine if squat is above or below parallel"""
        if hip[1] > knee[1]:  # y-coordinate comparison
            return "Below Parallel"
        else:
            return "Above Parallel"
    
    def draw_skeleton(self, image):
        """Draw skeleton lines between points"""
        if all(point is not None for point in self.tracking_points.values()):
            points = [
                self.tracking_points['shoulder'],
                self.tracking_points['hip'],
                self.tracking_points['knee'],
                self.tracking_points['ankle']
            ]
            
            # Draw lines connecting the points
            for i in range(len(points) - 1):
                cv2.line(image, points[i], points[i + 1], (0, 255, 0), 2)
            
            # Draw points
            for name, point in self.tracking_points.items():
                cv2.circle(image, point, 8, (255, 0, 0), -1)
                cv2.putText(image, name[:3].upper(), 
                           (point[0] + 10, point[1] - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    def draw_metrics(self, image, knee_angle, torso_angle, depth_status):
        """Draw metrics overlay on the image"""
        height, width = image.shape[:2]
        
        # Background rectangle for metrics
        cv2.rectangle(image, (10, 10), (400, 120), (0, 0, 0), -1)
        cv2.rectangle(image, (10, 10), (400, 120), (255, 255, 255), 2)
        
        # Metric 1: Knee Angle
        cv2.putText(image, f"Knee Angle: {knee_angle:.1f}°", 
                   (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        # Metric 2: Torso Angle
        cv2.putText(image, f"Torso Angle: {torso_angle:.1f}°", 
                   (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        
        # Metric 3: Depth Status
        color = (0, 255, 0) if depth_status == "Below Parallel" else (0, 0, 255)
        cv2.putText(image, f"Status: {depth_status}", 
                   (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        return image
    
    def draw_instructions(self, image):
        """Draw setup instructions"""
        if not self.setup_complete:
            instruction = f"Click to set {self.current_point.upper()}"
            cv2.putText(image, instruction, (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            
            # Show which points have been set
            y_offset = 60
            for i, point_name in enumerate(self.point_order):
                color = (0, 255, 0) if i < self.point_index else (0, 0, 255)
                status = "✓" if i < self.point_index else "○"
                cv2.putText(image, f"{status} {point_name.upper()}", 
                           (10, y_offset + i * 25), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
    
    def process_frame(self, image):
        """Process a single frame and return metrics"""
        knee_angle = 0
        torso_angle = 0
        depth_status = "Unknown"
        
        if self.setup_complete and all(point is not None for point in self.tracking_points.values()):
            # Calculate angles
            knee_angle = self.calculate_angle(
                self.tracking_points['hip'], 
                self.tracking_points['knee'], 
                self.tracking_points['ankle']
            )
            
            torso_angle = self.calculate_angle(
                self.tracking_points['shoulder'], 
                self.tracking_points['hip'], 
                self.tracking_points['knee']
            )
            
            # Determine depth status
            depth_status = self.get_depth_status(
                self.tracking_points['hip'], 
                self.tracking_points['knee']
            )
            
            # Draw skeleton
            self.draw_skeleton(image)
            
            # Draw metrics overlay
            image = self.draw_metrics(image, knee_angle, torso_angle, depth_status)
        else:
            # Draw setup instructions
            self.draw_instructions(image)
        
        return image, knee_angle, torso_angle, depth_status
    
    def run_webcam(self):
        """Run dashboard with webcam feed"""
        cap = cv2.VideoCapture(0)
        cv2.namedWindow('Squat Dashboard')
        cv2.setMouseCallback('Squat Dashboard', self.mouse_callback)
        
        print("Position yourself sideways to the camera")
        print("Click on: SHOULDER -> HIP -> KNEE -> ANKLE (in that order)")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            processed_frame, knee_angle, torso_angle, depth_status = self.process_frame(frame)
            
            cv2.imshow('Squat Dashboard', processed_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('r'):
                # Reset points
                self.tracking_points = {k: None for k in self.tracking_points}
                self.setup_complete = False
                self.point_index = 0
                self.current_point = 'shoulder'
                print("Reset! Click to set SHOULDER")
        
        cap.release()
        cv2.destroyAllWindows()
    
    def run_video(self, video_path):
        """Run dashboard with video file"""
        cap = cv2.VideoCapture(video_path)
        cv2.namedWindow('Squat Dashboard')
        cv2.setMouseCallback('Squat Dashboard', self.mouse_callback)
        
        print("Click on: SHOULDER -> HIP -> KNEE -> ANKLE (in that order)")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                # Loop the video
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            
            processed_frame, knee_angle, torso_angle, depth_status = self.process_frame(frame)
            
            cv2.imshow('Squat Dashboard', processed_frame)
            
            key = cv2.waitKey(100) & 0xFF  # Slower playback
            if key == ord('q'):
                break
            elif key == ord('r'):
                # Reset points
                self.tracking_points = {k: None for k in self.tracking_points}
                self.setup_complete = False
                self.point_index = 0
                self.current_point = 'shoulder'
                print("Reset! Click to set SHOULDER")
        
        cap.release()
        cv2.destroyAllWindows()

def main():
    dashboard = SquatDashboard()
    
    print("Squat Dashboard (OpenCV Version)")
    print("1. Use webcam")
    print("2. Test with deep_squat.mp4")
    print("3. Test with parallel_squat.mp4")
    
    choice = input("Enter choice (1-3): ")
    
    if choice == "1":
        print("Starting webcam... Press 'q' to quit, 'r' to reset points")
        dashboard.run_webcam()
    elif choice == "2":
        print("Playing deep_squat.mp4... Press 'q' to quit, 'r' to reset points")
        dashboard.run_video("videos/deep_squat.mp4")
    elif choice == "3":
        print("Playing parallel_squat.mp4... Press 'q' to quit, 'r' to reset points")
        dashboard.run_video("videos/parallel_squat.mp4")
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()