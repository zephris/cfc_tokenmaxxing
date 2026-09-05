import type { EventFixture } from "@/types/events";

/**
 * Static/seeded demo events per issue #4's MVP scope ("this may be limited
 * to displaying static or seeded demonstration events"). No event
 * creation/administration or backend persistence — that's future work
 * blocked on an IAM system.
 */
export const EVENT_FIXTURES: EventFixture[] = [
  {
    slug: "bold-park-morning-hike",
    title: "Bold Park Morning Hike",
    date: "2026-09-12",
    startTime: "8:00 AM",
    endTime: "11:00 AM",
    locationName: "Camel Lake, Bold Park",
    locationDetail: "Meet at the Perry Lakes Drive trailhead",
    host: "Bold Park restoration team",
    description:
      "Walk the lakeside trail with local ecologists, learn to spot bridal creeper and help record priority sightings. Gloves, field guides and morning tea are provided.",
    attendeeCount: 14,
    capacity: 26,
    latitude: -31.9505,
    longitude: 115.7615,
    bushlandSlug: "bold-park",
  },
];

export function findEventBySlug(slug: string): EventFixture | undefined {
  return EVENT_FIXTURES.find((event) => event.slug === slug);
}
