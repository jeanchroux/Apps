import React from "react";
import { ActivityIndicator, SectionList, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { spacing, type } from "@/theme/tokens";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { VenueCard } from "@/components/VenueCard";
import { useCities } from "@/hooks/useCities";
import { useToggleVenue, useVenues } from "@/hooks/useVenues";

export default function VenuesScreen() {
  const { theme } = useAppTheme();
  const { data: cities, isLoading: citiesLoading } = useCities();
  const { data: venues, isLoading: venuesLoading } = useVenues();
  const toggleVenue = useToggleVenue();

  const sections = (cities ?? [])
    .map((city) => ({
      title: city.name,
      data: (venues ?? []).filter((v) => v.city_id === city.id)
    }))
    .filter((s) => s.data.length > 0);

  const isLoading = citiesLoading || venuesLoading;

  return (
    <ScreenContainer>
      <View style={{ paddingTop: spacing.md }}>
        <SectionHeader eyebrow="Manage your directory" title="Venues" />
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: spacing.xl }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderSectionHeader={({ section }) => (
            <Text
              style={[
                type.eyebrow,
                { color: theme.accent, backgroundColor: theme.background, paddingTop: spacing.lg, paddingBottom: spacing.sm }
              ]}
            >
              {section.title.toUpperCase()}
            </Text>
          )}
          renderItem={({ item }) => (
            <VenueCard
              venue={item}
              onToggle={(venueId, next) => toggleVenue.mutate({ venueId, isEnabled: next })}
            />
          )}
        />
      )}

      <Text style={[type.caption, { color: theme.textSecondary, paddingVertical: spacing.md }]}>
        Turning off a venue removes its events from your Discover feed everywhere in the app. Re-enable it anytime —
        your preference is saved to your account.
      </Text>
    </ScreenContainer>
  );
}
