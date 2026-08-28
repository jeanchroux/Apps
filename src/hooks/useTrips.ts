import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mockTrips } from "@/lib/mockData";
import type { Trip } from "@/types/database.types";

export function useTrips() {
  return useQuery({
    queryKey: ["trips"],
    queryFn: async (): Promise<Trip[]> => {
      if (!isSupabaseConfigured) return mockTrips;

      const { data, error } = await supabase.from("trips").select("*").order("start_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trip: Pick<Trip, "destination_city_id" | "start_date" | "end_date" | "label">) => {
      if (!isSupabaseConfigured) return;

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be signed in to add a trip.");

      const { error } = await supabase.from("trips").insert({ ...trip, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips"] })
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from("trips").delete().eq("id", tripId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trips"] })
  });
}

/** True if `date` falls within [trip.start_date, trip.end_date] inclusive. */
export function isDateWithinTrip(date: Date, trip: Trip): boolean {
  const d = date.toISOString().slice(0, 10);
  return d >= trip.start_date && d <= trip.end_date;
}
