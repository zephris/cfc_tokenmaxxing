import { Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { BushlandCard } from "@/components/bushland-card";
import { BUSHLAND_FIXTURES } from "@/lib/bushland-fixtures";

type LocationState =
  | { status: "idle" | "requesting" | "denied" | "unavailable" }
  | { status: "granted"; latitude: number; longitude: number };

// Simple great-circle distance in km — good enough for a "near you" sort
// over a handful of demo points, not for anything precision-critical.
function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function ExplorePage() {
  // Fixture data loads synchronously, but this simulates the loading state
  // the real fetch (once #3's data source exists) will need.
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationState>({ status: "idle" });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const habitatTags = useMemo(
    () => Array.from(new Set(BUSHLAND_FIXTURES.flatMap((b) => b.habitatTags))),
    [],
  );

  const requestNearMe = () => {
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
      () => setLocation({ status: "denied" }),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const results = useMemo(() => {
    let list = BUSHLAND_FIXTURES.filter((bushland) => {
      const matchesQuery =
        query.trim().length === 0 ||
        bushland.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        bushland.suburb.toLowerCase().includes(query.trim().toLowerCase());
      const matchesTag = !activeTag || bushland.habitatTags.includes(activeTag);
      return matchesQuery && matchesTag;
    });

    if (location.status === "granted") {
      list = [...list].sort(
        (a, b) => distanceKm(location, a) - distanceKm(location, b),
      );
    }

    return list;
  }, [query, activeTag, location]);

  return (
    <AppShell
      title="Explore bushland"
      subtitle="Know the land before you patrol"
      activeTab="explore"
    >
      <div className="flex flex-col gap-4">
        <p className="rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
          Demo content: bushland descriptions, habitat tags and species counts
          below are illustrative placeholders, not an official survey.
        </p>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search bushland areas"
            aria-label="Search bushland areas"
            className="w-full rounded-full border border-input bg-background py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTag === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-muted-foreground hover:border-primary/40"
            }`}
          >
            All
          </button>
          {habitatTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTag === tag
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground hover:border-primary/40"
              }`}
            >
              {tag}
            </button>
          ))}
          <button
            type="button"
            onClick={requestNearMe}
            disabled={location.status === "requesting"}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              location.status === "granted"
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-muted-foreground hover:border-primary/40"
            }`}
          >
            {location.status === "requesting" ? (
              <>
                <Loader2
                  className="mr-1 inline h-3 w-3 animate-spin"
                  aria-hidden="true"
                />
                Locating…
              </>
            ) : location.status === "granted" ? (
              "Sorted near you"
            ) : (
              "Near you"
            )}
          </button>
        </div>
        {location.status === "denied" && (
          <p className="text-xs text-muted-foreground">
            Location permission was denied — showing all areas instead.
          </p>
        )}
        {location.status === "unavailable" && (
          <p className="text-xs text-muted-foreground">
            Location isn&apos;t available on this device or browser.
          </p>
        )}

        {isLoading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center gap-2 py-10 text-center"
          >
            <Loader2
              className="h-5 w-5 animate-spin text-primary"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              Loading bushland areas…
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-input py-10 text-center">
            <p className="font-medium text-foreground">No bushland found</p>
            <p className="text-sm text-muted-foreground">
              Try a different search term or clear the habitat filter.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((bushland) => (
              <BushlandCard key={bushland.slug} bushland={bushland} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
