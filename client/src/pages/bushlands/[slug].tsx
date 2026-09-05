import { AlertTriangle, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { findBushlandBySlug } from "@/lib/bushland-fixtures";

const PRIORITY_BADGE_STYLES: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  monitor: "bg-highlight/20 text-highlight-foreground",
  contained: "bg-primary/10 text-primary",
};

export default function BushlandProfilePage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const bushland = findBushlandBySlug(slug);

  if (!bushland) {
    return (
      <AppShell
        title="Bushland not found"
        activeTab="explore"
        backHref="/explore"
      >
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-medium text-foreground">
            We couldn&apos;t find that bushland
          </p>
          <p className="text-sm text-muted-foreground">
            It may have been removed from the demo list.
          </p>
          <Button asChild variant="outline">
            <Link href="/explore">Back to Explore</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={bushland.name}
      subtitle={bushland.suburb}
      activeTab="explore"
      backHref="/explore"
    >
      <div className="flex flex-col gap-6">
        <div className="flex h-40 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <MapPin className="h-8 w-8" aria-hidden="true" />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{bushland.areaHectares} ha</span>
          {bushland.habitatTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="text-sm text-foreground">{bushland.summary}</p>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Ecological communities
          </h2>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {bushland.ecologicalCommunities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Native flora (demo)
            </h2>
            <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
              {bushland.nativeFloraHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Native fauna (demo)
            </h2>
            <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
              {bushland.nativeFaunaHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Priority invasive weeds
          </h2>
          <div className="flex flex-col gap-2">
            {bushland.reportedSpecies.map((species) => (
              <div
                key={species.commonName}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {species.commonName}
                  </p>
                  <p className="text-xs italic text-muted-foreground">
                    {species.scientificName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {species.sightings} sightings (demo) &middot; updated{" "}
                    {species.updatedAt}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_STYLES[species.priority]}`}
                >
                  {species.priority}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2 rounded-md border border-border p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Data sources and currency
          </p>
          <ul className="list-inside list-disc text-xs text-muted-foreground">
            {bushland.dataSources.map((source) => (
              <li key={source.label}>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {source.label}
                  </a>
                ) : (
                  source.label
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            {bushland.dataCurrencyNote}
          </p>
        </section>

        <Button asChild className="self-start">
          <Link href={`/identify?bushland=${bushland.slug}`}>
            Report a weed here
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}
