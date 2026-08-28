import React, { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { format } from "date-fns";
import { useAppTheme } from "@/theme/ThemeProvider";
import { palette, radius, spacing, type } from "@/theme/tokens";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EventCard } from "@/components/EventCard";
import { useCities } from "@/hooks/useCities";
import { useCreateTrip, useDeleteTrip, useTrips } from "@/hooks/useTrips";
import { useEvents } from "@/hooks/useEvents";
import type { Trip } from "@/types/database.types";

function TripEventsSection({ trip }: { trip: Trip }) {
  const { theme } = useAppTheme();
  const { data: cities } = useCities();
  const city = cities?.find((c) => c.id === trip.destination_city_id);

  const { data: events } = useEvents({
    cityIds: [trip.destination_city_id],
    startDate: new Date(trip.start_date),
    endDate: new Date(`${trip.end_date}T23:59:59`)
  });

  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text style={[type.h2, { color: theme.textPrimary }]}>{trip.label || city?.name}</Text>
      <Text style={[type.bodySmall, { color: theme.textSecondary, marginTop: 2, marginBottom: spacing.md }]}>
        {city?.name} · {format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d, yyyy")}
      </Text>
      {events?.length ? (
        events.map((event) => <EventCard key={event.id} event={event} />)
      ) : (
        <Text style={[type.bodySmall, { color: theme.textSecondary }]}>
          Nothing curated yet for these exact dates — check back closer to your trip.
        </Text>
      )}
    </View>
  );
}

export default function TripsScreen() {
  const { theme } = useAppTheme();
  const { data: trips } = useTrips();
  const { data: cities } = useCities();
  const createTrip = useCreateTrip();
  const deleteTrip = useDeleteTrip();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string | undefined>();
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const canSubmit = selectedCityId && startDate && endDate;

  const handleSubmit = () => {
    if (!canSubmit || !selectedCityId) return;
    createTrip.mutate(
      { destination_city_id: selectedCityId, start_date: startDate, end_date: endDate, label: label || null },
      { onSuccess: () => setModalVisible(false) }
    );
  };

  return (
    <ScreenContainer>
      <View style={{ paddingTop: spacing.md }}>
        <SectionHeader
          eyebrow="Travel & trip integration"
          title="Trips"
          action={
            <Pressable
              onPress={() => setModalVisible(true)}
              style={[styles.addButton, { backgroundColor: theme.textPrimary }]}
            >
              <Text style={[type.caption, { color: theme.background, fontFamily: "Inter_600SemiBold" }]}>+ Add trip</Text>
            </Pressable>
          }
        />
      </View>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        renderItem={({ item }) => (
          <View>
            <TripEventsSection trip={item} />
            <Pressable onPress={() => deleteTrip.mutate(item.id)}>
              <Text style={[type.caption, { color: palette.danger, marginBottom: spacing.lg }]}>Remove trip</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[type.body, { color: theme.textSecondary, marginTop: spacing.xl }]}>
            Add an upcoming trip and Aria will automatically filter that city&apos;s feed to your exact travel
            dates.
          </Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surfaceElevated }]}>
            <Text style={[type.h2, { color: theme.textPrimary, marginBottom: spacing.md }]}>New trip</Text>

            <Text style={[type.eyebrow, { color: theme.textSecondary, marginBottom: spacing.xs }]}>DESTINATION</Text>
            <View style={styles.chipRow}>
              {cities?.map((city) => (
                <Pressable
                  key={city.id}
                  onPress={() => setSelectedCityId(city.id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: theme.border,
                      backgroundColor: selectedCityId === city.id ? theme.accent : "transparent"
                    }
                  ]}
                >
                  <Text style={{ color: selectedCityId === city.id ? theme.background : theme.textPrimary }}>
                    {city.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              placeholder="Label (optional) — e.g. Anniversary trip"
              placeholderTextColor={theme.textSecondary}
              value={label}
              onChangeText={setLabel}
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
            />
            <TextInput
              placeholder="Start date (YYYY-MM-DD)"
              placeholderTextColor={theme.textSecondary}
              value={startDate}
              onChangeText={setStartDate}
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
            />
            <TextInput
              placeholder="End date (YYYY-MM-DD)"
              placeholderTextColor={theme.textSecondary}
              value={endDate}
              onChangeText={setEndDate}
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
            />

            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalVisible(false)} style={{ padding: spacing.md }}>
                <Text style={{ color: theme.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={[styles.addButton, { backgroundColor: canSubmit ? theme.textPrimary : theme.border }]}
              >
                <Text style={{ color: theme.background, fontFamily: "Inter_600SemiBold" }}>Save trip</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  modalOverlay: { flex: 1, backgroundColor: palette.charcoal + "cc", justifyContent: "flex-end" },
  modalCard: { padding: spacing.lg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm }
});
