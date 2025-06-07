import { useState, useRef, useCallback } from 'react';

export interface VideoControlState {
  isWebcamActive: boolean;
  isVideoUploaded: boolean;
  isVideoPlaying: boolean;
}

export const useVideoControl = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<VideoControlState>({
    isWebcamActive: false,
    isVideoUploaded: false,
    isVideoPlaying: false,
  });

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setState(prev => ({ ...prev, isWebcamActive: true }));
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setState(prev => ({ ...prev, isWebcamActive: false }));
    }
  }, []);

  const handleVideoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && videoRef.current) {
      // Stop webcam if active
      if (state.isWebcamActive) {
        stopWebcam();
      }

      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.srcObject = null;
      videoRef.current.load();
      setState(prev => ({ 
        ...prev, 
        isVideoUploaded: true, 
        isVideoPlaying: false 
      }));
    }
  }, [state.isWebcamActive, stopWebcam]);

  const toggleVideoPlayback = useCallback(() => {
    if (videoRef.current && state.isVideoUploaded) {
      if (state.isVideoPlaying) {
        videoRef.current.pause();
        setState(prev => ({ ...prev, isVideoPlaying: false }));
      } else {
        videoRef.current.play();
        setState(prev => ({ ...prev, isVideoPlaying: true }));
      }
    }
  }, [state.isVideoUploaded, state.isVideoPlaying]);

  const stopVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setState(prev => ({ ...prev, isVideoPlaying: false }));
    }
  }, []);

  return {
    videoRef,
    fileInputRef,
    state,
    startWebcam,
    stopWebcam,
    handleVideoUpload,
    toggleVideoPlayback,
    stopVideo,
  };
};