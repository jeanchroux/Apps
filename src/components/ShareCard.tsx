import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { format } from "date-fns";
import { palette } from "@/theme/tokens";
import type { Ticket } from "@/types/database.types";

/**
 * Rendered off-screen at Instagram Story dimensions (1080x1920) and
 * captured to a PNG by src/lib/share.ts. Kept visually separate from the
 * app's own screen components so its layout can be tuned purely for a
 * 9:16 share card without affecting in-app card styles.
 */
export const ShareCard = forwardRef<View, { ticket: Ticket; posterUrl?: string | null }>(
  ({ ticket, posterUrl }, ref) => {
    return (
      <View ref={ref} style={styles.canvas} collapsable={false}>
        <Image source={{ uri: posterUrl ?? undefined }} style={styles.poster} contentFit="cover" />
        <View style={styles.scrim} />

        <View style={styles.content}>
          <Text style={styles.eyebrow}>UP NEXT</Text>
          <Text style={styles.title}>{ticket.event_name}</Text>
          <Text style={styles.meta}>{ticket.venue_name}</Text>
          <Text style={styles.meta}>
            {format(new Date(ticket.event_date), "EEEE, MMMM d")}
            {ticket.event_time ? ` · ${ticket.event_time}` : ""}
          </Text>

          <View style={styles.divider} />
          <Text style={styles.handle}>@jeanroux</Text>
        </View>
      </View>
    );
  }
);
ShareCard.displayName = "ShareCard";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

const styles = StyleSheet.create({
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: palette.ink,
    justifyContent: "flex-end"
  },
  poster: { ...StyleSheet.absoluteFillObject },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17,17,16,0.35)"
  },
  content: {
    padding: 72,
    paddingBottom: 120,
    backgroundColor: "rgba(17,17,16,0.55)"
  },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    letterSpacing: 4,
    color: palette.goldMuted,
    marginBottom: 24
  },
  title: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 76,
    lineHeight: 88,
    color: palette.cream,
    marginBottom: 28
  },
  meta: {
    fontFamily: "Inter_400Regular",
    fontSize: 34,
    lineHeight: 46,
    color: palette.fog
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(247,243,236,0.3)",
    marginVertical: 40
  },
  handle: {
    fontFamily: "Inter_500Medium",
    fontSize: 30,
    color: palette.goldMuted,
    letterSpacing: 1
  }
});
