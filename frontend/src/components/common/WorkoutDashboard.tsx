import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePoseDetection } from "@/hooks/common/usePoseDetection";
import { useVideoControl } from "@/hooks/common/useVideoControl";
import { WorkoutAnalyzer, WorkoutConfig } from "@/types/workouts";
import { Play, Pause, Camera, Upload } from "lucide-react";

interface WorkoutDashboardProps {
  workoutType: string;
  analyzer: WorkoutAnalyzer;
  config: WorkoutConfig;
  className?: string;
}

export const WorkoutDashboard: React.FC<WorkoutDashboardProps> = ({
  workoutType,
  analyzer,
  config,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    videoRef,
    fileInputRef,
    state: videoState,
    startWebcam,
    stopWebcam,
    handleVideoUpload,
    toggleVideoPlayback,
  } = useVideoControl();

  const { isInitialized, workoutState, currentMetrics, processFrame } =
    usePoseDetection(analyzer);

  const processVideoFrame = async () => {
    if (videoRef.current && canvasRef.current && isInitialized) {
      await processFrame(videoRef.current, canvasRef.current);
    }

    if (videoState.isWebcamActive || (videoState.isVideoUploaded && videoState.isVideoPlaying)) {
      requestAnimationFrame(processVideoFrame);
    }
  };

  useEffect(() => {
    if (
      (videoState.isWebcamActive || (videoState.isVideoUploaded && videoState.isVideoPlaying)) &&
      isInitialized
    ) {
      processVideoFrame();
    }
  }, [videoState.isWebcamActive, videoState.isVideoPlaying, isInitialized]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoPlay = () => {};
    const handleVideoPause = () => {};
    const handleVideoEnded = () => {};

    video.addEventListener("play", handleVideoPlay);
    video.addEventListener("pause", handleVideoPause);
    video.addEventListener("ended", handleVideoEnded);

    return () => {
      video.removeEventListener("play", handleVideoPlay);
      video.removeEventListener("pause", handleVideoPause);
      video.removeEventListener("ended", handleVideoEnded);
    };
  }, [videoState.isVideoUploaded]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Video Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {config.displayName} Analysis
            <div className="flex gap-2">
              <Button
                onClick={videoState.isWebcamActive ? stopWebcam : startWebcam}
                variant={videoState.isWebcamActive ? "destructive" : "default"}
                size="sm"
                disabled={videoState.isVideoUploaded}
              >
                {videoState.isWebcamActive ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {videoState.isWebcamActive ? "Stop" : "Start"} Webcam
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                disabled={videoState.isWebcamActive}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
              {videoState.isVideoUploaded && (
                <Button
                  onClick={toggleVideoPlayback}
                  variant={videoState.isVideoPlaying ? "destructive" : "default"}
                  size="sm"
                >
                  {videoState.isVideoPlaying ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {videoState.isVideoPlaying ? "Pause" : "Play"}
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
              controls={videoState.isVideoUploaded}
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
            <div className="text-2xl font-bold">{workoutState.repCount}</div>
            <Badge
              variant={workoutState.inExercise ? "default" : "secondary"}
              className="mt-2"
            >
              {workoutState.inExercise ? `In ${config.displayName}` : "Standing"}
            </Badge>
          </CardContent>
        </Card>

        {/* Dynamic Metrics Cards */}
        {config.metrics.map((metricConfig) => {
          const value = currentMetrics[metricConfig.name];
          const feedback = analyzer.getMetricFeedback(metricConfig.name, value);
          
          return (
            <Card key={metricConfig.name}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {metricConfig.displayName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {typeof value === 'number' 
                    ? `${value.toFixed(1)}${metricConfig.unit}`
                    : value || 'N/A'
                  }
                </div>
                <Badge variant={feedback.variant} className="mt-2">
                  {feedback.text}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rep Feedback */}
      {workoutState.repFeedbacks.length > 0 && (
        <div className="space-y-3">
          {workoutState.repFeedbacks.map((repFeedback) => (
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
                  {Object.entries(repFeedback.metrics).map(([key, value]) => (
                    <span key={key} className="mr-4">
                      {key}: {typeof value === 'number' ? value.toFixed(1) : value}
                    </span>
                  ))}
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
            {config.instructions.map((instruction, index) => (
              <li key={index}>• {instruction}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};