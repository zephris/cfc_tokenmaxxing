/**
 * Event domain types for issue #4's frontend. Fixture-backed only — no
 * event creation/administration or real RSVP persistence in this MVP.
 */

export interface EventFixture {
  slug: string;
  title: string;
  /** ISO date string, e.g. "2026-09-12". */
  date: string;
  startTime: string;
  endTime: string;
  locationName: string;
  locationDetail: string;
  host: string;
  description: string;
  attendeeCount: number;
  capacity: number;
  latitude: number;
  longitude: number;
  /** Links back to the bushland this event is associated with. */
  bushlandSlug: string;
}
