import { latLngBounds } from "leaflet";
import { ExternalLink, LocateFixed, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { type BushlandProperties, useBushlands } from "@/hooks/bushlands";
import { type MapEvent, useEvents } from "@/hooks/events";

const PERTH_CENTRE: [number, number] = [-31.953, 115.857];
const INITIAL_BOUNDS: [number, number, number, number] = [
  115.65, -32.15, 116.05, -31.75,
];
const EVENT_COLOUR = "#F0B400";
const BUSHLAND_COLOUR = "#234D3B";
const EVENT_BOUNDS_OPTIONS = {
  paddingTopLeft: [48, 48] as [number, number],
  paddingBottomRight: [48, 48] as [number, number],
};
const CARD_OPEN_BOUNDS_OPTIONS = {
  paddingTopLeft: [48, 48] as [number, number],
  paddingBottomRight: [48, 230] as [number, number],
};

type BushlandAreasProps = {
  selectedObjectId?: number;
  onSelectBushland: (bushland: BushlandProperties) => void;
};

function BushlandAreas({
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
      key={`${bbox.join(",")}-${selectedObjectId ?? "none"}`}
      onEachFeature={(feature, layer) => {
        const properties = feature.properties as BushlandProperties;
        layer.bindTooltip(properties.name, { direction: "top", sticky: true });
        layer.on("click", () => onSelectBushland(properties));
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

type MapOverlayProps = {
  events: MapEvent[];
  event: MapEvent | null;
  bushland: BushlandProperties | null;
  onClose: () => void;
};

function MapOverlay({ events, event, bushland, onClose }: MapOverlayProps) {
  const map = useMap();

  useEffect(() => {
    if (events.length > 0) {
      map.fitBounds(
        latLngBounds(events.map((mapEvent) => mapEvent.position)),
        EVENT_BOUNDS_OPTIONS,
      );
    }
  }, [events, map]);

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
    map.locate({ enableHighAccuracy: true, maxZoom: 15, setView: true });
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
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-primary shadow-sm transition-colors hover:bg-accent"
          onClick={locateUser}
          type="button"
        >
          <LocateFixed aria-hidden="true" size={17} strokeWidth={1.7} />
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

export default function BushlandMap() {
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [selectedBushland, setSelectedBushland] =
    useState<BushlandProperties | null>(null);
  const { data } = useEvents();
  const events = useMemo(() => data?.events ?? [], [data?.events]);

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
        onSelectBushland={selectBushland}
        selectedObjectId={selectedBushland?.objectid}
      />
      <MapMarkers
        events={events}
        onSelectEvent={selectEvent}
        selectedEventId={selectedEvent?.id}
      />
      <MapOverlay
        bushland={selectedBushland}
        event={selectedEvent}
        events={events}
        onClose={closeDetails}
      />
    </MapContainer>
  );
}
