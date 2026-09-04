import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import api from "@/lib/api";

export interface WeedCandidate {
  common_name: string;
  scientific_name: string;
  confidence: number;
}

export interface IdentifyResponse {
  top_id: string | null;
  candidates: WeedCandidate[];
}

export const useUploadWeedImage = (
  args?: Omit<
    UseMutationOptions<IdentifyResponse, unknown, File>,
    "mutationFn"
  >,
) => {
  return useMutation({
    ...args,
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("image", file);
      return api
        .post<IdentifyResponse>("/weeds/identify/", form)
        .then((res) => res.data);
    },
  });
};
