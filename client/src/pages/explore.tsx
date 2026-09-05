import {
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { type MapEvent, useEvents } from "@/hooks/events";

type SortMode = "alphabetical" | "nearby";

type LocationCoordinates = {
  latitude: number;
  longitude: number;
};

type LocationState =
  | { status: "idle" | "requesting" | "denied" | "unavailable" }
  | ({ status: "granted" } & LocationCoordinates);

function distanceKm(location: LocationCoordinates, event: MapEvent) {
  const [eventLatitude, eventLongitude] = event.position;
  const earthRadiusKm = 6371;
  const latitudeDifference =
    ((eventLatitude - location.latitude) * Math.PI) / 180;
  const longitudeDifference =
    ((eventLongitude - location.longitude) * Math.PI) / 180;
  const startLatitude = (location.latitude * Math.PI) / 180;
  const eventLatitudeRadians = (eventLatitude * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(eventLatitudeRadians) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

function formatDistance(distance: number) {
  if (distance < 1) {
    return `${Math.max(10, Math.round((distance * 1000) / 10) * 10)} m away`;
  }

  return `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} km away`;
}

function EventCard({
  event,
  distance,
}: {
  event: MapEvent;
  distance?: number;
}) {
  return (
    <a
      className="group block overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={event.href}
      rel="noreferrer"
      target="_blank"
    >
      <article className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="w-fit rounded-full bg-highlight/30 px-2.5 py-1 text-xs font-semibold text-highlight-foreground">
            {event.dateLabel}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {distance !== undefined
              ? formatDistance(distance)
              : event.availability}
          </span>
        </div>

        <div>
          <h2 className="text-base font-semibold leading-tight text-foreground">
            {event.title}
          </h2>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <CalendarDays
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{event.timeLabel}</span>
          </p>
          <p className="mt-1.5 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {event.venue}
              {event.address ? ` · ${event.address}` : ""}
            </span>
          </p>
        </div>

        {event.summary ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {event.summary}
          </p>
        ) : null}

        <span className="flex items-center justify-between border-t border-border pt-3 text-sm font-medium text-primary">
          View event details
          <ExternalLink
            aria-hidden="true"
            className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </span>
      </article>
    </a>
  );
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("alphabetical");
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const { data, isError, isLoading, refetch } = useEvents();

  const results = useMemo(() => {
    const normalisedQuery = query.trim().toLocaleLowerCase();
    const filteredEvents = (data?.events ?? []).filter((event) =>
      [event.title, event.venue, event.address, event.summary].some((value) =>
        value.toLocaleLowerCase().includes(normalisedQuery),
      ),
    );

    return [...filteredEvents].sort((first, second) => {
      if (sortMode === "nearby" && location.status === "granted") {
        return distanceKm(location, first) - distanceKm(location, second);
      }

      return first.title.localeCompare(second.title, "en", {
        sensitivity: "base",
      });
    });
  }, [data?.events, location, query, sortMode]);

  function requestNearbySort() {
    setSortMode("nearby");

    if (location.status === "granted" || location.status === "requesting") {
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation({ status: "unavailable" });
      return;
    }

    setLocation({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setLocation({
          status: "granted",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => {
        setSortMode("alphabetical");
        setLocation({
          status:
            error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
        });
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  }

  return (
    <>
      <Head>
        <title>Explore events</title>
      </Head>
      <AppShell
        activeTab="explore"
        subtitle="Discover activities across Perth bushland"
        title="Explore events"
      >
        <div className="flex flex-col gap-5">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              aria-label="Search events"
              className="w-full rounded-full border border-input bg-background py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events or locations"
              type="search"
              value={query}
            />
          </div>

          <section aria-labelledby="sort-events-heading">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h1
                className="text-sm font-semibold text-foreground"
                id="sort-events-heading"
              >
                Upcoming events
              </h1>
              {!isLoading && !isError ? (
                <span className="text-xs text-muted-foreground">
                  {results.length} found
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-full"
                onClick={() => setSortMode("alphabetical")}
                size="sm"
                type="button"
                variant={sortMode === "alphabetical" ? "default" : "outline"}
              >
                Alphabetical
              </Button>
              <Button
                className="rounded-full"
                onClick={requestNearbySort}
                size="sm"
                type="button"
                variant={sortMode === "nearby" ? "default" : "outline"}
              >
                {location.status === "requesting" ? (
                  <Loader2
                    aria-hidden="true"
                    className="mr-1.5 h-3.5 w-3.5 animate-spin"
                  />
                ) : (
                  <Navigation
                    aria-hidden="true"
                    className="mr-1.5 h-3.5 w-3.5"
                  />
                )}
                Nearby
              </Button>
              <Button
                className="rounded-full"
                disabled
                size="sm"
                title="Popularity sorting will be available when attendance data is stored"
                type="button"
                variant="outline"
              >
                Popular · Soon
              </Button>
            </div>

            {location.status === "denied" ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Location permission was denied. Enable it in your browser to
                sort nearby events.
              </p>
            ) : location.status === "unavailable" ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Your current location is unavailable, so events remain sorted
                alphabetically.
              </p>
            ) : null}
          </section>

          {isLoading ? (
            <div
              aria-live="polite"
              className="flex flex-col items-center gap-2 py-12 text-center"
              role="status"
            >
              <Loader2
                aria-hidden="true"
                className="h-5 w-5 animate-spin text-primary"
              />
              <p className="text-sm text-muted-foreground">Loading events…</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-input px-4 py-10 text-center">
              <p className="font-medium text-foreground">
                Events couldn&apos;t be loaded
              </p>
              <p className="text-sm text-muted-foreground">
                Check that the Django server is running, then try again.
              </p>
              <Button onClick={() => refetch()} size="sm" type="button">
                Try again
              </Button>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-input px-4 py-10 text-center">
              <p className="font-medium text-foreground">No events found</p>
              <p className="text-sm text-muted-foreground">
                Try a different event name or location.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((event) => (
                <EventCard
                  distance={
                    sortMode === "nearby" && location.status === "granted"
                      ? distanceKm(location, event)
                      : undefined
                  }
                  event={event}
                  key={event.id}
                />
              ))}
            </div>
          )}

          {!isLoading && !isError && results.length > 0 ? (
            <Link
              className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              href="/map"
            >
              View all events on the map
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </AppShell>
    </>
  );
}
