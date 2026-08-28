import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mockCities } from "@/lib/mockData";
import type { City } from "@/types/database.types";

export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async (): Promise<City[]> => {
      if (!isSupabaseConfigured) return mockCities;

      const { data, error } = await supabase.from("cities").select("*").order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
  });
}
