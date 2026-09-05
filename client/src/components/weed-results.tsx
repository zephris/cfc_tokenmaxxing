import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  WeedCandidate,
  WeedConfidenceLevel,
  WeedIdentificationResponse,
} from "@/types/weeds";

export type WeedResultsStatus = "idle" | "pending" | "success" | "error";

/** A ranked candidate's `rank`, or `"none"` for "none of these match". */
export type SelectedCandidate = number | "none";

export interface WeedResultsProps {
  status: WeedResultsStatus;
  data?: WeedIdentificationResponse;
  /** Network/backend failure message (issue #11's "network/backend failure" state). */
  errorMessage?: string | null;
  selectedRank: SelectedCandidate | null;
  onSelectCandidate: (rank: SelectedCandidate) => void;
  onConfirm: () => void;
  onRetry: () => void;
  className?: string;
}

const CONFIDENCE_BADGE_STYLES: Record<WeedConfidenceLevel, string> = {
  high: "bg-primary/10 text-primary",
  medium: "bg-accent text-accent-foreground",
  low: "bg-destructive/10 text-destructive",
};

function ConfidenceBadge({ candidate }: { candidate: WeedCandidate }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        CONFIDENCE_BADGE_STYLES[candidate.confidence_level],
      )}
    >
      {Math.round(candidate.confidence * 100)}% confidence (
      {candidate.confidence_level})
    </span>
  );
}

function CandidateCard({
  candidate,
  selected,
  onSelect,
}: {
  candidate: WeedCandidate;
  selected: boolean;
  onSelect: () => void;
}) {
  const profile = candidate.weedscan_profile;

  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col gap-3 rounded-md border p-4 transition-colors",
        selected
          ? "border-primary ring-1 ring-primary"
          : "border-input hover:border-primary/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <input
            type="radio"
            name="weed-candidate"
            className="mt-1 h-4 w-4 accent-primary"
            checked={selected}
            onChange={onSelect}
            aria-label={`Select ${candidate.common_name} as the identified species`}
          />
          <div>
            <p className="font-medium text-foreground">
              #{candidate.rank} {candidate.common_name}
            </p>
            <p className="text-sm italic text-muted-foreground">
              {candidate.scientific_name} &middot; {candidate.family}
            </p>
          </div>
        </div>
        <ConfidenceBadge candidate={candidate} />
      </div>

      {candidate.reference_images.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto">
          {candidate.reference_images.map((src) => (
            // Remote WeedScan reference images — no known domain to
            // pre-configure for next/image, so a plain <img> is used.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={`Reference photo of ${candidate.common_name}`}
              className="h-24 w-24 shrink-0 rounded object-cover"
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No reference image available for this species.
        </p>
      )}

      {profile ? (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
          {profile.description && (
            <div className="sm:col-span-2">
              <dt className="sr-only">Description</dt>
              <dd className="text-foreground">{profile.description}</dd>
            </div>
          )}
          {profile.plant_form && (
            <div>
              <dt className="text-muted-foreground">Plant form</dt>
              <dd>{profile.plant_form}</dd>
            </div>
          )}
          {profile.leaves && (
            <div>
              <dt className="text-muted-foreground">Leaves</dt>
              <dd>{profile.leaves}</dd>
            </div>
          )}
          {profile.flowers && (
            <div>
              <dt className="text-muted-foreground">Flowers</dt>
              <dd>{profile.flowers}</dd>
            </div>
          )}
          {profile.distinguishing_features && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Distinguishing features</dt>
              <dd>{profile.distinguishing_features}</dd>
            </div>
          )}
          {profile.habitat && (
            <div>
              <dt className="text-muted-foreground">Habitat</dt>
              <dd>{profile.habitat}</dd>
            </div>
          )}
          {profile.ecological_impacts && (
            <div>
              <dt className="text-muted-foreground">Ecological impacts</dt>
              <dd>{profile.ecological_impacts}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          Detailed WeedScan profile information isn&apos;t available yet for
          this candidate.
        </p>
      )}

      {candidate.wikipedia_extract && (
        <div className="text-sm">
          <p className="text-muted-foreground">Reference summary</p>
          <p className="text-foreground">{candidate.wikipedia_extract}</p>
        </div>
      )}

      {candidate.reference_links.length > 0 && (
        <div className="flex flex-col gap-1">
          {candidate.reference_links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              {link.label}
            </a>
          ))}
          <p className="text-xs text-muted-foreground">
            External references (including Wikipedia) are general background
            only — not scholarly or authoritative sources.
          </p>
        </div>
      )}
    </label>
  );
}

/** The "none of these match" option, styled distinctly from a real candidate. */
function NoneOfTheseCard({
  selected,
  onSelect,
}: {
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border border-dashed p-4 transition-colors",
        selected
          ? "border-primary ring-1 ring-primary"
          : "border-input hover:border-primary/50",
      )}
    >
      <input
        type="radio"
        name="weed-candidate"
        className="mt-1 h-4 w-4 accent-primary"
        checked={selected}
        onChange={onSelect}
        aria-label="None of these candidates match — report as unidentified"
      />
      <div>
        <p className="font-medium text-foreground">None of these match</p>
        <p className="text-sm text-muted-foreground">
          Report this sighting as unidentified so a person can review it, rather
          than confirming one of the AI&apos;s suggestions.
        </p>
      </div>
    </label>
  );
}

export function WeedResults({
  status,
  data,
  errorMessage,
  selectedRank,
  onSelectCandidate,
  onConfirm,
  onRetry,
  className,
}: WeedResultsProps) {
  if (status === "idle") return null;

  if (status === "pending") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex flex-col items-center gap-3 rounded-md border border-input p-8 text-center",
          className,
        )}
      >
        <Loader2
          className="h-6 w-6 animate-spin text-primary"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">
          Identifying your photo — this can take a few seconds…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className={cn(
          "flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4",
          className,
        )}
      >
        <p className="flex items-center gap-2 font-medium text-destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Identification failed
        </p>
        <p className="text-sm text-muted-foreground">
          {errorMessage ??
            "We couldn't reach the identification service. Please check your connection and try again."}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="self-start"
        >
          Retake photo
        </Button>
      </div>
    );
  }

  // status === "success"
  if (!data) return null;

  const topCandidate = data.candidates[0];
  const isUnknown = data.candidates.length === 0;
  const isLowConfidence = topCandidate?.confidence_level === "low";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {data.is_mock && (
        <p className="rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
          Development mode: showing example data because the identification
          service isn&apos;t connected yet.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          WeedScan AI suggestion — human verification required
        </span>
        <p className="text-xs text-muted-foreground">{data.disclaimer}</p>
      </div>

      {isUnknown ? (
        <div className="flex flex-col gap-3 rounded-md border border-input p-6 text-center">
          <p className="font-medium text-foreground">
            No confident match found
          </p>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t identify this plant with any confidence. Try a
            closer, well-lit photo of the leaves or flowers, or report it
            manually for a human to review.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={onConfirm}>
              Report as unidentified
            </Button>
            <Button type="button" variant="outline" onClick={onRetry}>
              Retake photo
            </Button>
          </div>
        </div>
      ) : (
        <>
          {isLowConfidence && (
            <p className="flex items-center gap-2 rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              The best match has low confidence — compare candidates carefully
              or retake the photo before confirming.
            </p>
          )}

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-foreground">
              Select the closest match
            </legend>
            {data.candidates.map((candidate) => (
              <CandidateCard
                key={candidate.rank}
                candidate={candidate}
                selected={selectedRank === candidate.rank}
                onSelect={() => onSelectCandidate(candidate.rank)}
              />
            ))}
            <NoneOfTheseCard
              selected={selectedRank === "none"}
              onSelect={() => onSelectCandidate("none")}
            />
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={onConfirm}
              disabled={selectedRank === null}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
              {selectedRank === "none"
                ? "Report as unidentified"
                : "Confirm identification"}
            </Button>
            <Button type="button" variant="outline" onClick={onRetry}>
              Retake photo
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
