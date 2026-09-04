import { useState } from "react";

import {
  WeedCameraCapture,
  WeedPrediction,
} from "@/components/weed-camera-capture";
import { useUploadWeedImage, WeedCandidate } from "@/hooks/weeds";
import { cn } from "@/lib/utils";

// Maps the raw /api/weeds/identify/ shape onto WeedCameraCapture's display props.
function toPrediction(candidate: WeedCandidate): WeedPrediction {
  return {
    commonName: candidate.common_name,
    scientificName: candidate.scientific_name,
    confidencePercent: Math.round(candidate.confidence * 100),
  };
}

export default function IdentifyPage() {
  const [error, setError] = useState<string | null>(null);
  const { mutate, data, isPending } = useUploadWeedImage({
    onError: () => setError("Couldn't identify that photo. Try again."),
    onSuccess: () => setError(null),
  });

  const handleCapture = (file: File) => {
    setError(null);
    mutate(file);
  };

  const topCandidate = data?.candidates[0];

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-5">
      <div className="flex flex-col gap-[2px]">
        <h1 className="text-[22px] font-bold text-foreground">
          Identify a weed
        </h1>
        <p className="text-[11px] text-muted-foreground">AI field assistant</p>
      </div>

      <WeedCameraCapture
        onCapture={handleCapture}
        prediction={topCandidate ? toPrediction(topCandidate) : undefined}
      />

      {isPending && (
        <p className="text-sm text-muted-foreground">Identifying…</p>
      )}
      {error && <p className={cn("text-sm text-destructive")}>{error}</p>}

      {data && data.candidates.length > 1 && (
        <ul className="flex flex-col gap-2">
          {data.candidates.slice(1).map((candidate, i) => (
            <li
              key={`${candidate.scientific_name}-${i}`}
              className="rounded-[14px] border border-border bg-white p-3 text-sm"
            >
              {candidate.common_name} · {Math.round(candidate.confidence * 100)}
              % ·{" "}
              <span className="italic text-muted-foreground">
                {candidate.scientific_name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
