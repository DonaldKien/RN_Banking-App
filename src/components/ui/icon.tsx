import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";

type SymbolName = Extract<SymbolViewProps["name"], { ios?: unknown }>;

// SF Symbols on iOS, Material Symbols on Android and web.
const ICONS = {
  send: { ios: "paperplane.fill", android: "send" },
  search: { ios: "magnifyingglass", android: "search" },
  person: { ios: "person.fill", android: "person" },
  personAdd: { ios: "person.badge.plus", android: "person_add" },
  contacts: { ios: "person.crop.circle", android: "contacts" },
  fingerprint: { ios: "touchid", android: "fingerprint" },
  faceId: { ios: "faceid", android: "face" },
  lock: { ios: "lock.fill", android: "lock" },
  pin: { ios: "circle.grid.3x3.fill", android: "pin" },
  shield: { ios: "checkmark.shield.fill", android: "verified_user" },
  eye: { ios: "eye", android: "visibility" },
  eyeOff: { ios: "eye.slash", android: "visibility_off" },
  check: { ios: "checkmark", android: "check" },
  checkCircle: { ios: "checkmark.circle.fill", android: "check_circle" },
  close: { ios: "xmark", android: "close" },
  history: { ios: "clock.arrow.circlepath", android: "history" },
  error: { ios: "exclamationmark.triangle.fill", android: "error" },
  offline: { ios: "wifi.slash", android: "wifi_off" },
  info: { ios: "info.circle.fill", android: "info" },
  add: { ios: "plus", android: "add" },
  chevronRight: { ios: "chevron.right", android: "chevron_right" },
  chevronDown: { ios: "chevron.down", android: "expand_more" },
  bank: { ios: "building.columns.fill", android: "account_balance" },
  phone: { ios: "phone.fill", android: "phone_iphone" },
  tune: { ios: "slider.horizontal.3", android: "tune" },
  backspace: { ios: "delete.left", android: "backspace" },
  outgoing: { ios: "arrow.up.right", android: "north_east" },
  incoming: { ios: "arrow.down.left", android: "south_west" },
  receipt: { ios: "doc.text", android: "receipt_long" },
  share: { ios: "square.and.arrow.up", android: "share" },
  retry: { ios: "arrow.clockwise", android: "replay" },
  star: { ios: "star.fill", android: "star" },
} as const satisfies Record<string, { ios: SymbolName["ios"]; android: SymbolName["android"] }>;

export type IconName = keyof typeof ICONS;

export const Icon = ({
  name,
  size = 20,
  color,
  style,
}: {
  name: IconName;
  size?: number;
  color: ColorValue;
  style?: StyleProp<ViewStyle>;
}) => {
  const glyph = ICONS[name];
  return (
    <SymbolView
      name={{ ios: glyph.ios, android: glyph.android, web: glyph.android }}
      size={size}
      tintColor={color}
      style={style}
      // Decorative: the surrounding control provides the label.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
};
