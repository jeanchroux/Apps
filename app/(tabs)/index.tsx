import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { palette, radius, spacing, type } from "@/theme/tokens";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EventCard } from "@/components/EventCard";
import { useEvents } from "@/hooks/useEvents";
import { useTrips } from "@/hooks/useTrips";
import { useCities } from "@/hooks/useCities";
import { useAppStore } from "@/store/useAppStore";

export default function DiscoverScreen() {
  const { theme } = useAppTheme();
  const { homeCityId, lgbtqOnly, toggleLgbtqOnly } = useAppStore();
  const { data: cities } = useCities();
  const { data: trips } = useTrips();

  // Feed = home city + any city with an upcoming/active trip (Travel & Trip
  // Integration: non-home cities only surface events during exact travel dates,
  // handled per-trip further down via each trip's own date-bounded query).
  const activeCityIds = useMemo(() => {
    const ids = new Set<string>();
    if (homeCityId) ids.add(homeCityId);
    return Array.from(ids);
  }, [homeCityId]);

  const { data: homeEvents, isLoading } = useEvents({ cityIds: activeCityIds, lgbtqOnly });

  const homeCity = cities?.find((c) => c.id === homeCityId);

  return (
    <ScreenContainer>
      <View style={{ paddingTop: spacing.md }}>
        <SectionHeader
          eyebrow={homeCity ? `${homeCity.name} · Next 12 months` : "Next 12 months"}
          title="Discover"
          action={
            <Pressable
              onPress={toggleLgbtqOnly}
              style={[
                styles.filterPill,
                { borderColor: lgbtqOnly ? palette.lgbtq : theme.border, backgroundColor: lgbtqOnly ? palette.lgbtq : "transparent" }
              ]}
            >
              <Text style={[type.caption, { color: lgbtqOnly ? "#fff" : theme.textSecondary }]}>Queer-friendly</Text>
            </Pressable>
          }
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={homeEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <Text style={[type.body, { color: theme.textSecondary, marginTop: spacing.xl }]}>
              No upcoming shows match your filters yet. Try enabling more venues, or check back as new events are
              curated.
            </Text>
          }
          ListFooterComponent={
            trips?.length ? (
              <Text style={[type.caption, { color: theme.textSecondary, marginTop: spacing.md }]}>
                Tip: open the Trips tab to see events filtered to your exact travel dates in {trips.length} upcoming
                {trips.length === 1 ? " trip" : " trips"}.
              </Text>
            ) : null
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth
  }
});
