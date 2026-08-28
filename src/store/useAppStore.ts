import { create } from "zustand";

type AppState = {
  homeCityId: string | null;
  setHomeCityId: (id: string | null) => void;

  lgbtqOnly: boolean;
  toggleLgbtqOnly: () => void;

  minQualityScore: number;
  setMinQualityScore: (score: number) => void;
};

/**
 * Lightweight client-side UI state (active filters, home city selection).
 * Persisted server-side per-user data (venue toggles, trips, tickets) lives
 * in Supabase via the hooks in src/hooks — this store is just ephemeral
 * feed-filtering state that doesn't need to sync across devices.
 */
export const useAppStore = create<AppState>((set) => ({
  homeCityId: "city-dc",
  setHomeCityId: (id) => set({ homeCityId: id }),

  lgbtqOnly: false,
  toggleLgbtqOnly: () => set((s) => ({ lgbtqOnly: !s.lgbtqOnly })),

  minQualityScore: 0,
  setMinQualityScore: (score) => set({ minQualityScore: score })
}));
