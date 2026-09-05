import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";

import api from "@/lib/api";

export type BushlandProperties = {
  objectid: number;
  bf_sites: number | null;
  bf_mod: string | null;
  name: string;
  description: string;
  sourceUrl: string;
  distanceMetres?: number;
};

export type BushlandCollection = FeatureCollection<
  Polygon | MultiPolygon,
  BushlandProperties
>;

export type NearestBushland = BushlandProperties & {
  siteNumber: number | null;
  bounds: [number, number, number, number];
};

export type NearbyBushland = {
  objectid: number;
  siteNumber: number;
  name: string;
  description: string;
  sourceUrl: string;
  distance: number;
};

type LocationCoordinates = {
  latitude: number;
  longitude: number;
};

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

export const useNearestBushland = (location: LocationCoordinates | null) =>
  useQuery({
    queryKey: ["bushlands", "nearest", location],
    queryFn: () => {
      if (!location) {
        throw new Error("A current location is required");
      }

      return api
        .get<NearestBushland>("/bushlands/nearest/", {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        })
        .then((response) => response.data);
    },
    enabled: Boolean(location),
    staleTime: 5 * 60 * 1000,
  });

export const useNearbyBushlands = (location: LocationCoordinates | null) =>
  useQuery({
    queryKey: ["bushlands", "nearby", location],
    queryFn: () =>
      api
        .get<{ results: NearbyBushland[] }>("/bushlands/nearby/", {
          params: { ...location, limit: 4 },
        })
        .then((response) => response.data.results),
    enabled: Boolean(location),
    staleTime: 5 * 60 * 1000,
  });
