import Link from "next/link";

import type { BushlandProfile } from "@/types/bushland";

const PRIORITY_BADGE_STYLES: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  monitor: "bg-highlight/20 text-highlight-foreground",
  contained: "bg-primary/10 text-primary",
};

export function BushlandCard({ bushland }: { bushland: BushlandProfile }) {
  const topSpecies = bushland.reportedSpecies[0];

  return (
    <Link
      href={`/bushlands/${bushland.slug}`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{bushland.name}</p>
          <p className="text-sm text-muted-foreground">
            {bushland.suburb} &middot; {bushland.areaHectares} ha
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {bushland.habitatTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">
          {bushland.reportedSpecies.length} reported species (demo)
        </span>
        {topSpecies && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_STYLES[topSpecies.priority]}`}
          >
            {topSpecies.commonName}: {topSpecies.priority}
          </span>
        )}
      </div>
    </Link>
  );
}
