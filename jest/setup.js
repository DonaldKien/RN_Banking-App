// Official Jest mocks for Reanimated and its Worklets runtime: animations
// resolve immediately and no native worklet runtime is needed.
jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
