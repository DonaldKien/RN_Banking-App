const expoPreset = require("jest-expo/jest-preset");

// Extend (rather than replace) jest-expo's list of node_modules that must be
// transpiled: immer and react-redux resolve to ESM builds under the
// "react-native" export condition, and FlashList v2 ships untranspiled source.
const [nodeModules, ...otherPatterns] = expoPreset.transformIgnorePatterns;
const extraPackages = ["immer", "react-redux", "@shopify/flash-list"];

module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    nodeModules.replace("standard-navigation", ["standard-navigation", ...extraPackages].join("|")),
    ...otherPatterns,
  ],
  setupFilesAfterEnv: ["<rootDir>/jest/setup.js"],
  moduleNameMapper: {
    // Web-only stylesheets have no meaning in tests. Listed first so it wins
    // over the "@/..." path alias.
    "\.css$": "<rootDir>/jest/empty-module.js",
    ...expoPreset.moduleNameMapper,
  },
};
