import { latLng, latLngBounds, Polygon as LeafletPolygon } from "leaflet";
import { ExternalLink, LocateFixed, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

import {
  type BushlandProperties,
  type NearestBushland,
  useBushlands,
} from "@/hooks/bushlands";
import { type MapEvent, useEvents } from "@/hooks/events";

const PERTH_CENTRE: [number, number] = [-31.953, 115.857];
const INITIAL_BOUNDS: [number, number, number, number] = [
  115.65, -32.15, 116.05, -31.75,
];
const EVENT_COLOUR = "#F0B400";
const BUSHLAND_COLOUR = "#234D3B";
const CURRENT_LOCATION_COLOUR = "#2563EB";
const EVENT_BOUNDS_OPTIONS = {
  paddingTopLeft: [48, 48] as [number, number],
  paddingBottomRight: [48, 48] as [number, number],
};
const CARD_OPEN_BOUNDS_OPTIONS = {
  paddingTopLeft: [48, 48] as [number, number],
  paddingBottomRight: [48, 230] as [number, number],
};

export type CurrentLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type GeolocationStatus = "idle" | "locating" | "found" | "error";

export type BushlandMapProps = {
  nearestBushland: NearestBushland | null;
  onLocationChange: (location: CurrentLocation) => void;
  onLocationStatusChange: (status: GeolocationStatus) => void;
};

type BushlandAreasProps = {
  currentLocation: CurrentLocation | null;
  selectedObjectId?: number;
  onSelectBushland: (bushland: BushlandProperties) => void;
};

function BushlandAreas({
  currentLocation,
  selectedObjectId,
  onSelectBushland,
}: BushlandAreasProps) {
  const [bbox, setBbox] = useState(INITIAL_BOUNDS);
  const { data } = useBushlands(bbox);

  useMapEvents({
    moveend(event) {
      const bounds = event.target.getBounds();
      setBbox([
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]);
    },
  });

  return data ? (
    <GeoJSON
      data={data}
      key={`${bbox.join(",")}-${selectedObjectId ?? "none"}-${
        currentLocation
          ? `${currentLocation.latitude},${currentLocation.longitude}`
          : "no-location"
      }`}
      onEachFeature={(feature, layer) => {
        const properties = feature.properties as BushlandProperties;
        layer.bindTooltip(properties.name, { direction: "top", sticky: true });
        layer.on("click", () => {
          const distanceMetres =
            currentLocation && layer instanceof LeafletPolygon
              ? distanceFromLocationToBounds(currentLocation, layer.getBounds())
              : undefined;
          onSelectBushland({ ...properties, distanceMetres });
        });
      }}
      style={(feature) => {
        const properties = feature?.properties as
          | BushlandProperties
          | undefined;
        const selected = properties?.objectid === selectedObjectId;

        return {
          color: BUSHLAND_COLOUR,
          fillColor: BUSHLAND_COLOUR,
          fillOpacity: selected ? 0.58 : 0.34,
          opacity: 1,
          weight: selected ? 3.5 : 2.25,
        };
      }}
    />
  ) : null;
}

function distanceFromLocationToBounds(
  location: CurrentLocation,
  bounds: ReturnType<typeof latLngBounds>,
) {
  const nearestLatitude = Math.max(
    bounds.getSouth(),
    Math.min(location.latitude, bounds.getNorth()),
  );
  const nearestLongitude = Math.max(
    bounds.getWest(),
    Math.min(location.longitude, bounds.getEast()),
  );

  return mapDistance(
    location.latitude,
    location.longitude,
    nearestLatitude,
    nearestLongitude,
  );
}

function mapDistance(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) {
  return latLng(fromLatitude, fromLongitude).distanceTo(
    latLng(toLatitude, toLongitude),
  );
}

function formatBushlandDistance(distanceMetres: number) {
  if (distanceMetres < 50) {
    return "You are in or beside this bushland";
  }

  if (distanceMetres < 1000) {
    return `About ${Math.round(distanceMetres / 10) * 10} m from your location`;
  }

  const kilometres = distanceMetres / 1000;
  return `About ${kilometres < 10 ? kilometres.toFixed(1) : Math.round(kilometres)} km from your location`;
}

type MapMarkersProps = {
  events: MapEvent[];
  selectedEventId?: string;
  onSelectEvent: (event: MapEvent) => void;
};

function MapMarkers({
  events,
  selectedEventId,
  onSelectEvent,
}: MapMarkersProps) {
  return (
    <>
      {events.map((event) => {
        const selected = event.id === selectedEventId;

        return (
          <CircleMarker
            center={event.position}
            eventHandlers={{ click: () => onSelectEvent(event) }}
            fillColor={EVENT_COLOUR}
            fillOpacity={1}
            key={event.id}
            pathOptions={{
              color: selected ? BUSHLAND_COLOUR : "hsl(var(--background))",
              weight: selected ? 4 : 3,
            }}
            radius={selected ? 19 : 17}
          >
            <Tooltip direction="top" offset={[0, -12]}>
              {event.title}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

function CurrentLocationMarker({ location }: { location: CurrentLocation }) {
  const position: [number, number] = [location.latitude, location.longitude];

  return (
    <>
      <Circle
        center={position}
        interactive={false}
        pathOptions={{
          color: CURRENT_LOCATION_COLOUR,
          fillColor: CURRENT_LOCATION_COLOUR,
          fillOpacity: 0.08,
          opacity: 0.45,
          weight: 1.5,
        }}
        radius={location.accuracy}
      />
      <CircleMarker
        center={position}
        fillColor={CURRENT_LOCATION_COLOUR}
        fillOpacity={1}
        pathOptions={{ color: "white", weight: 3 }}
        radius={8}
      >
        <Tooltip direction="top" offset={[0, -8]}>
          Current location
        </Tooltip>
      </CircleMarker>
    </>
  );
}

type MapOverlayProps = {
  events: MapEvent[];
  event: MapEvent | null;
  bushland: BushlandProperties | null;
  currentLocation: CurrentLocation | null;
  locationStatus: GeolocationStatus;
  nearestBushland: NearestBushland | null;
  onClose: () => void;
  onLocationFound: (location: CurrentLocation) => void;
  onLocationStatusChange: (status: GeolocationStatus) => void;
};

function MapOverlay({
  events,
  event,
  bushland,
  currentLocation,
  locationStatus,
  nearestBushland,
  onClose,
  onLocationFound,
  onLocationStatusChange,
}: MapOverlayProps) {
  const map = useMap();
  const hasRequestedLocation = useRef(false);

  useMapEvents({
    locationerror() {
      onLocationStatusChange("error");
    },
    locationfound(locationEvent) {
      const location = {
        latitude: locationEvent.latlng.lat,
        longitude: locationEvent.latlng.lng,
        accuracy: locationEvent.accuracy,
      };
      onLocationFound(location);
      map.flyTo(locationEvent.latlng, 13, { animate: true, duration: 0.8 });
    },
  });

  useEffect(() => {
    if (hasRequestedLocation.current) {
      return;
    }

    hasRequestedLocation.current = true;
    onClose();
    onLocationStatusChange("locating");
    map.locate({
      enableHighAccuracy: true,
      maximumAge: 30_000,
      setView: false,
      timeout: 10_000,
    });
  }, [map, onClose, onLocationStatusChange]);

  useEffect(() => {
    if (events.length > 0 && !currentLocation) {
      map.fitBounds(
        latLngBounds(events.map((mapEvent) => mapEvent.position)),
        EVENT_BOUNDS_OPTIONS,
      );
    }
  }, [currentLocation, events, map]);

  useEffect(() => {
    if (!currentLocation || !nearestBushland) {
      return;
    }

    const [west, south, east, north] = nearestBushland.bounds;
    const visibleBounds = latLngBounds([
      [south, west],
      [north, east],
    ]);
    visibleBounds.extend([currentLocation.latitude, currentLocation.longitude]);
    map.fitBounds(visibleBounds, {
      animate: true,
      maxZoom: 13,
      paddingBottomRight: [48, 230],
      paddingTopLeft: [48, 48],
    });
  }, [currentLocation, map, nearestBushland]);

  useEffect(() => {
    if (event) {
      map.panInside(event.position, CARD_OPEN_BOUNDS_OPTIONS);
    }
  }, [event, map]);

  function showAllEvents() {
    if (events.length > 0) {
      map.fitBounds(
        latLngBounds(events.map((mapEvent) => mapEvent.position)),
        EVENT_BOUNDS_OPTIONS,
      );
    }
  }

  function locateUser() {
    onClose();
    onLocationStatusChange("locating");
    map.locate({
      enableHighAccuracy: true,
      maximumAge: 30_000,
      setView: false,
      timeout: 10_000,
    });
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[1000] flex flex-col justify-between px-[18px] py-3">
      <div className="flex items-start justify-between">
        <button
          className="pointer-events-auto flex h-9 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
          onClick={showAllEvents}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={14} strokeWidth={1.8} />
          Sightings &amp; events
        </button>

        <button
          aria-label="Find my location"
          aria-busy={locationStatus === "locating"}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-primary shadow-sm transition-colors hover:bg-accent disabled:cursor-wait disabled:opacity-70"
          disabled={locationStatus === "locating"}
          onClick={locateUser}
          type="button"
        >
          <LocateFixed
            aria-hidden="true"
            className={locationStatus === "locating" ? "animate-pulse" : ""}
            size={17}
            strokeWidth={1.7}
          />
        </button>
      </div>

      {event ? (
        <article className="pointer-events-auto relative rounded-lg border border-border bg-card p-4 text-card-foreground shadow-lg md:max-w-[380px]">
          <CloseButton onClose={onClose} />
          <div className="mb-2 flex items-center justify-between pr-8 text-xs">
            <span className="rounded-full bg-[#F0B400] px-2 py-1 font-medium text-[#1F2933]">
              {event.dateLabel}
            </span>
            <span className="font-medium text-muted-foreground">
              {event.availability}
            </span>
          </div>
          <h2 className="text-lg font-semibold leading-tight">{event.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {event.timeLabel} · {event.venue}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {event.address}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {event.summary}
          </p>
          <a
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#234D3B] text-xs font-medium !text-white transition-colors hover:bg-[#1B3D2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href={event.href}
            rel="noreferrer"
            target="_blank"
          >
            View event details
            <ExternalLink aria-hidden="true" size={12} />
          </a>
        </article>
      ) : bushland ? (
        <article className="pointer-events-auto relative rounded-lg border border-border bg-card p-4 text-card-foreground shadow-lg md:max-w-[380px]">
          <CloseButton onClose={onClose} />
          <span className="inline-flex rounded-full bg-[#234D3B] px-2 py-1 text-xs font-medium text-white">
            BUSH FOREVER SITE {bushland.bf_sites}
          </span>
          <h2 className="mt-2 pr-8 text-lg font-semibold leading-tight">
            {bushland.name}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {bushland.description}
          </p>
          {bushland.distanceMetres !== undefined ? (
            <p className="mt-2 text-xs font-semibold text-[#234D3B]">
              {formatBushlandDistance(bushland.distanceMetres)}
            </p>
          ) : null}
          {bushland.bf_mod ? (
            <p className="mt-2 text-xs font-medium text-[#234D3B]">
              {bushland.bf_mod}
            </p>
          ) : null}
          <a
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[#234D3B] text-xs font-medium !text-[#234D3B] transition-colors hover:bg-[#234D3B]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href={bushland.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            View data source
            <ExternalLink aria-hidden="true" size={12} />
          </a>
        </article>
      ) : null}
    </div>
  );
}

type CloseButtonProps = {
  onClose: () => void;
};

function CloseButton({ onClose }: CloseButtonProps) {
  return (
    <button
      aria-label="Close details"
      className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      onClick={onClose}
      type="button"
    >
      <X aria-hidden="true" size={15} />
    </button>
  );
}

export default function BushlandMap({
  nearestBushland,
  onLocationChange,
  onLocationStatusChange,
}: BushlandMapProps) {
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [selectedBushland, setSelectedBushland] =
    useState<BushlandProperties | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);
  const [locationStatus, setLocationStatus] =
    useState<GeolocationStatus>("idle");
  const { data } = useEvents();
  const events = useMemo(() => data?.events ?? [], [data?.events]);

  useEffect(() => {
    if (!nearestBushland) {
      return;
    }

    const [west, south, east, north] = nearestBushland.bounds;
    const distanceMetres = currentLocation
      ? distanceFromLocationToBounds(
          currentLocation,
          latLngBounds([
            [south, west],
            [north, east],
          ]),
        )
      : undefined;
    setSelectedEvent(null);
    setSelectedBushland({ ...nearestBushland, distanceMetres });
  }, [currentLocation, nearestBushland]);

  function selectEvent(event: MapEvent) {
    setSelectedBushland(null);
    setSelectedEvent(event);
  }

  function selectBushland(bushland: BushlandProperties) {
    setSelectedEvent(null);
    setSelectedBushland(bushland);
  }

  function closeDetails() {
    setSelectedEvent(null);
    setSelectedBushland(null);
  }

  function updateLocationStatus(status: GeolocationStatus) {
    setLocationStatus(status);
    onLocationStatusChange(status);
  }

  function updateLocation(location: CurrentLocation) {
    setCurrentLocation(location);
    setLocationStatus("found");
    onLocationChange(location);
    onLocationStatusChange("found");
  }

  return (
    <MapContainer
      center={PERTH_CENTRE}
      className={`field-map h-full w-full ${
        selectedEvent || selectedBushland ? "field-map--card-open" : ""
      }`}
      scrollWheelZoom
      zoom={10}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BushlandAreas
        currentLocation={currentLocation}
        onSelectBushland={selectBushland}
        selectedObjectId={selectedBushland?.objectid}
      />
      <MapMarkers
        events={events}
        onSelectEvent={selectEvent}
        selectedEventId={selectedEvent?.id}
      />
      {currentLocation ? (
        <CurrentLocationMarker location={currentLocation} />
      ) : null}
      <MapOverlay
        bushland={selectedBushland}
        currentLocation={currentLocation}
        event={selectedEvent}
        events={events}
        locationStatus={locationStatus}
        nearestBushland={nearestBushland}
        onClose={closeDetails}
        onLocationFound={updateLocation}
        onLocationStatusChange={updateLocationStatus}
      />
    </MapContainer>
  );
}
