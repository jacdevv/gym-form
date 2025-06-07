import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import { Play, Pause, Camera, Upload } from "lucide-react";

interface SquatDashboardProps {
  className?: string;
}

export const SquatDashboard: React.FC<SquatDashboardProps> = ({
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isVideoUploaded, setIsVideoUploaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { pose, isInitialized, squatState, currentMetrics, processFrame } =
    usePoseDetection();

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsWebcamActive(true);
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsWebcamActive(false);
    }
  };

  const stopVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && videoRef.current) {
      // Stop webcam if active
      if (isWebcamActive) {
        stopWebcam();
      }

      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.srcObject = null; // Clear any webcam stream
      videoRef.current.load();
      setIsVideoUploaded(true);
      setIsVideoPlaying(false);
    }
  };

  const toggleVideoPlayback = () => {
    if (videoRef.current && isVideoUploaded) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
    }
  };

  const processVideoFrame = async () => {
    if (videoRef.current && canvasRef.current && isInitialized) {
      await processFrame(videoRef.current, canvasRef.current);
    }

    if (isWebcamActive || (isVideoUploaded && isVideoPlaying)) {
      requestAnimationFrame(processVideoFrame);
    }
  };

  useEffect(() => {
    if (
      (isWebcamActive || (isVideoUploaded && isVideoPlaying)) &&
      isInitialized
    ) {
      processVideoFrame();
    }
  }, [isWebcamActive, isVideoPlaying, isInitialized]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoPlay = () => setIsVideoPlaying(true);
    const handleVideoPause = () => setIsVideoPlaying(false);
    const handleVideoEnded = () => setIsVideoPlaying(false);

    video.addEventListener("play", handleVideoPlay);
    video.addEventListener("pause", handleVideoPause);
    video.addEventListener("ended", handleVideoEnded);

    return () => {
      video.removeEventListener("play", handleVideoPlay);
      video.removeEventListener("pause", handleVideoPause);
      video.removeEventListener("ended", handleVideoEnded);
    };
  }, [isVideoUploaded]);

  const getKneeAngleFeedback = (angle: number) => {
    if (angle === 0) return { text: "No data", variant: "secondary" as const };
    if (angle >= 170)
      return { text: "Standing position", variant: "default" as const };
    if (angle > 135)
      return { text: "Shallow squat", variant: "secondary" as const };
    if (angle >= 110)
      return { text: "Perfect depth!", variant: "default" as const };
    if (angle >= 90) return { text: "Good depth", variant: "default" as const };
    if (angle >= 70)
      return { text: "Parallel squat", variant: "secondary" as const };
    return { text: "Very deep squat", variant: "destructive" as const };
  };

  const getTorsoAngleFeedback = (angle: number) => {
    if (angle === 0) return { text: "No data", variant: "secondary" as const };
    if (angle >= 30 && angle <= 45)
      return { text: "Good torso angle", variant: "default" as const };
    if (angle < 30)
      return { text: "Too upright", variant: "secondary" as const };
    if (angle <= 60)
      return { text: "Slight forward lean", variant: "secondary" as const };
    return { text: "Too much forward lean", variant: "destructive" as const };
  };

  const kneeAngleFeedback = getKneeAngleFeedback(currentMetrics.kneeAngle);
  const torsoAngleFeedback = getTorsoAngleFeedback(currentMetrics.torsoAngle);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Video Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Squat Analysis
            <div className="flex gap-2">
              <Button
                onClick={isWebcamActive ? stopWebcam : startWebcam}
                variant={isWebcamActive ? "destructive" : "default"}
                size="sm"
                disabled={isVideoUploaded}
              >
                {isWebcamActive ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {isWebcamActive ? "Stop" : "Start"} Webcam
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                disabled={isWebcamActive}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
              {isVideoUploaded && (
                <Button
                  onClick={toggleVideoPlayback}
                  variant={isVideoPlaying ? "destructive" : "default"}
                  size="sm"
                >
                  {isVideoPlaying ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isVideoPlaying ? "Pause" : "Play"}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-auto"
              style={{ maxHeight: "400px" }}
              muted
              playsInline
              controls={isVideoUploaded}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rep Counter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rep Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{squatState.repCount}</div>
            <Badge
              variant={squatState.inSquat ? "default" : "secondary"}
              className="mt-2"
            >
              {squatState.inSquat ? "In Squat" : "Standing"}
            </Badge>
          </CardContent>
        </Card>

        {/* Knee Angle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Knee Angle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMetrics.kneeAngle.toFixed(1)}°
            </div>
            <Badge variant={kneeAngleFeedback.variant} className="mt-2">
              {kneeAngleFeedback.text}
            </Badge>
          </CardContent>
        </Card>

        {/* Torso Angle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Torso Angle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMetrics.torsoAngle.toFixed(1)}°
            </div>
            <Badge variant={torsoAngleFeedback.variant} className="mt-2">
              {torsoAngleFeedback.text}
            </Badge>
          </CardContent>
        </Card>

        {/* Depth Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Depth Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {currentMetrics.depthStatus}
            </div>
            <Badge
              variant={
                currentMetrics.depthStatus === "Below Parallel"
                  ? "default"
                  : "secondary"
              }
              className="mt-2"
            >
              {currentMetrics.depthStatus === "Below Parallel"
                ? "Good Depth"
                : "Shallow"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Rep Feedback */}
      {squatState.repFeedbacks.length > 0 && (
        <div className="space-y-3">
          {squatState.repFeedbacks.map((repFeedback) => (
            <Card
              key={repFeedback.repNumber}
              className="border-yellow-200 bg-yellow-50"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-800">
                  Rep {repFeedback.repNumber} Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700">{repFeedback.feedback}</p>
                <div className="mt-2 text-sm text-yellow-600">
                  Deepest: Knee {repFeedback.deepestKneeAngle.toFixed(1)}° |
                  Torso {repFeedback.deepestTorsoAngle.toFixed(1)}°
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="space-y-1">
            <li>• Position yourself sideways to the camera</li>
            <li>• Ensure your full body is visible in the frame</li>
            <li>• Perform squats with controlled movement</li>
            <li>• Aim for knee angles between 110-135° for optimal depth</li>
            <li>• Maintain torso angle between 30-45° for good form</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
