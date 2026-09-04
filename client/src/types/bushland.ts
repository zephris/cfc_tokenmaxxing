/**
 * Bushland domain types for issues #3 (Explore/search) and #7 (Ecology
 * Profile). Backed entirely by fixture data for now — see
 * `client/src/lib/bushland-fixtures.ts`. "Source for detailed flora/fauna
 * has not yet been confirmed" per AGENTS.md, so every consumer of this data
 * must present it as demonstration content, not an authoritative survey.
 */

export type InvasiveSpeciesPriority = "high" | "monitor" | "contained";

export interface ReportedInvasiveSpecies {
  commonName: string;
  scientificName: string;
  sightings: number;
  priority: InvasiveSpeciesPriority;
  /** ISO date string of the most recent demo sighting update. */
  updatedAt: string;
}

export interface BushlandDataSource {
  label: string;
  url?: string;
}

export interface BushlandProfile {
  slug: string;
  name: string;
  suburb: string;
  areaHectares: number;
  habitatTags: string[];
  latitude: number;
  longitude: number;
  summary: string;
  ecologicalCommunities: string[];
  nativeFloraHighlights: string[];
  nativeFaunaHighlights: string[];
  reportedSpecies: ReportedInvasiveSpecies[];
  dataSources: BushlandDataSource[];
  /** Explicit statement of how current/authoritative this fixture content is. */
  dataCurrencyNote: string;
}
