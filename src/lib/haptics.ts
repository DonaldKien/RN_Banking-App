import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/** Fire-and-forget haptics that are silently skipped where unsupported. */
export const haptics = {
  selection() {
    if (Platform.OS === "web") return;
    Haptics.selectionAsync().catch(() => {});
  },
  success() {
    if (Platform.OS === "web") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  error() {
    if (Platform.OS === "web") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
