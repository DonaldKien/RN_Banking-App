import { Pressable, StyleSheet } from "react-native";

import { Icon, type IconName } from "@/components/ui/icon";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export const IconButton = ({
  icon,
  label,
  onPress,
  tone = "surface",
}: {
  icon: IconName;
  /** Required: icon-only controls need an accessible name. */
  label: string;
  onPress: () => void;
  tone?: "surface" | "onPrimary";
}) => {
  const theme = useTheme();
  const color = tone === "onPrimary" ? theme.onPrimary : theme.text;
  const background = tone === "onPrimary" ? "rgba(255,255,255,0.16)" : theme.surface;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: background }, pressed && styles.pressed]}>
      <Icon name={icon} size={20} color={color} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
});
