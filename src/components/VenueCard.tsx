import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Image } from "expo-image";
import { useAppTheme } from "@/theme/ThemeProvider";
import { palette, radius, spacing, type } from "@/theme/tokens";
import type { VenueWithPreference } from "@/types/database.types";

const CATEGORY_LABELS: Record<string, string> = {
  concert_hall: "Concert Hall",
  opera_house: "Opera House",
  theater: "Theater",
  gallery: "Gallery",
  museum: "Museum",
  jazz_club: "Jazz Club",
  dance: "Dance",
  other: "Venue"
};

export function VenueCard({
  venue,
  onToggle
}: {
  venue: VenueWithPreference;
  onToggle: (venueId: string, next: boolean) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <Image
        source={{ uri: venue.image_url ?? undefined }}
        style={[styles.thumb, { backgroundColor: palette.fog }]}
        contentFit="cover"
      />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[type.h3, { color: theme.textPrimary }]}>{venue.name}</Text>
        <Text style={[type.caption, { color: theme.textSecondary, marginTop: 2 }]}>
          {CATEGORY_LABELS[venue.category] ?? venue.category}
        </Text>
      </View>
      <Switch
        value={venue.is_enabled_for_user}
        onValueChange={(next) => onToggle(venue.id, next)}
        trackColor={{ false: theme.border, true: theme.accent }}
        thumbColor={palette.paper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  thumb: { width: 48, height: 48, borderRadius: radius.sm }
});
