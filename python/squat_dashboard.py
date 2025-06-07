import cv2
import mediapipe as mp
import numpy as np
import math

class SquatDashboard:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Rep counting state
        self.rep_count = 0
        self.in_squat = False
        self.squat_threshold = 140  # Knee angle threshold for counting a squat
        
        # Rep tracking for feedback
        self.current_rep_metrics = []
        self.deepest_knee_angle = 180
        self.deepest_torso_angle = 0
        self.last_rep_feedback = ""
        self.feedback_timer = 0
        self.feedback_duration = 180  # Show feedback for 3 seconds at 60fps
        
    def calculate_angle(self, point1, point2, point3):
        """Calculate angle between three points"""
        a = np.array([point1.x, point1.y])
        b = np.array([point2.x, point2.y])
        c = np.array([point3.x, point3.y])
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
            
        return angle
    
    def get_depth_status(self, hip, knee):
        """Determine if squat is above or below parallel"""
        if hip.y > knee.y:
            return "Below Parallel"
        else:
            return "Above Parallel"
    
    def get_knee_feedback(self, knee_angle):
        """Provide feedback on knee angle based on squat depth"""
        if knee_angle == 0:
            return "No data", (128, 128, 128)
        elif knee_angle >= 170:
            return "Standing position", (255, 255, 255)
        elif 135 < knee_angle < 170:
            return "Shallow squat", (0, 165, 255)
        elif 110 <= knee_angle <= 135:
            return "Perfect depth!", (0, 255, 0)
        elif 90 <= knee_angle < 110:
            return "Good depth", (0, 200, 0)
        elif 70 <= knee_angle < 90:
            return "Parallel squat", (255, 255, 0)
        else:
            return "Very deep squat", (255, 0, 255)
    
    def get_torso_feedback(self, torso_angle):
        """Provide feedback on torso angle"""
        if torso_angle == 0:
            return "No data", (128, 128, 128)
        elif 30 <= torso_angle <= 45:
            return "Good torso angle", (0, 255, 0)
        elif 20 <= torso_angle < 30:
            return "Too upright", (255, 165, 0)
        elif 45 < torso_angle <= 60:
            return "Slight forward lean", (255, 255, 0)
        elif torso_angle > 60:
            return "Too much forward lean", (0, 0, 255)
        else:
            return "Very upright", (255, 165, 0)
    
    def get_depth_feedback(self, knee_angle):
        """Provide feedback on squat depth category"""
        if knee_angle == 0:
            return "No data", (128, 128, 128)
        elif knee_angle > 135:
            return "Partial/Shallow", (255, 165, 0)
        elif 90 <= knee_angle <= 135:
            return "Parallel to Deep", (0, 255, 0)
        else:
            return "Very Deep", (0, 255, 255)
    
    def get_overall_feedback(self, knee_angle, torso_angle):
        """Provide overall form assessment"""
        if knee_angle == 0 or torso_angle == 0:
            return "Checking form..."
        
        knee_good = 110 <= knee_angle <= 135
        torso_good = 30 <= torso_angle <= 45
        
        if knee_good and torso_good:
            return "Excellent form!"
        elif knee_good or torso_good:
            return "Good form"
        else:
            return "Focus on form"
    
    def generate_rep_feedback(self):
        """Generate feedback for the completed rep based on deepest position"""
        feedback_lines = []
        
        # Analyze knee angle (depth)
        if self.deepest_knee_angle >= 170:
            feedback_lines.append("Too shallow - go deeper")
        elif 135 < self.deepest_knee_angle < 170:
            feedback_lines.append("Shallow squat - try for more depth")
        elif 110 <= self.deepest_knee_angle <= 135:
            feedback_lines.append("Perfect depth!")
        elif 90 <= self.deepest_knee_angle < 110:
            feedback_lines.append("Good depth")
        elif 70 <= self.deepest_knee_angle < 90:
            feedback_lines.append("Parallel depth achieved")
        else:
            feedback_lines.append("Very deep - be careful")
        
        # Analyze torso angle
        if 30 <= self.deepest_torso_angle <= 45:
            feedback_lines.append("Good torso position")
        elif self.deepest_torso_angle < 30:
            feedback_lines.append("Torso too upright")
        elif 45 < self.deepest_torso_angle <= 60:
            feedback_lines.append("Slight forward lean")
        else:
            feedback_lines.append("Too much forward lean")
        
        # Combine feedback
        self.last_rep_feedback = " | ".join(feedback_lines)
    
    def update_rep_count(self, knee_angle, torso_angle):
        """Update rep count based on knee angle transitions and track metrics"""
        if knee_angle > 0:  # Valid angle measurement
            if knee_angle < self.squat_threshold and not self.in_squat:
                # Entering squat position - start tracking this rep
                self.in_squat = True
                self.deepest_knee_angle = knee_angle
                self.deepest_torso_angle = torso_angle
                self.current_rep_metrics = []
            elif self.in_squat:
                # Currently in squat - track deepest angles
                if knee_angle < self.deepest_knee_angle:
                    self.deepest_knee_angle = knee_angle
                    self.deepest_torso_angle = torso_angle
                
                # Store current metrics
                self.current_rep_metrics.append({
                    'knee_angle': knee_angle,
                    'torso_angle': torso_angle
                })
                
                if knee_angle >= self.squat_threshold:
                    # Exiting squat position - count rep and generate feedback
                    self.in_squat = False
                    self.rep_count += 1
                    self.generate_rep_feedback()
                    self.feedback_timer = self.feedback_duration
    
    def draw_metrics(self, image, knee_angle, torso_angle, depth_status):
        """Draw metrics overlay on the image"""
        height, width, _ = image.shape
        
        # Update feedback timer
        if self.feedback_timer > 0:
            self.feedback_timer -= 1
        
        # Background rectangle for metrics
        cv2.rectangle(image, (10, 10), (400, 160), (0, 0, 0), -1)
        cv2.rectangle(image, (10, 10), (400, 160), (255, 255, 255), 2)
        
        # Current metrics display
        cv2.putText(image, f"Knee Angle: {knee_angle:.1f}°", 
                   (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        cv2.putText(image, f"Torso Angle: {torso_angle:.1f}°", 
                   (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Depth Status
        color = (0, 255, 0) if depth_status == "Below Parallel" else (0, 0, 255)
        cv2.putText(image, f"Status: {depth_status}", 
                   (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        # Rep Count
        cv2.putText(image, f"Reps: {self.rep_count}", 
                   (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
        
        # Squat status
        status_text = "In squat" if self.in_squat else "Standing"
        status_color = (255, 165, 0) if self.in_squat else (255, 255, 255)
        cv2.putText(image, status_text, 
                   (20, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.5, status_color, 1)
        
        # Post-rep feedback (shown for limited time after each rep)
        if self.feedback_timer > 0 and self.last_rep_feedback:
            # Feedback background
            cv2.rectangle(image, (10, 170), (600, 250), (0, 0, 100), -1)
            cv2.rectangle(image, (10, 170), (600, 250), (255, 255, 255), 2)
            
            cv2.putText(image, f"Rep {self.rep_count} Feedback:", 
                       (20, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            cv2.putText(image, self.last_rep_feedback, 
                       (20, 215), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            cv2.putText(image, f"Deepest: Knee {self.deepest_knee_angle:.1f}° | Torso {self.deepest_torso_angle:.1f}°", 
                       (20, 235), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
        
        return image
    
    def process_frame(self, image):
        """Process a single frame and return metrics"""
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.pose.process(image_rgb)
        
        knee_angle = 0
        torso_angle = 0
        depth_status = "Unknown"
        
        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            
            # Get key landmarks (using right side landmarks for side view)
            shoulder = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            hip = landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP]
            knee = landmarks[self.mp_pose.PoseLandmark.RIGHT_KNEE]
            ankle = landmarks[self.mp_pose.PoseLandmark.RIGHT_ANKLE]
            
            # Calculate angles
            knee_angle = self.calculate_angle(hip, knee, ankle)
            torso_angle = self.calculate_angle(shoulder, hip, knee)
            
            # Determine depth status
            depth_status = self.get_depth_status(hip, knee)
            
            # Update rep count
            self.update_rep_count(knee_angle, torso_angle)
            
            # Draw pose landmarks
            self.mp_drawing.draw_landmarks(
                image, results.pose_landmarks, self.mp_pose.POSE_CONNECTIONS)
        
        # Draw metrics overlay
        image = self.draw_metrics(image, knee_angle, torso_angle, depth_status)
        
        return image, knee_angle, torso_angle, depth_status
    
    def run_webcam(self):
        """Run dashboard with webcam feed"""
        cap = cv2.VideoCapture(0)
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            processed_frame, knee_angle, torso_angle, depth_status = self.process_frame(frame)
            
            cv2.imshow('Squat Dashboard', processed_frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
    
    def run_video(self, video_path):
        """Run dashboard with video file"""
        cap = cv2.VideoCapture(video_path)
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            processed_frame, knee_angle, torso_angle, depth_status = self.process_frame(frame)
            
            cv2.imshow('Squat Dashboard', processed_frame)
            
            # Slower playback for analysis
            if cv2.waitKey(50) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()

def main():
    dashboard = SquatDashboard()
    
    print("Squat Dashboard with Rep Counting")
    print("1. Use webcam")
    print("2. Test with deep_squat.mp4")
    print("3. Test with parallel_squat.mp4")
    
    choice = input("Enter choice (1-3): ")
    
    if choice == "1":
        print("Starting webcam... Press 'q' to quit")
        dashboard.run_webcam()
    elif choice == "2":
        print("Playing deep_squat.mp4... Press 'q' to quit")
        dashboard.run_video("videos/deep_squat.mp4")
    elif choice == "3":
        print("Playing parallel_squat.mp4... Press 'q' to quit")
        dashboard.run_video("videos/parallel_squat.mp4")
    else:
        print("Invalid choice")
    
    print(f"Final rep count: {dashboard.rep_count}")

if __name__ == "__main__":
    main()