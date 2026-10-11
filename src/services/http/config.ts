/**
 * Backend configuration, overridable per environment with Expo public env
 * vars (e.g. in `.env`):
 *
 *   EXPO_PUBLIC_API_URL=https://api.staging.example.com
 *   EXPO_PUBLIC_USE_MOCK_API=false
 *
 * The default host uses the reserved `.example` TLD, which never resolves:
 * the endpoints don't exist, so requests are answered by the in-app mock server.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.rytbank.example";

export const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API !== "false";
