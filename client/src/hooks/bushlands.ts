import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";

import api from "@/lib/api";

export type BushlandProperties = {
  objectid: number;
  bf_sites: number | null;
  bf_mod: string | null;
};

export type BushlandCollection = FeatureCollection<
  Polygon | MultiPolygon,
  BushlandProperties
>;

export const useBushlands = (bbox: [number, number, number, number]) =>
  useQuery({
    queryKey: ["bushlands", bbox.join(",")],
    queryFn: () =>
      api
        .get<BushlandCollection>("/bushlands/", {
          params: { bbox: bbox.join(",") },
        })
        .then((response) => response.data),
    staleTime: 5 * 60 * 1000,
  });
