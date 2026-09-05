import { CheckCircle2, Loader2, MapPin, MapPinOff } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { NearbyBushland } from "@/hooks/bushlands";
import { useNearbyBushlands } from "@/hooks/bushlands";
import { BUSHLAND_FIXTURES } from "@/lib/bushland-fixtures";
import { cn } from "@/lib/utils";

export type Abundance = "single" | "patch" | "widespread";

const ABUNDANCE_OPTIONS: { value: Abundance; label: string }[] = [
  { value: "single", label: "Single plant" },
  { value: "patch", label: "Small patch" },
  { value: "widespread", label: "Widespread" },
];

export function generateTicketId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TKT-${dateStr}-${randomStr}`;
}

export interface ReportDetails {
  ticketId?: string;
  bushlandId: string;
  bushlandName?: string;
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
  isSubmitting?: boolean;
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
  isSubmitting,
  onSubmit,
  onBack,
  className,
}: ReportSightingFormProps) {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [bushlandId, setBushlandId] = useState<string>(initialBushlandId ?? "");
  const [hasSelectedBushland, setHasSelectedBushland] = useState(
    Boolean(initialBushlandId),
  );
  const [manualBushlandName, setManualBushlandName] = useState("");
  const [observationDate, setObservationDate] = useState(todayIsoDate());
  const [abundance, setAbundance] = useState<Abundance>("single");
  const [notes, setNotes] = useState("");
  const nearbyBushlands = useNearbyBushlands(coords);

  const bushlandOptions: NearbyBushland[] = nearbyBushlands.data ?? [];
  const displayedBushlands =
    bushlandOptions.length > 0
      ? bushlandOptions
      : BUSHLAND_FIXTURES.slice(0, 4).map((bushland, index) => ({
          objectid: index,
          siteNumber: index,
          name: bushland.name,
          description: bushland.summary,
          sourceUrl: "",
          distance: 0,
        }));

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

  useEffect(() => {
    if (!hasSelectedBushland && displayedBushlands[0]) {
      setBushlandId(String(displayedBushlands[0].objectid));
    }
  }, [displayedBushlands, hasSelectedBushland]);

  const handleSubmit = () => {
    onSubmit({
      ticketId: generateTicketId(),
      bushlandId,
      bushlandName:
        bushlandId === "manual" ? manualBushlandName.trim() : undefined,
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
          onChange={(event) => {
            setHasSelectedBushland(true);
            setBushlandId(event.target.value);
          }}
          className="rounded-md border border-input bg-background p-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {displayedBushlands.map((bushland) => (
            <option key={bushland.objectid} value={String(bushland.objectid)}>
              {bushland.name}
            </option>
          ))}
          <option value="manual">Type manually</option>
        </select>
        {bushlandId === "manual" && (
          <input
            type="text"
            value={manualBushlandName}
            onChange={(event) => setManualBushlandName(event.target.value)}
            placeholder="Enter bushland or reserve name"
            aria-label="Bushland or reserve name"
            className="rounded-md border border-input bg-background p-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}
        <p className="text-xs text-muted-foreground">
          Showing up to four nearby bushlands when location is available.
          Otherwise, choose from the demo list or type a name manually.
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

      <div className="flex flex-col gap-3 rounded-md border border-input p-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Location & nearby bushlands (optional)
          </p>
          <p className="text-xs text-muted-foreground">
            Use your location to discover and select bushlands near you.
          </p>
        </div>

        <div aria-live="polite" className="flex flex-col gap-2">
          {locationStatus === "granted" && coords && (
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin
                  className="h-3.5 w-3.5 text-primary"
                  aria-hidden="true"
                />
                Reported location: {coords.latitude.toFixed(5)},{" "}
                {coords.longitude.toFixed(5)}
              </p>

              {nearbyBushlands.isPending ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Finding bushlands near your reported location…
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-foreground">
                    Bushlands near your reported location:
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {displayedBushlands.map((bushland) => {
                      const isSelected =
                        bushlandId === String(bushland.objectid);
                      return (
                        <button
                          key={bushland.objectid}
                          type="button"
                          onClick={() => {
                            setHasSelectedBushland(true);
                            setBushlandId(String(bushland.objectid));
                          }}
                          className={cn(
                            "flex flex-col items-start rounded-md border p-2.5 text-left text-xs transition-colors",
                            isSelected
                              ? "border-primary bg-primary/10 font-medium text-foreground ring-1 ring-primary"
                              : "border-input bg-card text-muted-foreground hover:border-primary/50",
                          )}
                        >
                          <span className="font-semibold text-foreground">
                            {bushland.name}
                          </span>
                          {bushland.description && (
                            <span className="mt-0.5 line-clamp-1 text-muted-foreground">
                              {bushland.description}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {locationStatus === "denied" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinOff className="h-4 w-4" aria-hidden="true" />
              Location permission was denied — you can still select a bushland
              manually.
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
          disabled={locationStatus === "requesting"}
          className="self-start"
        >
          {locationStatus === "requesting" ? (
            <>
              <Loader2
                className="mr-2 h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
              Finding nearby bushlands…
            </>
          ) : locationStatus === "granted" ? (
            "Update nearby bushlands"
          ) : (
            "Find bushlands near my location"
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
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Submitting report…
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Submit report
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back to results
        </Button>
      </div>
    </div>
  );
}
