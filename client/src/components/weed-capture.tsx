import { useRef } from "react";

interface WeedCaptureProps {
  onSelect: (file: File) => void;
}

export function WeedCapture({ onSelect }: WeedCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = "";
  };

  return (
    <div className="flex gap-2">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button type="button" onClick={() => cameraRef.current?.click()}>
        Take photo
      </button>
      <button type="button" onClick={() => fileRef.current?.click()}>
        Upload image
      </button>
    </div>
  );
}
