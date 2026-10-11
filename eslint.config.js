// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Use AppPressable everywhere so taps can opt into throttling (`throttle`).
    // app-pressable.tsx itself wraps React Native's Pressable and is the only exception.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-native",
              importNames: ["Pressable"],
              message: "Use AppPressable from @/components/ui/app-pressable instead.",
            },
          ],
        },
      ],
    },
  },
]);
