import { Calendar, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { MapEvent } from "@/hooks/events";

export interface EventPreviewCardProps {
  event: MapEvent;
  /** Renders as a link to the full event route when true (default). Set false when embedding inside a sheet that provides its own "view details" affordance. */
  linkToDetails?: boolean;
  from?: "explore" | "map";
  metaText?: string;
  showImage?: boolean;
}

export function EventPreviewCard({
  event,
  linkToDetails = true,
  from = "explore",
  metaText,
  showImage = false,
}: EventPreviewCardProps) {
  const content = (
    <div
      className={`flex gap-4 rounded-xl border border-border bg-card ${
        showImage ? "min-h-40 items-start p-5" : "flex-col p-4"
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="w-fit rounded-full bg-highlight/20 px-2 py-0.5 text-xs font-medium text-highlight-foreground">
          {event.dateLabel}
        </span>
        <p className="font-semibold text-foreground">{event.title}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {event.timeLabel}
        </p>
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {event.venue}
            {event.address ? ` · ${event.address}` : ""}
          </span>
        </p>
        {metaText || event.availability ? (
          <p className="text-sm text-muted-foreground">
            {metaText ?? event.availability}
          </p>
        ) : null}
      </div>

      {showImage && event.imagePath ? (
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary sm:h-28 sm:w-32">
          <Image
            alt={`${event.title} event`}
            className="object-cover"
            fill
            sizes="(min-width: 640px) 128px, 96px"
            src={event.imagePath}
          />
        </div>
      ) : null}
    </div>
  );

  if (!linkToDetails) return content;

  return (
    <Link
      href={`/events/${event.id}?from=${from}`}
      className="block transition-opacity hover:opacity-90"
    >
      {content}
    </Link>
  );
}
