import { Calendar, Check, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { findEventBySlug } from "@/lib/event-fixtures";

export default function EventDetailsPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const event = findEventBySlug(slug);
  const [isGoing, setIsGoing] = useState(false);

  if (!event) {
    return (
      <AppShell title="Event not found" activeTab="explore" backHref="/explore">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-medium text-foreground">
            We couldn&apos;t find that event
          </p>
          <p className="text-sm text-muted-foreground">
            It may have ended or been removed from the demo list.
          </p>
          <Button asChild variant="outline">
            <Link href="/explore">Back to Explore</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const placesLeft = Math.max(event.capacity - event.attendeeCount, 0);
  const formattedDate = new Date(event.date + "T00:00:00").toLocaleDateString(
    undefined,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    },
  );

  return (
    <AppShell
      title="Event details"
      activeTab="explore"
      backHref={`/bushlands/${event.bushlandSlug}`}
    >
      <div className="flex flex-col gap-5">
        <div className="flex h-40 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Calendar className="h-8 w-8" aria-hidden="true" />
        </div>

        <div>
          <span className="w-fit rounded-full bg-highlight/20 px-2 py-0.5 text-xs font-medium text-highlight-foreground">
            {formattedDate}
          </span>
          <h2 className="mt-2 text-xl font-bold text-foreground">
            {event.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            Hosted by {event.host}
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <p className="flex items-center gap-2 text-foreground">
            <Calendar
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            {formattedDate}, {event.startTime}–{event.endTime}
          </p>
          <p className="flex items-center gap-2 text-foreground">
            <MapPin
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            {event.locationName} — {event.locationDetail}
          </p>
          <p className="flex items-center gap-2 text-foreground">
            <Users
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            {event.attendeeCount + (isGoing ? 1 : 0)} volunteers joining
            {placesLeft > 0 && ` · ${placesLeft} places still available`}
          </p>
        </div>

        <section>
          <h3 className="text-sm font-semibold text-foreground">
            About this event
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.description}
          </p>
        </section>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => setIsGoing((value) => !value)}
            variant={isGoing ? "outline" : "default"}
            className="self-start"
          >
            {isGoing ? (
              <>
                <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                You&apos;re marked as going
              </>
            ) : (
              "I'm going"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Demo only — this isn&apos;t a real RSVP and isn&apos;t saved
            anywhere. Real registration depends on the IAM/administration system
            planned for issue #4.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
