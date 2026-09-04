import { AlertTriangle, Map as MapIcon } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { BushlandInfoSheet } from "@/components/bushland-info-sheet";
import { EventPreviewSheet } from "@/components/event-preview-sheet";
import { MapLayerControls } from "@/components/map-layer-controls";
import { Button } from "@/components/ui/button";
import { BUSHLAND_FIXTURES, findBushlandBySlug } from "@/lib/bushland-fixtures";
import { EVENT_FIXTURES, findEventBySlug } from "@/lib/event-fixtures";
import { DEFAULT_MAP_LAYER_VISIBILITY } from "@/types/map-contract";

/**
 * This page intentionally does not implement a basemap — issue #5 (the
 * interactive map viewer) is owned by Zephris. What's here is a preview
 * slot plus a live demonstration of the map-integration contract
 * (layer controls + info/event sheets) against fixture data, so the sheets
 * and controls can be dropped straight into the real map component once
 * it exists. See `client/src/types/map-contract.ts`.
 */
export default function MapPage() {
  const [layerVisibility, setLayerVisibility] = useState(
    DEFAULT_MAP_LAYER_VISIBILITY,
  );
  const [selectedBushlandSlug, setSelectedBushlandSlug] = useState<
    string | null
  >(null);
  const [selectedEventSlug, setSelectedEventSlug] = useState<string | null>(
    null,
  );

  const selectedBushland = selectedBushlandSlug
    ? (findBushlandBySlug(selectedBushlandSlug) ?? null)
    : null;
  const selectedEvent = selectedEventSlug
    ? (findEventBySlug(selectedEventSlug) ?? null)
    : null;

  return (
    <AppShell
      title="Field map"
      subtitle="Preview — real map pending issue #5"
      activeTab="map"
    >
      <div className="flex flex-col gap-4 pb-24">
        <p className="flex items-start gap-2 rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
          <AlertTriangle
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
          Bush Forever boundary data (where shown) is a 2000 snapshot and may
          not reflect current mapping — verify against the current Metropolitan
          Region Scheme overlay before treating it as current.
        </p>

        <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-secondary text-center">
          <MapIcon
            className="h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-foreground">
            Interactive map — coming soon
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            The real map (issue #5) will render here. Below is a working preview
            of the layer controls and info sheets it will use.
          </p>
        </div>

        <MapLayerControls
          visibility={layerVisibility}
          onChange={setLayerVisibility}
        />

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">
            Preview a marker tap
          </p>
          <p className="text-xs text-muted-foreground">
            Demo only — stands in for tapping a real marker once the map exists.
          </p>
          <div className="flex flex-wrap gap-2">
            {BUSHLAND_FIXTURES.map((bushland) => (
              <Button
                key={bushland.slug}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEventSlug(null);
                  setSelectedBushlandSlug(bushland.slug);
                }}
              >
                {bushland.name}
              </Button>
            ))}
            {EVENT_FIXTURES.map((event) => (
              <Button
                key={event.slug}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedBushlandSlug(null);
                  setSelectedEventSlug(event.slug);
                }}
              >
                {event.title}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <BushlandInfoSheet
        bushland={selectedBushland}
        onClose={() => setSelectedBushlandSlug(null)}
      />
      <EventPreviewSheet
        event={selectedEvent}
        onClose={() => setSelectedEventSlug(null)}
      />
    </AppShell>
  );
}
