import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import type { Ticket } from "@/types/database.types";

/**
 * "Add to Apple/Google Calendar" for a booked show.
 *
 * On iOS/iPadOS this writes directly into the user's default calendar via
 * EventKit (through expo-calendar) — the same store used by Apple Calendar,
 * so any account synced there (iCloud or Google via CalDAV) picks it up
 * automatically. On Android it writes into the device's Calendar Provider,
 * which is likewise account-agnostic. On Web, there's no native calendar
 * store, so we fall back to generating a downloadable .ics file.
 */

async function getDefaultWritableCalendarId(): Promise<string> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((c) => c.allowsModifications);
  if (writable) return writable.id;

  if (Platform.OS === "ios") {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar.id;
  }

  const newCalendarId = await Calendar.createCalendarAsync({
    title: "Aria",
    color: "#B08D57",
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: calendars[0]?.source?.id,
    source: calendars[0]?.source ?? { isLocalAccount: true, name: "Aria" },
    name: "aria",
    ownerAccount: "aria",
    accessLevel: Calendar.CalendarAccessLevel.OWNER
  });
  return newCalendarId;
}

export async function addTicketToDeviceCalendar(ticket: Ticket): Promise<string> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Calendar permission was not granted.");
  }

  const calendarId = await getDefaultWritableCalendarId();

  const [hours, minutes] = (ticket.event_time ?? "19:00").split(":").map(Number);
  const startDate = new Date(ticket.event_date);
  startDate.setHours(hours ?? 19, minutes ?? 0, 0, 0);
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // assume ~3hr show

  const eventId = await Calendar.createEventAsync(calendarId, {
    title: ticket.event_name,
    location: ticket.venue_name,
    startDate,
    endDate,
    notes: [ticket.notes, `${ticket.num_tickets} ticket(s) via Aria`].filter(Boolean).join("\n"),
    alarms: [{ relativeOffset: -120 }] // 2 hours before
  });

  return eventId;
}

export function buildIcsFile(ticket: Ticket): string {
  const [hours, minutes] = (ticket.event_time ?? "19:00").split(":").map(Number);
  const startDate = new Date(ticket.event_date);
  startDate.setHours(hours ?? 19, minutes ?? 0, 0, 0);
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const toIcsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aria//EN",
    "BEGIN:VEVENT",
    `UID:${ticket.id}@aria.app`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(startDate)}`,
    `DTEND:${toIcsDate(endDate)}`,
    `SUMMARY:${ticket.event_name}`,
    `LOCATION:${ticket.venue_name}`,
    `DESCRIPTION:${(ticket.notes ?? "").replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}
