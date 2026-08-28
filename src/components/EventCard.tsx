import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/theme/ThemeProvider";
import { palette, radius, spacing, type } from "@/theme/tokens";
import type { EventWithVenue } from "@/types/database.types";

export function EventCard({ event }: { event: EventWithVenue }) {
  const { theme } = useAppTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/event/${event.id}`)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.9 : 1 }
      ]}
    >
      <Image
        source={{ uri: event.poster_image_url ?? undefined }}
        style={styles.poster}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.badgeRow}>
        {event.quality_score != null && event.quality_score >= 85 ? (
          <View style={[styles.badge, { backgroundColor: palette.charcoal }]}>
            <Text style={[type.caption, { color: palette.cream, letterSpacing: 0.5 }]}>CRITICS&apos; PICK</Text>
          </View>
        ) : null}
        {event.is_lgbtq_friendly ? (
          <View style={[styles.badge, { backgroundColor: palette.lgbtq }]}>
            <Text style={[type.caption, { color: "#fff", letterSpacing: 0.5 }]}>QUEER-FRIENDLY</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={[type.eyebrow, { color: theme.accent }]}>{event.venue.name.toUpperCase()}</Text>
        <Text style={[type.h2, { color: theme.textPrimary, marginTop: spacing.xs }]} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={[type.bodySmall, { color: theme.textSecondary, marginTop: spacing.xs }]}>
          {format(new Date(event.start_at), "EEE, MMM d · h:mm a")}
        </Text>
        {event.ai_summary ? (
          <Text style={[type.body, { color: theme.textSecondary, marginTop: spacing.sm }]} numberOfLines={3}>
            {event.ai_summary}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: spacing.lg
  },
  poster: { width: "100%", aspectRatio: 4 / 3, backgroundColor: palette.fog },
  badgeRow: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    gap: spacing.xs
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  body: { padding: spacing.md }
});
