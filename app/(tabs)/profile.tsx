import React from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { radius, spacing, type } from "@/theme/tokens";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { useCities } from "@/hooks/useCities";
import { useAppStore } from "@/store/useAppStore";
import { registerForSmartAlerts } from "@/lib/notifications";

export default function ProfileScreen() {
  const { theme, preference, setPreference, isDark } = useAppTheme();
  const { data: cities } = useCities();
  const { homeCityId, setHomeCityId } = useAppStore();

  const handleEnableAlerts = async () => {
    const token = await registerForSmartAlerts();
    Alert.alert(
      token ? "Smart Alerts enabled" : "Permission needed",
      token
        ? "You'll be notified when highly-rated shows go on sale in your active cities."
        : "Enable notifications in system settings to receive Smart Alerts."
    );
  };

  return (
    <ScreenContainer>
      <View style={{ paddingTop: spacing.md }}>
        <SectionHeader eyebrow="@jeanroux" title="Profile" />
      </View>

      <Text style={[type.eyebrow, { color: theme.textSecondary, marginBottom: spacing.sm }]}>HOME CITY</Text>
      <View style={styles.chipRow}>
        {cities?.map((city) => (
          <Pressable
            key={city.id}
            onPress={() => setHomeCityId(city.id)}
            style={[
              styles.chip,
              { borderColor: theme.border, backgroundColor: homeCityId === city.id ? theme.accent : "transparent" }
            ]}
          >
            <Text style={{ color: homeCityId === city.id ? theme.background : theme.textPrimary }}>{city.name}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.row, { borderColor: theme.border, marginTop: spacing.xl }]}>
        <Text style={[type.body, { color: theme.textPrimary }]}>Dark mode</Text>
        <Switch
          value={isDark}
          onValueChange={(next) => setPreference(next ? "dark" : "light")}
          trackColor={{ false: theme.border, true: theme.accent }}
        />
      </View>
      <Pressable onPress={() => setPreference("system")} style={{ marginTop: spacing.xs }}>
        <Text style={[type.caption, { color: theme.textSecondary }]}>
          {preference === "system" ? "Following system appearance" : "Use system appearance instead"}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleEnableAlerts}
        style={[styles.button, { backgroundColor: theme.textPrimary, marginTop: spacing.xl }]}
      >
        <Text style={{ color: theme.background, fontFamily: "Inter_600SemiBold" }}>Enable Smart Alerts</Text>
      </Pressable>
      <Text style={[type.caption, { color: theme.textSecondary, marginTop: spacing.sm }]}>
        Push notifications when a highly-rated show goes on sale in your active cities.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  button: { paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: "center" }
});
