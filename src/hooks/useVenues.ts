import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mockVenues } from "@/lib/mockData";
import type { VenueWithPreference } from "@/types/database.types";

/**
 * Venues grouped by the current user's toggle state. Reads from the
 * `venues_with_preference` view (see migration 0001) which left-joins
 * user_venue_preferences and defaults to venues.is_active_default when the
 * user has never toggled a given venue.
 */
export function useVenues(cityId?: string) {
  return useQuery({
    queryKey: ["venues", cityId],
    queryFn: async (): Promise<VenueWithPreference[]> => {
      if (!isSupabaseConfigured) {
        return mockVenues
          .filter((v) => !cityId || v.city_id === cityId)
          .map((v) => ({ ...v, is_enabled_for_user: v.is_active_default }));
      }

      let query = supabase.from("venues_with_preference").select("*").order("name", { ascending: true });
      if (cityId) query = query.eq("city_id", cityId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as VenueWithPreference[];
    }
  });
}

export function useToggleVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ venueId, isEnabled }: { venueId: string; isEnabled: boolean }) => {
      if (!isSupabaseConfigured) return; // demo mode: optimistic update only

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be signed in to toggle a venue.");

      const { error } = await supabase
        .from("user_venue_preferences")
        .upsert({ user_id: user.id, venue_id: venueId, is_enabled: isEnabled }, { onConflict: "user_id,venue_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  });
}
