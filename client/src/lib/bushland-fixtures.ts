import type { BushlandProfile } from "@/types/bushland";

/**
 * Demonstration bushland content for issues #3 (Explore) and #7 (Ecology
 * Profile). These are real WA place names used as recognisable labels, but
 * the descriptions, habitat tags, species lists and sighting counts below
 * are illustrative placeholders for this hackathon demo — not sourced from
 * an official survey. "Source for detailed flora/fauna has not yet been
 * confirmed" per AGENTS.md; do not present this as authoritative data.
 *
 * Once the interactive map (issues #5/#6) and a real ecology data source
 * exist, this fixture list should be replaced entirely.
 */

const DATA_CURRENCY_NOTE =
  "This is demonstration content for a hackathon prototype, not an official survey. Bush Forever boundary data (where referenced) is a 2000 snapshot and may not reflect current mapping.";

export const BUSHLAND_FIXTURES: BushlandProfile[] = [
  {
    slug: "bold-park",
    name: "Bold Park",
    suburb: "City Beach, WA",
    areaHectares: 437,
    habitatTags: ["Banksia woodland", "Coastal heath"],
    latitude: -31.9505,
    longitude: 115.7615,
    summary:
      "One of Perth's largest remaining bushland reserves, running from City Beach down to the coast, with walking trails through Banksia woodland and coastal heath.",
    ecologicalCommunities: [
      "Banksia woodland (demo classification)",
      "Coastal heath (demo classification)",
    ],
    nativeFloraHighlights: ["Banksia species (demo)", "Coastal wattle (demo)"],
    nativeFaunaHighlights: ["Honeyeaters (demo)", "Bobtail lizards (demo)"],
    reportedSpecies: [
      {
        commonName: "Bridal creeper",
        scientificName: "Asparagus asparagoides",
        sightings: 18,
        priority: "high",
        updatedAt: "2026-08-30",
      },
      {
        commonName: "Blackberry",
        scientificName: "Rubus fruticosus",
        sightings: 7,
        priority: "monitor",
        updatedAt: "2026-08-27",
      },
      {
        commonName: "Boneseed",
        scientificName: "Chrysanthemoides monilifera",
        sightings: 4,
        priority: "contained",
        updatedAt: "2026-08-20",
      },
    ],
    dataSources: [
      { label: "Demo content — not an official survey" },
      { label: "Wikipedia (general background only, not authoritative)" },
    ],
    dataCurrencyNote: DATA_CURRENCY_NOTE,
  },
  {
    slug: "kings-park",
    name: "Kings Park",
    suburb: "Perth, WA",
    areaHectares: 400,
    habitatTags: ["Kwongan heathland", "Riparian"],
    latitude: -31.9598,
    longitude: 115.8419,
    summary:
      "A large parkland and bushland reserve overlooking the Swan River, combining botanic gardens with remnant native bushland.",
    ecologicalCommunities: ["Kwongan heathland (demo classification)"],
    nativeFloraHighlights: ["Kangaroo paw (demo)", "Grass trees (demo)"],
    nativeFaunaHighlights: ["Splendid fairywren (demo)"],
    reportedSpecies: [
      {
        commonName: "Watsonia",
        scientificName: "Watsonia meriana",
        sightings: 5,
        priority: "monitor",
        updatedAt: "2026-08-22",
      },
    ],
    dataSources: [{ label: "Demo content — not an official survey" }],
    dataCurrencyNote: DATA_CURRENCY_NOTE,
  },
  {
    slug: "bibra-lake",
    name: "Bibra Lake Reserve",
    suburb: "Bibra Lake, WA",
    areaHectares: 80,
    habitatTags: ["Wetland", "Melaleuca woodland"],
    latitude: -32.0904,
    longitude: 115.828,
    summary:
      "A wetland reserve around Bibra Lake with fringing Melaleuca woodland, popular for birdwatching and walking.",
    ecologicalCommunities: ["Melaleuca woodland (demo classification)"],
    nativeFloraHighlights: ["Melaleuca species (demo)"],
    nativeFaunaHighlights: ["Waterbirds (demo)"],
    reportedSpecies: [
      {
        commonName: "Arum lily",
        scientificName: "Zantedeschia aethiopica",
        sightings: 11,
        priority: "high",
        updatedAt: "2026-08-29",
      },
    ],
    dataSources: [{ label: "Demo content — not an official survey" }],
    dataCurrencyNote: DATA_CURRENCY_NOTE,
  },
];

/** Sentinel value for "I'm not sure which listed bushland this is, or it's outside them". */
export const UNSURE_BUSHLAND_ID = "unsure" as const;

export function findBushlandBySlug(slug: string): BushlandProfile | undefined {
  return BUSHLAND_FIXTURES.find((b) => b.slug === slug);
}
