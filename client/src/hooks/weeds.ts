import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import axios from "axios";

import api from "@/lib/api";
import { getMockWeedIdentification } from "@/lib/weeds-mock";
import type { WeedIdentificationResponse } from "@/types/weeds";

export interface IdentifyWeedVariables {
  image: File;
  latitude?: number;
  longitude?: number;
}

/**
 * Backend for `POST /api/weeds/identify/` (issue #9) isn't implemented yet.
 * In non-production builds, if the real request can't reach the server at
 * all (network error / connection refused — not a 4xx/5xx from a server
 * that's actually there), fall back to a typed dev fixture so the capture →
 * results flow can be built and demoed end-to-end. This never triggers in a
 * production build, and can be explicitly disabled in dev by setting
 * `NEXT_PUBLIC_WEED_MOCK_FALLBACK=false`.
 */
const MOCK_FALLBACK_ENABLED =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_WEED_MOCK_FALLBACK !== "false";

const USE_MOCK =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_USE_WEED_MOCK === "true";

function isBackendUnreachable(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

export const useIdentifyWeed = (
  args?: Omit<
    UseMutationOptions<
      WeedIdentificationResponse,
      unknown,
      IdentifyWeedVariables
    >,
    "mutationFn"
  >,
) => {
  return useMutation({
    ...args,
    mutationFn: async ({
      image,
      latitude,
      longitude,
    }: IdentifyWeedVariables) => {
      if (USE_MOCK) {
        return getMockWeedIdentification();
      }

      const formData = new FormData();
      formData.append("image", image);
      if (latitude !== undefined) formData.append("latitude", String(latitude));
      if (longitude !== undefined)
        formData.append("longitude", String(longitude));

      try {
        const res = await api.post<WeedIdentificationResponse>(
          "/weeds/identify/",
          formData,
        );
        return res.data;
      } catch (error) {
        if (MOCK_FALLBACK_ENABLED && isBackendUnreachable(error)) {
          console.warn(
            "[weeds] POST /api/weeds/identify/ is unreachable — serving the development mock response (issue #9 backend not implemented yet). Set NEXT_PUBLIC_WEED_MOCK_FALLBACK=false to disable this fallback.",
          );
          return getMockWeedIdentification();
        }
        throw error;
      }
    },
  });
};
