// Official Jest mocks for Reanimated and its Worklets runtime: animations
// resolve immediately and no native worklet runtime is needed.
jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

// expo-contacts' class-based API extends a native class that doesn't exist in
// Jest. Tests start with no contacts and an undetermined permission.
jest.mock("expo-contacts", () => ({
  Contact: { getAllDetails: jest.fn(async () => []) },
  ContactField: { FULL_NAME: "fullName", PHONES: "phones" },
  ContactsSortOrder: { GivenName: "givenName" },
  getPermissionsAsync: jest.fn(async () => ({ status: "undetermined", granted: false, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "denied", granted: false, canAskAgain: false })),
}));
