/**
 * Frontend contract for `POST /api/weeds/identify/` (issue #9).
 *
 * The backend forwards the image to WeedScan Identify1 and returns this shape.
 * Profile and reference fields remain empty until enrichment is implemented.
 *
 * Field names use snake_case to match Django REST Framework's JSON response.
 */

export type WeedConfidenceLevel = "high" | "medium" | "low";

export interface WeedReferenceLink {
  label: string;
  url: string;
}

/**
 * Additional reference information sourced from WeedScan/CISS for a given
 * candidate. Any field may be absent — the backend may not have full profile
 * data for every species, and `weedscan_profile` itself may be `null`.
 */
export interface WeedScanProfile {
  description?: string;
  plant_form?: string;
  leaves?: string;
  flowers?: string;
  distinguishing_features?: string;
  habitat?: string;
  ecological_impacts?: string;
  profile_url?: string;
}

export interface WeedCandidate {
  rank: number;
  common_name: string;
  scientific_name: string;
  family: string;
  /** 0–1 */
  confidence: number;
  confidence_level: WeedConfidenceLevel;
  reference_images: string[];
  reference_links: WeedReferenceLink[];
  weedscan_profile: WeedScanProfile | null;
}

export interface WeedIdentificationResponse {
  request_id: string;
  model_id: string;
  top_id: string | null;
  /** Empty array represents "no confident match" (unknown plant). */
  candidates: WeedCandidate[];
  disclaimer: string;
}
