/**
 * Frontend contract for `POST /api/weeds/identify/` (issue #9).
 *
 * The Django/WeedScan integration behind this endpoint doesn't exist yet, so
 * this shape is derived from the "expected response" fields listed against
 * issue #9: request identifier, model identifier, ranked candidate species,
 * common/scientific names, family, confidence + confidence level, WeedScan
 * profile information, reference images, reference links and a disclaimer.
 *
 * Field names use snake_case to match Django REST Framework's default JSON
 * rendering. If the real backend ends up using a different casing or shape,
 * this file (and `weeds-mock.ts`) is the only place that needs to change.
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
  /** Empty array represents "no confident match" (unknown plant). */
  candidates: WeedCandidate[];
  disclaimer: string;
  /**
   * Present only when `useIdentifyWeed`'s development mock fallback served
   * this response because the backend was unreachable (see
   * `client/src/lib/weeds-mock.ts`). Real backend responses never include
   * this field.
   */
  is_mock?: boolean;
}
