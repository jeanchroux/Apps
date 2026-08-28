import { useQuery } from "@tanstack/react-query";
import { addMonths } from "date-fns";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mockEvents } from "@/lib/mockData";
import type { EventWithVenue } from "@/types/database.types";

export type EventFilters = {
  /** Restrict to these city ids (e.g. home city + active trip destinations). */
  cityIds?: string[];
  /** Restrict to an explicit date window — used by trip-filtered feeds. */
  startDate?: Date;
  endDate?: Date;
  lgbtqOnly?: boolean;
  minQualityScore?: number;
};

/**
 * The core "12-month lookahead" feed. Always bounded to [now, now+12mo]
 * unless a narrower trip window is supplied. Respects each venue's
 * per-user enabled/disabled toggle via the venues_with_preference view.
 */
export function useEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: async (): Promise<EventWithVenue[]> => {
      if (!isSupabaseConfigured) {
        return filterMockEvents(filters);
      }

      const now = new Date();
      const rangeStart = (filters.startDate ?? now).toISOString();
      const rangeEnd = (filters.endDate ?? addMonths(now, 12)).toISOString();

      let query = supabase
        .from("events")
        .select("*, venue:venues!inner(*)")
        .gte("start_at", rangeStart)
        .lte("start_at", rangeEnd)
        .order("start_at", { ascending: true });

      if (filters.cityIds?.length) {
        query = query.in("venue.city_id", filters.cityIds);
      }
      if (filters.lgbtqOnly) {
        query = query.eq("is_lgbtq_friendly", true);
      }
      if (filters.minQualityScore != null) {
        query = query.gte("quality_score", filters.minQualityScore);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as EventWithVenue[];
    }
  });
}

function filterMockEvents(filters: EventFilters): EventWithVenue[] {
  return mockEvents.filter((e) => {
    if (filters.cityIds?.length && !filters.cityIds.includes(e.venue.city_id)) return false;
    if (filters.lgbtqOnly && !e.is_lgbtq_friendly) return false;
    if (filters.minQualityScore != null && (e.quality_score ?? 0) < filters.minQualityScore) return false;
    if (filters.startDate && new Date(e.start_at) < filters.startDate) return false;
    if (filters.endDate && new Date(e.start_at) > filters.endDate) return false;
    return true;
  });
}
