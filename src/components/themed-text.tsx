import { StyleSheet, Text, type TextProps } from "react-native";

import { Fonts, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "bodyStrong"
  | "caption"
  | "captionStrong"
  | "label"
  | "mono";

export type ThemedTextProps = TextProps & {
  variant?: TextVariant;
  color?: ThemeColor;
  align?: "left" | "center" | "right";
};

export const ThemedText = ({
  style,
  variant = "body",
  color = "text",
  align,
  ...rest
}: ThemedTextProps) => {
  const theme = useTheme();
  return (
    <Text
      style={[styles[variant], { color: theme[color] }, align && { textAlign: align }, style]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  display: {
    fontFamily: Fonts.rounded,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  captionStrong: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  mono: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    lineHeight: 18,
  },
});
