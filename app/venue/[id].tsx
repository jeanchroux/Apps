import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/theme/ThemeProvider";
import { palette, radius, spacing, type } from "@/theme/tokens";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mockVenues } from "@/lib/mockData";
import { useEvents } from "@/hooks/useEvents";
import { EventCard } from "@/components/EventCard";
import type { Venue } from "@/types/database.types";

function useVenue(id: string) {
  return useQuery({
    queryKey: ["venue", id],
    queryFn: async (): Promise<Venue | undefined> => {
      if (!isSupabaseConfigured) return mockVenues.find((v) => v.id === id);
      const { data, error } = await supabase.from("venues").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Venue;
    }
  });
}

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { data: venue } = useVenue(id);
  const { data: events } = useEvents(venue ? { cityIds: [venue.city_id] } : {});

  if (!venue) return null;

  const venueEvents = events?.filter((e) => e.venue_id === venue.id) ?? [];

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View>
        <Image source={{ uri: venue.image_url ?? undefined }} style={styles.hero} contentFit="cover" />
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={palette.cream} />
        </Pressable>
      </View>

      <View style={{ padding: spacing.lg }}>
        <Text style={[type.display, { color: theme.textPrimary }]}>{venue.name}</Text>
        {venue.address ? (
          <Text style={[type.body, { color: theme.textSecondary, marginTop: spacing.xs }]}>{venue.address}</Text>
        ) : null}
        {venue.description ? (
          <Text style={[type.body, { color: theme.textPrimary, marginTop: spacing.md }]}>{venue.description}</Text>
        ) : null}

        <Text style={[type.eyebrow, { color: theme.accent, marginTop: spacing.xl, marginBottom: spacing.md }]}>
          UPCOMING AT THIS VENUE
        </Text>
        {venueEvents.length ? (
          venueEvents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <Text style={[type.bodySmall, { color: theme.textSecondary }]}>No upcoming events curated yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", aspectRatio: 16 / 9, backgroundColor: palette.fog },
  backButton: {
    position: "absolute",
    top: spacing.xl,
    left: spacing.md,
    backgroundColor: "rgba(17,17,16,0.5)",
    borderRadius: radius.pill,
    padding: spacing.xs
  }
});
