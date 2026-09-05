import { CheckCircle2, Loader2, MapPin, MapPinOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BUSHLAND_FIXTURES, UNSURE_BUSHLAND_ID } from "@/lib/bushland-fixtures";
import { cn } from "@/lib/utils";

export type Abundance = "single" | "patch" | "widespread";

const ABUNDANCE_OPTIONS: { value: Abundance; label: string }[] = [
  { value: "single", label: "Single plant" },
  { value: "patch", label: "Small patch" },
  { value: "widespread", label: "Widespread" },
];

export interface ReportDetails {
  bushlandId: string;
  observationDate: string; // yyyy-mm-dd
  abundance: Abundance;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface ReportSightingFormProps {
  /** What's being reported, e.g. "Bridal Creeper (Asparagus asparagoides)" or "Unidentified plant". */
  subjectLabel: string;
  /** One line summarising AI confidence + human-verification status, e.g. "92% AI confidence (high) — species confirmed by you". */
  aiConfidenceLabel: string;
  /** Object URL for the captured photo, if available. */
  photoPreviewUrl: string | null;
  /** Pre-selects a bushland (e.g. arriving from a Bushland Profile's "Report a weed here"). */
  initialBushlandId?: string;
  onSubmit: (details: ReportDetails) => void;
  onBack: () => void;
  className?: string;
}

type LocationStatus =
  "idle" | "requesting" | "granted" | "denied" | "unavailable";

const NOTES_MAX_LENGTH = 500;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReportSightingForm({
  subjectLabel,
  aiConfidenceLabel,
  photoPreviewUrl,
  initialBushlandId,
  onSubmit,
  onBack,
  className,
}: ReportSightingFormProps) {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [bushlandId, setBushlandId] = useState<string>(
    initialBushlandId ?? BUSHLAND_FIXTURES[0]?.slug ?? UNSURE_BUSHLAND_ID,
  );
  const [observationDate, setObservationDate] = useState(todayIsoDate());
  const [abundance, setAbundance] = useState<Abundance>("single");
  const [notes, setNotes] = useState("");

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const handleSubmit = () => {
    onSubmit({
      bushlandId,
      observationDate,
      abundance,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      notes: notes.trim() ? notes.trim() : undefined,
    });
  };

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Report this sighting
        </h2>
        <p className="text-sm text-muted-foreground">
          Reporting as:{" "}
          <span className="font-medium text-foreground">{subjectLabel}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {aiConfidenceLabel}
        </p>
      </div>

      {photoPreviewUrl && (
        <div className="overflow-hidden rounded-md border border-input bg-muted">
          {/* Local blob preview of the captured photo. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoPreviewUrl}
            alt="The photo submitted for this sighting"
            className="max-h-56 w-full object-contain"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="report-bushland"
          className="text-sm font-medium text-foreground"
        >
          Bushland area
        </label>
        <select
          id="report-bushland"
          value={bushlandId}
          onChange={(event) => setBushlandId(event.target.value)}
          className="rounded-md border border-input bg-background p-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {BUSHLAND_FIXTURES.map((bushland) => (
            <option key={bushland.slug} value={bushland.slug}>
              {bushland.name} — {bushland.suburb}
            </option>
          ))}
          <option value={UNSURE_BUSHLAND_ID}>
            Not sure / outside listed area
          </option>
        </select>
        <p className="text-xs text-muted-foreground">
          Demo list of bushland areas — this will come from the interactive map
          once it&apos;s built (issues #5–#7).
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="report-date"
          className="text-sm font-medium text-foreground"
        >
          Date observed
        </label>
        <input
          id="report-date"
          type="date"
          value={observationDate}
          max={todayIsoDate()}
          onChange={(event) => setObservationDate(event.target.value)}
          className="w-fit rounded-md border border-input bg-background p-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          How much of it did you see?
        </legend>
        <div className="flex flex-wrap gap-2">
          {ABUNDANCE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                abundance === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground hover:border-primary/50",
              )}
            >
              <input
                type="radio"
                name="abundance"
                value={option.value}
                checked={abundance === option.value}
                onChange={() => setAbundance(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 rounded-md border border-input p-4">
        <p className="text-sm font-medium text-foreground">
          Location (optional)
        </p>
        <p className="text-xs text-muted-foreground">
          Helps place this sighting on the map for other bushcare volunteers.
          You can submit without it.
        </p>

        <div aria-live="polite">
          {locationStatus === "granted" && coords && (
            <p className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </p>
          )}
          {locationStatus === "denied" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinOff className="h-4 w-4" aria-hidden="true" />
              Location permission was denied — you can still submit without it.
            </p>
          )}
          {locationStatus === "unavailable" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinOff className="h-4 w-4" aria-hidden="true" />
              Location isn&apos;t available on this device or browser.
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={requestLocation}
          disabled={
            locationStatus === "requesting" || locationStatus === "granted"
          }
          className="self-start"
        >
          {locationStatus === "requesting" ? (
            <>
              <Loader2
                className="mr-2 h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
              Getting location…
            </>
          ) : locationStatus === "granted" ? (
            "Location added"
          ) : (
            "Use my location"
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="report-notes"
          className="text-sm font-medium text-foreground"
        >
          Notes (optional)
        </label>
        <textarea
          id="report-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={NOTES_MAX_LENGTH}
          rows={3}
          placeholder="E.g. nearby landmarks, access notes…"
          className="rounded-md border border-input bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-right text-xs text-muted-foreground">
          {notes.length}/{NOTES_MAX_LENGTH}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleSubmit}>
          <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Create demo report
        </Button>
        <Button type="button" variant="ghost" onClick={onBack}>
          Back to results
        </Button>
      </div>
    </div>
  );
}
