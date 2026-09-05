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
