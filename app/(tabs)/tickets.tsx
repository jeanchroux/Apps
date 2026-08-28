import React, { useRef, useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { format } from "date-fns";
import { useAppTheme } from "@/theme/ThemeProvider";
import { palette, radius, spacing, type } from "@/theme/tokens";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { ShareCard } from "@/components/ShareCard";
import { useCreateTicket, useDeleteTicket, useTickets, useUpdateTicketCalendarId } from "@/hooks/useTickets";
import { addTicketToDeviceCalendar } from "@/lib/calendar";
import { shareViewAsImage } from "@/lib/share";
import type { Ticket } from "@/types/database.types";

function TicketRow({ ticket }: { ticket: Ticket }) {
  const { theme } = useAppTheme();
  const shareRef = useRef<View>(null);
  const updateCalendarId = useUpdateTicketCalendarId();
  const deleteTicket = useDeleteTicket();

  const handleAddToCalendar = async () => {
    try {
      const eventId = await addTicketToDeviceCalendar(ticket);
      updateCalendarId.mutate({ ticketId: ticket.id, calendarEventId: eventId });
      Alert.alert("Added to calendar", `${ticket.event_name} is on your calendar.`);
    } catch (err) {
      Alert.alert("Couldn't add to calendar", err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleShare = async () => {
    try {
      await shareViewAsImage(shareRef, ticket.event_name);
    } catch (err) {
      Alert.alert("Couldn't share", err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <View style={[styles.ticketCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <Text style={[type.h3, { color: theme.textPrimary }]}>{ticket.event_name}</Text>
      <Text style={[type.bodySmall, { color: theme.textSecondary, marginTop: 2 }]}>{ticket.venue_name}</Text>
      <Text style={[type.bodySmall, { color: theme.textSecondary }]}>
        {format(new Date(ticket.event_date), "EEE, MMM d, yyyy")}
        {ticket.event_time ? ` · ${ticket.event_time}` : ""} · {ticket.num_tickets} ticket
        {ticket.num_tickets > 1 ? "s" : ""}
      </Text>
      {ticket.notes ? (
        <Text style={[type.caption, { color: theme.textSecondary, marginTop: spacing.xs }]}>{ticket.notes}</Text>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable onPress={handleAddToCalendar} style={[styles.actionButton, { borderColor: theme.border }]}>
          <Text style={[type.caption, { color: theme.textPrimary }]}>
            {ticket.calendar_event_id ? "On calendar ✓" : "Add to calendar"}
          </Text>
        </Pressable>
        <Pressable onPress={handleShare} style={[styles.actionButton, { borderColor: theme.border }]}>
          <Text style={[type.caption, { color: theme.textPrimary }]}>Share to Story</Text>
        </Pressable>
        <Pressable onPress={() => deleteTicket.mutate(ticket.id)} style={[styles.actionButton, { borderColor: theme.border }]}>
          <Text style={[type.caption, { color: palette.danger }]}>Remove</Text>
        </Pressable>
      </View>

      {/* Off-screen 1080x1920 render captured for the Instagram Story share. */}
      <View style={styles.offscreen} pointerEvents="none">
        <ShareCard ref={shareRef} ticket={ticket} />
      </View>
    </View>
  );
}

export default function TicketsScreen() {
  const { theme } = useAppTheme();
  const { data: tickets } = useTickets();
  const createTicket = useCreateTicket();

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    event_name: "",
    venue_name: "",
    event_date: "",
    event_time: "",
    num_tickets: "1",
    notes: ""
  });

  const canSubmit = form.event_name && form.venue_name && form.event_date;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createTicket.mutate(
      {
        event_name: form.event_name,
        venue_name: form.venue_name,
        event_date: form.event_date,
        event_time: form.event_time || null,
        num_tickets: Number(form.num_tickets) || 1,
        notes: form.notes || null
      },
      {
        onSuccess: () => {
          setModalVisible(false);
          setForm({ event_name: "", venue_name: "", event_date: "", event_time: "", num_tickets: "1", notes: "" });
        }
      }
    );
  };

  return (
    <ScreenContainer>
      <View style={{ paddingTop: spacing.md }}>
        <SectionHeader
          eyebrow="Your bookings"
          title="My Tickets"
          action={
            <Pressable onPress={() => setModalVisible(true)} style={[styles.addButton, { backgroundColor: theme.textPrimary }]}>
              <Text style={{ color: theme.background, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>+ Add</Text>
            </Pressable>
          }
        />
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        renderItem={({ item }) => <TicketRow ticket={item} />}
        ListEmptyComponent={
          <Text style={[type.body, { color: theme.textSecondary, marginTop: spacing.xl }]}>
            Nothing booked yet. Add a show manually, or tap &quot;Get tickets&quot; on any event to log it here
            automatically.
          </Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surfaceElevated }]}>
            <Text style={[type.h2, { color: theme.textPrimary, marginBottom: spacing.md }]}>Add a booking</Text>
            {(
              [
                ["event_name", "Event name"],
                ["venue_name", "Venue"],
                ["event_date", "Date (YYYY-MM-DD)"],
                ["event_time", "Time (HH:MM, optional)"],
                ["num_tickets", "Number of tickets"],
                ["notes", "Notes"]
              ] as const
            ).map(([key, placeholder]) => (
              <TextInput
                key={key}
                placeholder={placeholder}
                placeholderTextColor={theme.textSecondary}
                value={form[key]}
                onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
              />
            ))}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalVisible(false)} style={{ padding: spacing.md }}>
                <Text style={{ color: theme.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={[styles.addButton, { backgroundColor: canSubmit ? theme.textPrimary : theme.border }]}
              >
                <Text style={{ color: theme.background, fontFamily: "Inter_600SemiBold" }}>Save</Text>
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
  ticketCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, flexWrap: "wrap" },
  actionButton: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  offscreen: { position: "absolute", top: -99999, left: -99999 },
  modalOverlay: { flex: 1, backgroundColor: palette.charcoal + "cc", justifyContent: "flex-end" },
  modalCard: { padding: spacing.lg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm }
});
