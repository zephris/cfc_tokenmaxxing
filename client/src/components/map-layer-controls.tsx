import type { MapLayerVisibility } from "@/types/map-contract";

export interface MapLayerControlsProps {
  visibility: MapLayerVisibility;
  onChange: (next: MapLayerVisibility) => void;
}

const LAYER_LABELS: { key: keyof MapLayerVisibility; label: string }[] = [
  { key: "bushForeverBoundaries", label: "Bush Forever boundaries" },
  { key: "weedSightings", label: "Weed sightings" },
  { key: "events", label: "Events" },
];

/**
 * Layer-visibility toggle UI for issue #5's map (owned by Zephris). Owns no
 * map-drawing logic — it's controlled state the host page lifts and passes
 * to both this component and the real map, so toggling a checkbox here and
 * the map staying in sync is the host page's responsibility. See
 * `client/src/types/map-contract.ts`.
 */
export function MapLayerControls({
  visibility,
  onChange,
}: MapLayerControlsProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground">Layers</p>
      {LAYER_LABELS.map(({ key, label }) => (
        <label
          key={key}
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <input
            type="checkbox"
            checked={visibility[key]}
            onChange={(event) =>
              onChange({ ...visibility, [key]: event.target.checked })
            }
            className="h-4 w-4 accent-primary"
          />
          {label}
        </label>
      ))}
    </div>
  );
}
