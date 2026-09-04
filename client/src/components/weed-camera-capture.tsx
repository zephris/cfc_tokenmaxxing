import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface WeedCameraCaptureProps {
  onCapture: (file: File) => void;
}

// Live rear-camera capture for the "Identify weed" step; emits a single File.
export function WeedCameraCapture({ onCapture }: WeedCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => stop, [stop]);

  const start = async () => {
    setError(null);
    setPreviewUrl(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not supported on this device.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch {
      setError("Could not access the camera. Check permissions and try again.");
    }
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "weed-capture.jpg", {
          type: "image/jpeg",
        });
        setPreviewUrl(URL.createObjectURL(file));
        onCapture(file);
        stop();
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {!active && (
        <Button type="button" onClick={start}>
          Open camera
        </Button>
      )}
      <video
        ref={videoRef}
        playsInline
        muted
        className={active ? "w-full rounded-md" : "hidden"}
      />
      <canvas ref={canvasRef} className="hidden" />
      {active && (
        <div className="flex gap-2">
          <Button type="button" onClick={capture}>
            Capture weed photo
          </Button>
          <Button type="button" variant="outline" onClick={stop}>
            Cancel
          </Button>
        </div>
      )}
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Captured weed"
          className="w-full rounded-md"
        />
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
