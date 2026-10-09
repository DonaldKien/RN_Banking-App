import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useIsDark } from "@/hooks/use-theme";
import { initials } from "@/lib/format";

const LIGHT_TINTS = ["#E8E8FD", "#E1F6EE", "#FFF1DE", "#FDE8F1", "#E3F1FD", "#EFE8FD"];
const DARK_TINTS = ["#25275A", "#173A31", "#3D2E14", "#3D1B2A", "#16304A", "#2C2250"];
const LIGHT_INK = ["#2B2BE8", "#0B7A55", "#A35A00", "#B4235E", "#1565C0", "#5B2BC4"];
const DARK_INK = ["#A5A5FF", "#6EE7B7", "#FCD34D", "#F9A8D4", "#93C5FD", "#C4B5FD"];

const hash = (value: string): number => {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
};

/** Initials avatar with a colour derived from the name, so it's stable across screens. */
export const Avatar = ({ name, size = 44 }: { name: string; size?: number }) => {
  const dark = useIsDark();
  const index = hash(name) % LIGHT_TINTS.length;
  const background = (dark ? DARK_TINTS : LIGHT_TINTS)[index];
  const ink = (dark ? DARK_INK : LIGHT_INK)[index];

  return (
    <View
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: background }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <ThemedText variant="bodyStrong" style={{ color: ink, fontSize: size * 0.36, lineHeight: size * 0.46 }}>
        {initials(name)}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
});
