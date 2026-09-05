import { Calendar, Check, ExternalLink, Loader2, MapPin } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useEvent } from "@/hooks/events";

export default function EventDetailsPage() {
  const router = useRouter();
  const [isJoined, setIsJoined] = useState(false);
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const { data: event, isError, isLoading, refetch } = useEvent(slug);
  const backHref = router.query.from === "map" ? "/map" : "/explore";

  if (!router.isReady || isLoading) {
    return (
      <AppShell title="Event details" activeTab="explore" backHref={backHref}>
        <div
          aria-live="polite"
          className="flex flex-col items-center gap-2 py-12 text-center"
          role="status"
        >
          <Loader2
            aria-hidden="true"
            className="h-5 w-5 animate-spin text-primary"
          />
          <p className="text-sm text-muted-foreground">Loading event…</p>
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell title="Event details" activeTab="explore" backHref={backHref}>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-medium text-foreground">
            Event details couldn&apos;t be loaded
          </p>
          <p className="text-sm text-muted-foreground">
            Check that the Django server is running, then try again.
          </p>
          <Button onClick={() => refetch()} size="sm" type="button">
            Try again
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!event) {
    return (
      <AppShell title="Event not found" activeTab="explore" backHref={backHref}>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-medium text-foreground">
            We couldn&apos;t find that event
          </p>
          <p className="text-sm text-muted-foreground">
            It may have ended or been removed from the event list.
          </p>
          <Button onClick={() => router.push(backHref)} variant="outline">
            Go back
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <Head>
        <title>{event.title}</title>
      </Head>
      <AppShell title="Event details" activeTab="explore" backHref={backHref}>
        <article className="flex flex-col gap-5">
          {event.imagePath ? (
            <div className="relative h-64 overflow-hidden rounded-xl bg-secondary">
              <Image
                fill
                priority
                alt={event.title}
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 672px"
                src={event.imagePath}
              />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Calendar className="h-8 w-8" aria-hidden="true" />
            </div>
          )}

          <header>
            <span className="w-fit rounded-full bg-highlight/20 px-2 py-0.5 text-xs font-medium text-highlight-foreground">
              {event.dateLabel}
            </span>
            <h2 className="mt-2 text-xl font-bold text-foreground">
              {event.title}
            </h2>
            {event.availability ? (
              <p className="text-sm text-muted-foreground">
                {event.availability}
              </p>
            ) : null}
          </header>

          <div className="flex flex-col gap-3 text-sm">
            <p className="flex items-center gap-2 text-foreground">
              <Calendar
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              {event.dateLabel} · {event.timeLabel}
            </p>
            <p className="flex items-center gap-2 text-foreground">
              <MapPin
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              {event.venue}
              {event.address ? ` · ${event.address}` : ""}
            </p>
          </div>

          <section>
            <h3 className="text-sm font-semibold text-foreground">
              About this event
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {event.summary || "No additional event information is available."}
            </p>
            <p className="mt-3 break-all text-sm text-muted-foreground">
              Website:{" "}
              <a
                className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                href={event.href}
                rel="noreferrer"
                target="_blank"
              >
                {event.href}
                <ExternalLink
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0"
                />
              </a>
            </p>
          </section>

          <div className="flex flex-col gap-2">
            <Button
              className="self-start"
              onClick={() => setIsJoined((joined) => !joined)}
              type="button"
              variant={isJoined ? "outline" : "default"}
            >
              {isJoined ? (
                <>
                  <Check aria-hidden="true" className="mr-2 h-4 w-4" />
                  Joined
                </>
              ) : (
                "Join"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Demo only — your selection is not saved after you leave this page.
            </p>
          </div>
        </article>
      </AppShell>
    </>
  );
}
