import { MapContainer, TileLayer } from "react-leaflet";

const PERTH_CENTRE: [number, number] = [-31.953, 115.857];

export default function BushlandMap() {
  return (
    <MapContainer
      center={PERTH_CENTRE}
      className="h-full w-full"
      scrollWheelZoom
      zoom={11}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}
