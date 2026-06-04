"use client";

import React, { useRef, useState, useEffect } from "react";
import { CameraIcon, XIcon, RefreshIcon } from "./Icons";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export default function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const startCamera = async () => {
    setLoading(true);
    setError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setLoading(false);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : "Could not access camera. Please check your connection or try another browser."
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const captureFrame = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw the current video frame onto the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Get base64 URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        onCapture(dataUrl);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl glass-panel border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <CameraIcon className="text-emerald-400" />
            <h2 className="text-lg font-semibold text-zinc-100">Camera Code Capture</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden scanline">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/90 z-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="text-xs text-zinc-500 font-mono">Initializing camera feed...</p>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/95 z-10 space-y-4">
              <div className="rounded-full bg-rose-950/20 border border-rose-900/30 p-3 text-rose-400">
                <XIcon size={24} />
              </div>
              <p className="text-sm text-rose-300 max-w-xs">{error}</p>
              <button
                onClick={startCamera}
                className="flex items-center gap-2 rounded-lg bg-zinc-850 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-100 transition-all"
              >
                <RefreshIcon size={12} /> Retry Camera
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover scale-x-[-1]" // mirror for convenience
            />
          )}

          {/* Guide Overlay for alignment */}
          {!loading && !error && (
            <div className="absolute inset-8 border border-dashed border-emerald-500/25 pointer-events-none rounded-lg flex items-center justify-center">
              <div className="text-[10px] text-emerald-400/40 uppercase tracking-widest font-mono select-none">
                Align code snippet here
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between bg-zinc-900/50 px-6 py-4 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-500 max-w-[200px] leading-relaxed">
            Hold steady. Ensure text is clear, legible, and well-lit.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg bg-zinc-850 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={captureFrame}
              disabled={loading || !!error}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-500 disabled:opacity-30 disabled:scale-100 active:scale-[0.98] transition-all"
            >
              <CameraIcon size={14} /> Capture Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
