import { X } from "lucide-react";
import Link from "next/link";

import { EventPreviewCard } from "@/components/event-preview-card";
import { Button } from "@/components/ui/button";
import type { MapEvent } from "@/hooks/events";

export interface EventPreviewSheetProps {
  event: MapEvent | null;
  onClose: () => void;
}

/**
 * Contextual card for an event marker selected on the map.
 */
export function EventPreviewSheet({ event, onClose }: EventPreviewSheetProps) {
  if (!event) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4">
      <div
        className="pointer-events-auto w-full max-w-md animate-in slide-in-from-right-8 fade-in rounded-xl border border-border bg-card p-4 shadow-lg duration-300 sm:max-w-2xl"
        key={event.id}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-full">
            <EventPreviewCard event={event} from="map" linkToDetails={false} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event preview"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <Button asChild size="sm" className="mt-3">
          <Link href={`/events/${event.id}?from=map`}>View event details</Link>
        </Button>
      </div>
    </div>
  );
}
