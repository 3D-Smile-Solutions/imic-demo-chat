import React, { useEffect, useRef, useState } from 'react';
import heygenService from '../../services/heygenService';
import './AvatarDisplay.css';

const AvatarDisplay = ({ isVisible, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const animationFrameRef = useRef();

  useEffect(() => {
    if (!isVisible) return;

    const initializeAvatar = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Set the video element reference
        if (videoRef.current) {
          heygenService.setVideoElement(videoRef.current);
        }

        // Initialize avatar session
        await heygenService.initializeAvatar();
        
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize avatar:', err);
        setError(err.message || 'Failed to initialize avatar');
        if (onError) onError(err);
      } finally {
        setIsLoading(false);
      }
    };

    // Setup event listeners
    const handleStreamReady = () => {
      setIsReady(true);
      setIsLoading(false);
    };

    const handleStartTalking = () => {
      setIsSpeaking(true);
    };

    const handleStopTalking = () => {
      setIsSpeaking(false);
    };

    const handleError = (err) => {
      setError(err.message || 'Avatar error occurred');
      setIsLoading(false);
    };

    // Register event listeners
    heygenService.on('stream:ready', handleStreamReady);
    heygenService.on('avatar:start-talking', handleStartTalking);
    heygenService.on('avatar:stop-talking', handleStopTalking);
    heygenService.on('avatar:error', handleError);

    // Initialize only once per chat session
    let initializationStarted = false;
    if (!heygenService.isReady() && !initializationStarted) {
      initializationStarted = true;
      initializeAvatar();
    } else if (heygenService.isReady()) {
      setIsReady(true);
      setIsLoading(false);
      // Re-attach video element if stream exists
      if (videoRef.current) {
        heygenService.setVideoElement(videoRef.current);
      }
    }

    // Cleanup
    return () => {
      heygenService.off('stream:ready', handleStreamReady);
      heygenService.off('avatar:start-talking', handleStartTalking);
      heygenService.off('avatar:stop-talking', handleStopTalking);
      heygenService.off('avatar:error', handleError);
    };
  }, [isVisible, onError]);

  // Green screen removal processing
  useEffect(() => {
    if (!isReady || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Set canvas size to match video
    const setupCanvas = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };

    // Process frame to remove green screen
    const processFrame = () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Process pixels to remove green - simple and effective
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Simple green screen detection that works
          const isGreen = g > 90 && r < 90 && b < 90;
          
          if (isGreen) {
            data[i + 3] = 0; // Set alpha to transparent
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    // Start processing when video is ready
    if (video.readyState >= 2) {
      setupCanvas();
      processFrame();
    } else {
      video.addEventListener('loadedmetadata', () => {
        setupCanvas();
        processFrame();
      });
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop avatar when component unmounts
      if (heygenService.isReady()) {
        heygenService.stopAvatar();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="avatar-display-container">
      {/* Loading state */}
      {isLoading && (
        <div className="avatar-loading">
          <div className="avatar-spinner"></div>
          <p>Initializing avatar...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="avatar-error">
          <p>⚠️ Avatar unavailable</p>
          <small>{error}</small>
        </div>
      )}

      {/* Video element - always hidden since we use canvas */}
      <video
        ref={videoRef}
        className={`avatar-video ${isReady ? 'ready' : ''} ${isSpeaking ? 'speaking' : ''}`}
        autoPlay
        playsInline
        muted={false}
        onLoadedMetadata={() => console.log('Video metadata loaded')}
        onPlay={() => console.log('Video started playing')}
        onError={(e) => console.error('Video error:', e)}
        style={{ display: 'none' }}
      />
      
      {/* Canvas for green screen removal - always shown when ready */}
      <canvas
        ref={canvasRef}
        className={`avatar-video ${isReady ? 'ready' : ''} ${isSpeaking ? 'speaking' : ''}`}
        style={{ display: isReady && !error ? 'block' : 'none' }}
      />

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="avatar-speaking-indicator">
          <span className="speaking-dot"></span>
          <span className="speaking-dot"></span>
          <span className="speaking-dot"></span>
        </div>
      )}

      {/* Avatar status for debugging (can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="avatar-debug">
          Status: {isLoading ? 'Loading' : isReady ? 'Ready' : 'Not ready'} 
          {isSpeaking && ' | Speaking'}
        </div>
      )}
    </div>
  );
};

export default AvatarDisplay;