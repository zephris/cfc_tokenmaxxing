import { useState } from "react";

import { Button } from "@/components/ui/button";

interface WeedPermissionRequestProps {
  onGrantCamera: () => void;
  onGrantGallery: () => void;
}

// Pre-permission explainer shown before the browser permission prompts.
export function WeedPermissionRequest({
  onGrantCamera,
  onGrantGallery,
}: WeedPermissionRequestProps) {
  const [denied, setDenied] = useState<string | null>(null);

  const requestCamera = async () => {
    setDenied(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setDenied("Camera is not supported on this device.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      stream.getTracks().forEach((t) => t.stop());
      onGrantCamera();
    } catch {
      setDenied(
        "Camera access was denied. Enable it in your browser settings to take photos.",
      );
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border p-6 text-center">
      <h2 className="text-lg font-semibold">Allow camera and gallery access</h2>
      <p className="text-sm text-muted-foreground">
        We need access to identify weeds from your photos. Your images are only
        used for identification.
      </p>
      <div className="flex gap-2">
        <Button type="button" onClick={requestCamera}>
          Allow camera
        </Button>
        <Button type="button" variant="outline" onClick={onGrantGallery}>
          Choose from gallery
        </Button>
      </div>
      {denied && <p className="text-sm text-destructive">{denied}</p>}
    </div>
  );
}
