import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export interface WeedPrediction {
  commonName: string;
  scientificName: string;
  confidencePercent: number;
}

interface WeedCameraCaptureProps {
  onCapture: (file: File) => void;
  prediction?: WeedPrediction;
}

type CameraStatus =
  "checking" | "ready" | "denied" | "unavailable" | "unsupported";

function confidenceLabel(percent: number) {
  if (percent >= 80) return "High";
  if (percent >= 50) return "Moderate";
  if (percent >= 30) return "Low";
  return "Unreliable";
}

// Mirrors the Figma "Identify weed" screen (node 2:866): live camera preview
// with focus guide, an optional model status row, and Upload Image / Done actions.
export function WeedCameraCapture({
  onCapture,
  prediction,
}: WeedCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("checking");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Camera access needs an explicit browser permission grant; file upload does not.
  const requestCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    setStatus("checking");
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
      setStatus("ready");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setStatus("unavailable");
      } else {
        setStatus("denied");
      }
    }
  }, []);

  useEffect(() => {
    requestCamera();
    return stop;
  }, [requestCamera, stop]);

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
        onCapture(new File([blob], "weed-capture.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
    e.target.value = "";
  };

  const permissionMessage =
    status === "denied"
      ? "Camera access is blocked. Allow camera permission for this site in your browser settings, or upload a photo instead."
      : status === "unavailable"
        ? "No camera was detected on this device. Upload a photo instead."
        : status === "unsupported"
          ? "Camera capture isn't supported in this browser. Upload a photo instead."
          : null;

  return (
    <div className="flex w-full flex-col gap-[18px]">
      <div className="relative flex h-[370px] w-full flex-col justify-between overflow-hidden rounded-[22px] bg-black p-4 shadow-[0px_8px_24px_0px_rgba(23,59,44,0.08)]">
        <video
          ref={videoRef}
          playsInline
          muted
          className={
            status === "ready"
              ? "absolute inset-0 h-full w-full object-cover"
              : "hidden"
          }
        />
        <canvas ref={canvasRef} className="hidden" />

        {status !== "ready" ? (
          <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-white">
              {permissionMessage ?? "Requesting camera access…"}
            </p>
            {status !== "checking" && (
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-white text-white hover:bg-white/10"
                onClick={requestCamera}
              >
                Allow camera access
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="relative flex w-full items-start justify-between">
              <span className="rounded-full bg-accent px-[10px] py-[6px] text-[11px] font-bold text-accent-foreground">
                LIVE
              </span>
              <span
                className="flex size-9 items-center justify-center rounded-full bg-white/85"
                aria-hidden
              />
            </div>

            <div className="relative h-[190px] w-full shrink-0 rounded-[14px] border-2 border-white/80" />

            <div className="relative flex w-full items-center justify-center rounded-full bg-black/80 px-3 py-2">
              <p className="text-center text-[13px] text-white">
                Center the leaves and flowers in frame
              </p>
            </div>
          </>
        )}
      </div>

      {prediction && (
        <div className="flex w-full items-center gap-3 rounded-[14px] border border-border bg-white p-[14px]">
          <span
            className="flex size-[42px] shrink-0 items-center justify-center rounded-[14px] bg-accent text-lg text-accent-foreground"
            aria-hidden
          >
            ✦
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <p className="truncate text-[15px] font-bold text-foreground">
              {prediction.commonName}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {prediction.confidencePercent}% match ·{" "}
              {prediction.scientificName}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-accent px-[10px] py-[6px] text-[11px] font-bold text-accent-foreground">
            {confidenceLabel(prediction.confidencePercent)}
          </span>
        </div>
      )}

      <div className="flex w-full gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          className="h-[52px] flex-1 rounded-full border-primary text-primary"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Image
        </Button>
        <Button
          type="button"
          className="h-[52px] flex-1 rounded-full"
          disabled={status !== "ready"}
          onClick={capture}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
