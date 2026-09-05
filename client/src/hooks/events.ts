import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

export type MapEvent = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  address: string;
  summary: string;
  availability: string;
  imagePath: string;
  href: string;
  position: [number, number];
};

type EventsResponse = {
  events: MapEvent[];
};

export const useEvents = () =>
  useQuery({
    queryKey: ["events"],
    queryFn: () =>
      api.get<EventsResponse>("/events/").then((response) => response.data),
    staleTime: 5 * 60 * 1000,
  });

export const useEvent = (id: string) =>
  useQuery({
    queryKey: ["events", id],
    queryFn: () =>
      api.get<MapEvent>(`/events/${id}/`).then((response) => response.data),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
