import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import api from "@/lib/api";
import type { WeedIdentificationResponse } from "@/types/weeds";

export interface IdentifyWeedVariables {
  image: File;
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
    mutationFn: async ({ image }: IdentifyWeedVariables) => {
      const formData = new FormData();
      formData.append("image", image);

      const res = await api.post<WeedIdentificationResponse>(
        "/weeds/identify/",
        formData,
      );
      return res.data;
    },
  });
};
