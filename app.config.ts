import "dotenv/config";
import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Aria",
  slug: "aria-app",
  scheme: "aria",
  version: "0.1.0",
  orientation: "default",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#1C1B19"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "com.jeanroux.aria",
    supportsTablet: true,
    infoPlist: {
      NSCalendarsUsageDescription:
        "Aria adds shows you book to your calendar so you never miss curtain.",
      NSCalendarsFullAccessUsageDescription:
        "Aria adds shows you book to your calendar so you never miss curtain.",
      NSPhotoLibraryAddUsageDescription:
        "Aria saves the aesthetic show cards you generate so you can share them.",
      NSUserTrackingUsageDescription:
        "Used only to personalize event recommendations."
    }
  },
  android: {
    package: "com.jeanroux.aria",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#1C1B19"
    },
    permissions: ["READ_CALENDAR", "WRITE_CALENDAR"]
  },
  web: {
    bundler: "metro",
    // "single" = client-side-only SPA output. This app is entirely
    // client-rendered (Supabase auth session, device dark mode, live
    // queries), so Expo Router's static server-rendering ("static") has
    // nothing to gain and actively breaks: modules like the Supabase
    // client touch `window` at import time, which doesn't exist during
    // Node-side static rendering.
    output: "single",
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-calendar",
      {
        calendarPermission:
          "Aria adds shows you book to your calendar so you never miss curtain."
      }
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#B08D57"
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: process.env.EAS_PROJECT_ID
    }
  }
};

export default config;
