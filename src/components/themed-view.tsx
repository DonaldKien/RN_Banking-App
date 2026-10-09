import { View, type ViewProps } from "react-native";

import type { ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedViewProps = ViewProps & {
  /** Background token; defaults to the screen background. */
  surface?: ThemeColor;
};

export const ThemedView = ({ style, surface = "background", ...rest }: ThemedViewProps) => {
  const theme = useTheme();
  return <View style={[{ backgroundColor: theme[surface] }, style]} {...rest} />;
};
