import { Colors, type ThemeColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const useTheme = (): ThemeColors => {
  const scheme = useColorScheme();
  return Colors[scheme === "dark" ? "dark" : "light"];
};

export const useIsDark = (): boolean => {
  return useColorScheme() === "dark";
};
