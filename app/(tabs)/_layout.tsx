import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/theme/ThemeProvider";
import { fonts } from "@/theme/tokens";

export default function TabsLayout() {
  const { theme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheetHairline,
          height: Platform.select({ ios: 88, default: 64 }),
          paddingTop: 8
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="venues"
        options={{
          title: "Venues",
          tabBarIcon: ({ color, size }) => <Ionicons name="business-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Trips",
          tabBarIcon: ({ color, size }) => <Ionicons name="airplane-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: "My Tickets",
          tabBarIcon: ({ color, size }) => <Ionicons name="ticket-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />
        }}
      />
    </Tabs>
  );
}

const StyleSheetHairline = 0.5;
