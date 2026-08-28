import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { spacing, type } from "@/theme/tokens";

export function SectionHeader({
  eyebrow,
  title,
  action
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <Text style={[type.eyebrow, { color: theme.accent, marginBottom: spacing.xs }]}>{eyebrow}</Text>
        ) : null}
        <Text style={[type.h1, { color: theme.textPrimary }]}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.lg
  }
});
