/**
 * Integration contract for issue #5's interactive map (owned by Zephris).
 * This file defines shapes and a callback/prop contract only — it does not
 * implement a map, choose a map library, or fetch real data. The components
 * in `bushland-info-sheet.tsx`, `event-preview-sheet.tsx` and
 * `map-layer-controls.tsx` are built against these types and are meant to be
 * dropped into whatever map component #5 produces.
 *
 * Suggested integration: the real map component owns the map surface and
 * marker rendering; on marker tap it calls `onSelectBushland`/`onSelectEvent`
 * with the relevant id, and the host page renders <BushlandInfoSheet> /
 * <EventPreviewSheet> based on that selection state. Layer visibility is
 * lifted state owned by the host page and passed down to both the map and
 * <MapLayerControls> so they stay in sync.
 */

import type { InvasiveSpeciesPriority } from "@/types/bushland";

export interface MapSighting {
  id: string;
  speciesCommonName: string;
  priority: InvasiveSpeciesPriority;
  latitude: number;
  longitude: number;
  /** ISO date string. */
  reportedAt: string;
}

export interface MapEventPin {
  slug: string;
  title: string;
  date: string;
  latitude: number;
  longitude: number;
}

export interface MapBushlandPin {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface MapLayerVisibility {
  bushForeverBoundaries: boolean;
  weedSightings: boolean;
  events: boolean;
}

export const DEFAULT_MAP_LAYER_VISIBILITY: MapLayerVisibility = {
  bushForeverBoundaries: true,
  weedSightings: true,
  events: true,
};

/**
 * Props the real map component (issue #5) is expected to accept so this
 * page's sheets/controls can drive and react to it. The map component does
 * not need to implement all of this on day one — start with whichever
 * callbacks are ready and leave the rest as no-ops.
 */
export interface MapIntegrationProps {
  layerVisibility: MapLayerVisibility;
  bushlandPins: MapBushlandPin[];
  sightingPins: MapSighting[];
  eventPins: MapEventPin[];
  onSelectBushland: (slug: string) => void;
  onSelectEvent: (slug: string) => void;
}
