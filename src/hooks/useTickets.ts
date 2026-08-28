import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mockTickets } from "@/lib/mockData";
import type { Ticket } from "@/types/database.types";

export type NewTicket = Pick<
  Ticket,
  "event_name" | "venue_name" | "event_date" | "event_time" | "num_tickets" | "notes"
> & { event_id?: string | null };

export function useTickets() {
  return useQuery({
    queryKey: ["tickets"],
    queryFn: async (): Promise<Ticket[]> => {
      if (!isSupabaseConfigured) return mockTickets;

      const { data, error } = await supabase.from("tickets").select("*").order("event_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: NewTicket) => {
      if (!isSupabaseConfigured) return;

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be signed in to add a ticket.");

      const { error } = await supabase.from("tickets").insert({ ...ticket, user_id: user.id, source: "manual" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] })
  });
}

export function useUpdateTicketCalendarId() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, calendarEventId }: { ticketId: string; calendarEventId: string }) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase
        .from("tickets")
        .update({ calendar_event_id: calendarEventId })
        .eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] })
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      if (!isSupabaseConfigured) return;
      const { error } = await supabase.from("tickets").delete().eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] })
  });
}
