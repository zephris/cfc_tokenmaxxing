import { AlertCircle, Camera, ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const ACCEPTED_TYPES_LABEL = "JPEG or PNG";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface WeedCaptureProps {
  /** Called with the validated file when the user submits it for identification. */
  onSubmit: (file: File) => void;
  /** Disables the form and shows a pending indicator while a request is in flight. */
  isSubmitting?: boolean;
  /** Server/network error from the last submission attempt, if any. */
  submitError?: string | null;
  className?: string;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `Please choose a ${ACCEPTED_TYPES_LABEL} image.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "That image is larger than 10MB. Please choose a smaller photo.";
  }
  return null;
}

export function WeedCapture({
  onSubmit,
  isSubmitting = false,
  submitError = null,
  className,
}: WeedCaptureProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showCameraPermissionPrompt, setShowCameraPermissionPrompt] =
    useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  // Revoke the object URL whenever it changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const clearInputs = () => {
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (libraryInputRef.current) libraryInputRef.current.value = "";
  };

  const handleRemove = () => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setSelectedFile(null);
    setValidationError(null);
    clearInputs();
  };

  const handleSubmit = () => {
    if (!selectedFile || isSubmitting) return;
    onSubmit(selectedFile);
  };

  const openCameraPrompt = () => {
    setShowCameraPermissionPrompt(true);
  };

  const displayedError = validationError ?? submitError;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Photograph the suspected weed
        </h2>
        <p className="text-sm text-muted-foreground">
          Take a clear, well-lit photo of the leaves, flowers or overall shape.{" "}
          {ACCEPTED_TYPES_LABEL}, up to 10MB.
        </p>
      </div>

      {/* Hidden native inputs, triggered by the visible buttons below so we
          control the layout while keeping full keyboard/native semantics. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {previewUrl ? (
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-md border border-input bg-muted">
            {/* Local blob preview — next/image requires a known remote
                loader/domain and adds no value for an object URL. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview of the selected weed photo"
              className="max-h-80 w-full object-contain"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => libraryInputRef.current?.click()}
              disabled={isSubmitting}
            >
              Replace photo
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleRemove}
              disabled={isSubmitting}
              aria-label="Remove selected photo"
            >
              <X className="mr-1 h-4 w-4" aria-hidden="true" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input p-6 text-center">
          <p className="text-sm text-muted-foreground">No photo selected yet</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              onClick={openCameraPrompt}
              aria-label="Take a photo using your camera"
            >
              <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
              Take Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => libraryInputRef.current?.click()}
              aria-label="Choose an existing photo from your device"
            >
              <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Choose Image
            </Button>
          </div>
          {showCameraPermissionPrompt ? (
            <div
              aria-live="polite"
              className="mt-2 rounded-md border border-input bg-background p-4 text-left"
            >
              <p className="text-sm font-medium text-foreground">
                Allow camera access?
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                We need your permission before opening the camera. You can
                choose an existing image instead.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setShowCameraPermissionPrompt(false);
                    cameraInputRef.current?.click();
                  }}
                >
                  Continue
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCameraPermissionPrompt(false)}
                >
                  Not now
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {displayedError && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{displayedError}</span>
        </p>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedFile || isSubmitting}
        aria-describedby={displayedError ? errorId : undefined}
        aria-busy={isSubmitting}
        className="self-start"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Identifying…
          </>
        ) : (
          "Identify weed"
        )}
      </Button>
    </div>
  );
}
