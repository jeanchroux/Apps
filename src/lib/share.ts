import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import type { RefObject } from "react";
import type { View } from "react-native";

/**
 * Social Export — renders the ShareCard component (src/components/ShareCard.tsx)
 * off-screen at Instagram Story resolution (1080x1920) and hands the
 * resulting PNG to the native share sheet, which includes "Add to Story"
 * for Instagram on iOS. There is no public Instagram API for posting
 * directly to a specific account (e.g. @jeanroux) — Meta's Content
 * Publishing API is Business-account + App Review gated and not intended
 * for personal Stories — so the share sheet is the correct, App-Store-safe
 * integration path. It pre-fills the image; the user taps their own
 * @jeanroux account and posts.
 */
export async function shareViewAsImage(viewRef: RefObject<View>, filenameHint = "atelier-share") {
  const uri = await captureRef(viewRef, {
    format: "png",
    quality: 1,
    result: "tmpfile"
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing is not available on this device/browser.");
  }

  await Sharing.shareAsync(uri, {
    dialogTitle: filenameHint,
    mimeType: "image/png",
    UTI: "public.png"
  });

  return uri;
}
