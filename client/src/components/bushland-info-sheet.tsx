import { X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { BushlandProfile } from "@/types/bushland";

export interface BushlandInfoSheetProps {
  bushland: BushlandProfile | null;
  onClose: () => void;
}

/**
 * Contextual bottom sheet for tapping a bushland marker on the map (issues
 * #5/#6/#7). Intentionally has no map-drawing logic — it only renders a
 * summary + navigation actions from a `BushlandProfile`, so it can sit on
 * top of whatever map component #5 produces. See
 * `client/src/types/map-contract.ts` for the intended wiring.
 */
export function BushlandInfoSheet({
  bushland,
  onClose,
}: BushlandInfoSheetProps) {
  if (!bushland) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-4 shadow-lg sm:max-w-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">{bushland.name}</p>
            <p className="text-sm text-muted-foreground">
              {bushland.suburb} &middot; {bushland.areaHectares} ha
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bushland preview"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {bushland.habitatTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          {bushland.reportedSpecies.length} reported invasive species (demo)
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/bushlands/${bushland.slug}`}>View full profile</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/identify?bushland=${bushland.slug}`}>
              Report a weed here
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
