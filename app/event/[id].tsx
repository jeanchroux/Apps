import React from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/theme/ThemeProvider";
import { palette, radius, spacing, type } from "@/theme/tokens";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mockEvents } from "@/lib/mockData";
import { useCreateTicket } from "@/hooks/useTickets";
import type { EventWithVenue } from "@/types/database.types";

function useEvent(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async (): Promise<EventWithVenue | undefined> => {
      if (!isSupabaseConfigured) return mockEvents.find((e) => e.id === id);
      const { data, error } = await supabase.from("events").select("*, venue:venues(*)").eq("id", id).single();
      if (error) throw error;
      return data as EventWithVenue;
    }
  });
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { data: event } = useEvent(id);
  const createTicket = useCreateTicket();

  if (!event) return null;

  const handleGetTickets = () => {
    createTicket.mutate(
      {
        event_id: event.id,
        event_name: event.title,
        venue_name: event.venue.name,
        event_date: event.start_at.slice(0, 10),
        event_time: format(new Date(event.start_at), "HH:mm"),
        num_tickets: 1,
        notes: null
      },
      {
        onSuccess: () => Alert.alert("Saved to My Tickets", "Add specifics like seat count anytime from the Tickets tab.")
      }
    );
    if (event.ticket_url) Linking.openURL(event.ticket_url);
  };

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View>
        <Image source={{ uri: event.poster_image_url ?? undefined }} style={styles.poster} contentFit="cover" />
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={palette.cream} />
        </Pressable>
      </View>

      <View style={{ padding: spacing.lg }}>
        <View style={styles.badgeRow}>
          {event.quality_score != null ? (
            <View style={[styles.badge, { backgroundColor: theme.textPrimary }]}>
              <Text style={[type.caption, { color: theme.background }]}>QUALITY {Math.round(event.quality_score)}/100</Text>
            </View>
          ) : null}
          {event.is_lgbtq_friendly ? (
            <View style={[styles.badge, { backgroundColor: palette.lgbtq }]}>
              <Text style={[type.caption, { color: "#fff" }]}>QUEER-FRIENDLY</Text>
            </View>
          ) : null}
        </View>

        <Text style={[type.eyebrow, { color: theme.accent, marginTop: spacing.md }]}>{event.venue.name.toUpperCase()}</Text>
        <Text style={[type.display, { color: theme.textPrimary, marginTop: spacing.xs }]}>{event.title}</Text>
        <Text style={[type.body, { color: theme.textSecondary, marginTop: spacing.sm }]}>
          {format(new Date(event.start_at), "EEEE, MMMM d, yyyy · h:mm a")}
        </Text>
        {event.venue.address ? (
          <Text style={[type.bodySmall, { color: theme.textSecondary, marginTop: 2 }]}>{event.venue.address}</Text>
        ) : null}

        {event.ai_summary ? (
          <View style={[styles.summaryBox, { borderColor: theme.border }]}>
            <Text style={[type.eyebrow, { color: theme.textSecondary, marginBottom: spacing.xs }]}>AI SUMMARY</Text>
            <Text style={[type.body, { color: theme.textPrimary }]}>{event.ai_summary}</Text>
          </View>
        ) : null}

        {event.press_reviews?.length ? (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[type.eyebrow, { color: theme.textSecondary, marginBottom: spacing.sm }]}>PRESS</Text>
            {event.press_reviews.map((review, i) => (
              <Text key={i} style={[type.bodySmall, { color: theme.textSecondary, marginBottom: spacing.xs, fontStyle: "italic" }]}>
                &ldquo;{review.quote}&rdquo; — {review.source}
              </Text>
            ))}
          </View>
        ) : null}

        {event.price_min != null ? (
          <Text style={[type.body, { color: theme.textPrimary, marginTop: spacing.lg }]}>
            {event.currency} {event.price_min}
            {event.price_max ? ` – ${event.price_max}` : ""}
          </Text>
        ) : null}

        <Pressable onPress={handleGetTickets} style={[styles.ctaButton, { backgroundColor: theme.textPrimary }]}>
          <Text style={{ color: theme.background, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>Get tickets</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  poster: { width: "100%", aspectRatio: 4 / 3, backgroundColor: palette.fog },
  backButton: {
    position: "absolute",
    top: spacing.xl,
    left: spacing.md,
    backgroundColor: "rgba(17,17,16,0.5)",
    borderRadius: radius.pill,
    padding: spacing.xs
  },
  badgeRow: { flexDirection: "row", gap: spacing.xs },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  summaryBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
  ctaButton: { marginTop: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: "center" }
});
