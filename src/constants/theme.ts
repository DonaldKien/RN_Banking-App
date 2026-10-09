import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    primary: "#2B2BE8",
    primaryPressed: "#1F1FC4",
    primarySoft: "#E8E8FD",
    onPrimary: "#FFFFFF",
    background: "#F4F5FA",
    surface: "#FFFFFF",
    surfaceMuted: "#EDEFF6",
    border: "#E1E4EE",
    text: "#0B0D2A",
    textSecondary: "#5B6075",
    textTertiary: "#8A8FA3",
    success: "#0E9F6E",
    successSoft: "#E1F6EE",
    danger: "#D33A3A",
    dangerSoft: "#FDECEC",
    warning: "#A86A0C",
    warningSoft: "#FFF4DD",
    overlay: "rgba(9, 10, 30, 0.55)",
  },
  dark: {
    primary: "#7272FF",
    primaryPressed: "#5A5AF0",
    primarySoft: "#1E1F4D",
    onPrimary: "#FFFFFF",
    background: "#07081A",
    surface: "#12142B",
    surfaceMuted: "#1B1E3A",
    border: "#262A4A",
    text: "#F3F4FF",
    textSecondary: "#A6AAC4",
    textTertiary: "#757A98",
    success: "#34D399",
    successSoft: "#0F2E25",
    danger: "#F87171",
    dangerSoft: "#3A1717",
    warning: "#FBBF24",
    warningSoft: "#3A2C0B",
    overlay: "rgba(0, 0, 0, 0.65)",
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };
export type ThemeColor = keyof ThemeColors;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  web: {
    sans: "var(--font-display)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
  default: {
    sans: "normal",
    rounded: "normal",
    mono: "monospace",
  },
});

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const MaxContentWidth = 640;
