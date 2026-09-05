export type MapEvent = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  address: string;
  summary: string;
  availability: string;
  href: string;
  position: [number, number];
};

// Add or remove events here. The map markers and event card update automatically.
export const MAP_EVENTS: MapEvent[] = [
  {
    id: "seed-genetics-and-restoration",
    title: "Seed Genetics and Restoration",
    dateLabel: "WED 23 SEP",
    timeLabel: "18:00–20:00",
    venue: "City West Lotteries House",
    address: "2 Delhi Street, West Perth",
    summary:
      "Learn how seed genetics and diversity contribute to successful restoration projects.",
    availability: "Free · 37 spots left",
    href: "https://www.bushlandperth.org.au/event/seed-genetics-and-restoration/#rsvp-now",
    position: [-31.94564, 115.84648],
  },
  {
    id: "step-into-the-gosnells-bush",
    title: "Step into the Gosnells Bush",
    dateLabel: "SUN 27 SEP",
    timeLabel: "10:00–12:00",
    venue: "Connect@Kenwick",
    address: "84 Kenwick Road, Kenwick",
    summary:
      "Discover why caring for local bushland matters for native plants and animals.",
    availability: "Free · 26 spots left",
    href: "https://www.bushlandperth.org.au/event/step-into-the-gosnells-bush/#rsvp-now",
    position: [-32.0355, 115.9781],
  },
];
