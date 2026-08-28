import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

/**
 * Registers this device for Smart Alerts push notifications and stores the
 * Expo push token in `push_tokens`. The actual "notify me when a highly
 * rated show goes on sale" logic lives server-side in the
 * smart-alerts edge function (supabase/functions/smart-alerts), which is
 * triggered whenever the curation pipeline ingests new events and matches
 * them against each user's alert_subscriptions.
 */
export async function registerForSmartAlerts(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("[Atelier] Push notifications require a physical device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("smart-alerts", {
      name: "Smart Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200],
      lightColor: "#B08D57"
    });
  }

  const { data } = await Notifications.getExpoPushTokenAsync();
  const token = data;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("push_tokens").upsert(
      {
        user_id: user.id,
        expo_push_token: token,
        device_name: Device.deviceName ?? Platform.OS
      },
      { onConflict: "expo_push_token" }
    );
  }

  return token;
}
