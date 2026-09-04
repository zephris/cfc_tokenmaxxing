import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";

import type { EventFixture } from "@/types/events";

export interface EventPreviewCardProps {
  event: EventFixture;
  /** Renders as a link to the full event route when true (default). Set false when embedding inside a sheet that provides its own "view details" affordance. */
  linkToDetails?: boolean;
}

export function EventPreviewCard({
  event,
  linkToDetails = true,
}: EventPreviewCardProps) {
  const content = (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <span className="w-fit rounded-full bg-highlight/20 px-2 py-0.5 text-xs font-medium text-highlight-foreground">
        {new Date(event.date + "T00:00:00").toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
          month: "short",
        })}
      </span>
      <p className="font-semibold text-foreground">{event.title}</p>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {event.startTime}–{event.endTime}
      </p>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {event.locationName}
      </p>
      <p className="text-sm text-muted-foreground">
        {event.attendeeCount} volunteers joining &middot;{" "}
        {Math.max(event.capacity - event.attendeeCount, 0)} places left
      </p>
    </div>
  );

  if (!linkToDetails) return content;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="block transition-opacity hover:opacity-90"
    >
      {content}
    </Link>
  );
}
