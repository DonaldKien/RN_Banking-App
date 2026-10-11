// Override with EXPO_PUBLIC_API_URL / EXPO_PUBLIC_USE_MOCK_API=false.
// `.example` never resolves, so by default the in-app mock server answers.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.rytbank.example";

export const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API !== "false";
