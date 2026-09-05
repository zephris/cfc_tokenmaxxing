import { latLngBounds } from "leaflet";
import { ExternalLink, LocateFixed, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { MAP_EVENTS, type MapEvent } from "@/config/map-events";
import { useBushlands } from "@/hooks/bushlands";

const PERTH_CENTRE: [number, number] = [-31.953, 115.857];
const INITIAL_BOUNDS: [number, number, number, number] = [
  115.65, -32.15, 116.05, -31.75,
];
const EVENT_BOUNDS = latLngBounds(
  MAP_EVENTS.map((mapEvent) => mapEvent.position),
);
const EVENT_BOUNDS_OPTIONS = {
  paddingTopLeft: [48, 48] as [number, number],
  paddingBottomRight: [48, 48] as [number, number],
};
const CARD_OPEN_BOUNDS_OPTIONS = {
  paddingTopLeft: [48, 48] as [number, number],
  paddingBottomRight: [48, 230] as [number, number],
};

function BushlandAreas() {
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
      key={bbox.join(",")}
      style={{
        color: "#084c35",
        fillColor: "#54c978",
        fillOpacity: 0.38,
        opacity: 1,
        weight: 2.25,
      }}
    />
  ) : null;
}

type MapMarkersProps = {
  selectedEventId?: string;
  onSelectEvent: (event: MapEvent) => void;
};

function MapMarkers({ selectedEventId, onSelectEvent }: MapMarkersProps) {
  return (
    <>
      {MAP_EVENTS.map((event) => {
        const selected = event.id === selectedEventId;

        return (
          <CircleMarker
            center={event.position}
            eventHandlers={{ click: () => onSelectEvent(event) }}
            fillColor={selected ? "#f6bd00" : "#174c3b"}
            fillOpacity={1}
            key={event.id}
            pathOptions={{ color: "#ffffff", weight: 3 }}
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
  event: MapEvent | null;
  onClose: () => void;
};

function MapOverlay({ event, onClose }: MapOverlayProps) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(EVENT_BOUNDS, EVENT_BOUNDS_OPTIONS);
  }, [map]);

  useEffect(() => {
    if (event) {
      map.panInside(event.position, CARD_OPEN_BOUNDS_OPTIONS);
    }
  }, [event, map]);

  function showAllEvents() {
    map.fitBounds(EVENT_BOUNDS, EVENT_BOUNDS_OPTIONS);
  }

  function locateUser() {
    map.locate({ enableHighAccuracy: true, maxZoom: 15, setView: true });
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[1000] flex flex-col justify-between px-[18px] py-3">
      <div className="flex items-start justify-between">
        <button
          className="pointer-events-auto flex h-9 items-center gap-2 rounded-full bg-white px-3 text-[11px] font-semibold text-[#17211d] shadow-sm ring-1 ring-black/5"
          onClick={showAllEvents}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={14} strokeWidth={1.8} />
          Sightings &amp; events
        </button>

        <button
          aria-label="Find my location"
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white text-[#245b48] shadow-sm ring-1 ring-black/5"
          onClick={locateUser}
          type="button"
        >
          <LocateFixed aria-hidden="true" size={17} strokeWidth={1.7} />
        </button>
      </div>

      {event ? (
        <article className="pointer-events-auto relative rounded-[18px] bg-white p-4 text-[#17211d] shadow-[0_8px_24px_rgba(35,56,45,0.14)] md:max-w-[380px]">
          <button
            aria-label="Close event details"
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-[#626a66] transition-colors hover:bg-[#edf0eb]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={15} />
          </button>
          <div className="mb-2 flex items-center justify-between pr-8 text-[9px]">
            <span className="rounded-full bg-[#fff0a8] px-2 py-1 font-bold text-[#6a5800]">
              {event.dateLabel}
            </span>
            <span className="font-medium text-[#50685d]">
              {event.availability}
            </span>
          </div>
          <h2 className="text-[17px] font-bold leading-tight">{event.title}</h2>
          <p className="mt-1 text-[10px] text-[#626a66]">
            {event.timeLabel} · {event.venue}
          </p>
          <p className="mt-1 text-[10px] leading-[1.35] text-[#626a66]">
            {event.address}
          </p>
          <p className="mt-1 line-clamp-2 text-[10px] leading-[1.35] text-[#626a66]">
            {event.summary}
          </p>
          <a
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-full bg-[#245b48] text-[10px] font-semibold !text-white transition-colors hover:bg-[#174c3b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245b48]"
            href={event.href}
            rel="noreferrer"
            target="_blank"
          >
            RSVP now
            <ExternalLink aria-hidden="true" size={12} />
          </a>
        </article>
      ) : null}
    </div>
  );
}

export default function BushlandMap() {
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);

  return (
    <MapContainer
      center={PERTH_CENTRE}
      className={`field-map h-full w-full ${
        selectedEvent ? "field-map--card-open" : ""
      }`}
      scrollWheelZoom
      zoom={10}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BushlandAreas />
      <MapMarkers
        onSelectEvent={setSelectedEvent}
        selectedEventId={selectedEvent?.id}
      />
      <MapOverlay
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </MapContainer>
  );
}
