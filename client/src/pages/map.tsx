import dynamic from "next/dynamic";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import type {
  BushlandMapProps,
  CurrentLocation,
  GeolocationStatus,
} from "@/components/bushland-map";
import { useNearestBushland } from "@/hooks/bushlands";

const BushlandMap = dynamic<BushlandMapProps>(
  () => import("@/components/bushland-map"),
  {
    loading: () => <div className="h-full w-full bg-[#e6ead7]" />,
    ssr: false,
  },
);

export default function MapPage() {
  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);
  const [locationStatus, setLocationStatus] =
    useState<GeolocationStatus>("idle");
  const { data: nearestBushland, isError: nearestBushlandUnavailable } =
    useNearestBushland(currentLocation);

  const subtitle = nearestBushland
    ? `Near ${nearestBushland.name}`
    : locationStatus === "locating"
      ? "Finding current location…"
      : currentLocation
        ? nearestBushlandUnavailable
          ? "Current location found · nearest bushland unavailable"
          : "Finding nearest bushland…"
        : locationStatus === "error"
          ? "Location unavailable · check browser permission"
          : "Location not shared";

  return (
    <AppShell activeTab="map" fullBleed subtitle={subtitle} title="Field map">
      <div aria-label="Interactive map of Perth" className="h-full w-full">
        <BushlandMap
          nearestBushland={nearestBushland ?? null}
          onLocationChange={setCurrentLocation}
          onLocationStatusChange={setLocationStatus}
        />
      </div>
    </AppShell>
  );
}
