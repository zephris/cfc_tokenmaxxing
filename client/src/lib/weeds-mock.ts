import type { WeedIdentificationResponse } from "@/types/weeds";

/**
 * Development-only fixtures standing in for `POST /api/weeds/identify/`
 * (issue #9) while the Django/WeedScan integration isn't implemented yet.
 *
 * These are only ever invoked from `useIdentifyWeed`'s explicit fallback
 * (`client/src/hooks/weeds.ts`), and only when that fallback is enabled — see
 * that file for the conditions. UI code should never import these directly.
 */

const DISCLAIMER =
  "This identification is AI-generated and provided as a suggestion only. It is not a definitive identification — please verify with a qualified person before acting on it.";

/** A typical two-candidate result, including one low-confidence candidate and one with a full WeedScan profile. */
export function getMockWeedIdentification(): WeedIdentificationResponse {
  return {
    request_id: "mock-request-id",
    model_id: "mock-model-v0",
    top_id: "mock-top-id",
    disclaimer: DISCLAIMER,
    is_mock: true,
    candidates: [
      {
        rank: 1,
        common_name: "Arum Lily",
        scientific_name: "Zantedeschia aethiopica",
        family: "Araceae",
        confidence: 0.87,
        confidence_level: "high",
        reference_images: [],
        reference_links: [
          { label: "WeedScan profile", url: "https://www.weedscan.org.au/" },
          {
            label: "Wikipedia",
            url: "https://en.wikipedia.org/wiki/Zantedeschia_aethiopica",
          },
        ],
        weedscan_profile: {
          description:
            "A perennial herb with large white funnel-shaped flowers, widely naturalised in damp bushland and drainage lines across south-west WA.",
          plant_form: "Perennial herb to 1m, growing from a rhizome",
          leaves: "Large, glossy, dark green, arrow-shaped",
          flowers: "Large white spathe surrounding a yellow spadix",
          distinguishing_features:
            "Waxy white funnel-shaped flower and glossy arrow-shaped leaves distinguish it from native lookalikes",
          habitat: "Damp bushland, creek lines and drainage areas",
          ecological_impacts:
            "Forms dense stands that crowd out native groundcover; toxic to livestock and pets",
          profile_url: "https://www.weedscan.org.au/",
        },
      },
      {
        rank: 2,
        common_name: "Watsonia",
        scientific_name: "Watsonia meriana",
        family: "Iridaceae",
        confidence: 0.34,
        confidence_level: "low",
        reference_images: [],
        reference_links: [],
        weedscan_profile: null,
      },
    ],
  };
}

/** No confident match — exercises the "unknown plant" UI state. */
export function getMockUnknownWeedIdentification(): WeedIdentificationResponse {
  return {
    request_id: "mock-request-id-unknown",
    model_id: "mock-model-v0",
    top_id: null,
    disclaimer: DISCLAIMER,
    is_mock: true,
    candidates: [],
  };
}
