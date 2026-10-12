# Payment Transfer Module with Biometric Authentication

A secure money-transfer flow for a digital banking app, built with **React Native + TypeScript** on **Expo SDK 57**, using **Expo Router**, **Redux Toolkit**, **TanStack Query**, and **React Hook Form + Zod** for larger forms.

Users pick a recipient (saved payees, phone contacts via DuitNow, or a new account with name verification), enter an amount and an optional note, review the transfer, approve it with **Face ID / Touch ID / fingerprint** (with fallbacks), and get a receipt. The app calls real HTTP endpoints (`https://api.rytbank.example/v1/...`). That backend doesn't exist, so an in-app mock server answers the requests with mock data, and every success and failure path can be shown without any setup.

## Demo video

[> 📹 _Demo video link goes here._](https://github.com/user-attachments/assets/476064d6-cf41-4a62-870a-2d45e6b47f33)

---

## Contents

- [Running the app](#running-the-app)
- [Assumptions for running and evaluating](#assumptions-for-running-and-evaluating)
- [How to evaluate](#how-to-evaluate)
- [Features](#features)
- [Architecture](#architecture)
- [Security design](#security-design)
- [Performance](#performance)
- [Error handling](#error-handling)
- [Testing](#testing)
- [Design decisions and trade-offs](#design-decisions-and-trade-offs)
- [Challenges](#challenges)
- [Product assumptions](#product-assumptions)
- [What I'd do next](#what-id-do-next)

---

## Running the app

### Requirements

- **Node.js** `20.19.4+`, `22.13+` or `24.3+` (the versions React Native 0.86 supports), and npm.
- One of:
  - a phone with **[Expo Go](https://expo.dev/go) for SDK 57** installed, on the same Wi-Fi network as your computer;
  - an Android emulator (Android Studio) or the iOS Simulator (Xcode, macOS only);
  - a desktop browser, for a quick look at the UI.

No backend, API keys, accounts or `.env` file are needed.

### Steps

```bash
git clone https://github.com/DonaldKien/RN_Banking-App.git
cd RN_Banking-App
npm install
npx expo start
```

Then scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `a` (Android emulator), `i` (iOS Simulator) or `w` (web) in the terminal.

If your phone can't reach your computer (for example on office or guest Wi-Fi), run `npx expo start --tunnel` instead.

### What works where

| Target | Biometrics | Contacts | Notes |
| --- | --- | --- | --- |
| Android, Expo Go | ✅ Fingerprint / face unlock | ✅ | Works as-is. |
| iOS, Expo Go | ⚠️ Touch ID works. Face ID isn't available in Expo Go | ✅ | Use a development build to test Face ID, or tap **Use PIN instead**. |
| iOS / Android, development build | ✅ Including Face ID | ✅ | `npx expo run:ios` / `npx expo run:android`, or `npx eas-cli@latest build --profile development`. |
| Web | Transaction PIN only | Not available | Good for a quick look at the UI. |

**Simulators and emulators** need a biometric enrolled first:
- **iOS Simulator:** _Features → Face ID → Enrolled_, then _Features → Face ID → Matching Face_ when the prompt appears.
- **Android emulator:** add a fingerprint in the emulator's Settings, then use _Extended controls → Fingerprint_ to touch the sensor.

Without an enrolled biometric, the app falls back to the device passcode, then to the in-app transaction PIN (`123456`).

### Scripts

```bash
npm test             # Jest: unit, component and integration tests
npm run lint         # ESLint (eslint-config-expo)
npm run typecheck    # tsc --noEmit
```

---

## Assumptions for running and evaluating

- **Everything runs locally.** All API calls go to `https://api.rytbank.example`, which never resolves, so in the default mock mode they are answered by the in-app mock server. No network access is needed after `npm install`.
- **Mock data is generated, in memory, and resets on reload.** The same seeded data appears on every launch: about 1,500 transactions, 150 saved recipients, and a balance of RM 12,480.50. _Demo controls → Reset balance & history_ restores it without reloading.
- **The mock server adds realistic latency** (about 0.2–1.8 s per request), so loading states are visible on purpose.
- **Demo transaction PIN: `123456`.** Five wrong attempts lock it. Reset it in Demo controls.
- **Name enquiry:** any valid account number (10–16 digits) or Malaysian mobile number resolves to a name. Numbers ending in **`0000`** simulate "account not found".
- **The user is already signed in.** Login and session management are out of scope.
- **Demo controls are reviewer tooling,** not part of the product. They let you force failure scenarios and the PIN fallback on any device.
- **Using a real backend instead** needs no code changes:
  ```bash
  EXPO_PUBLIC_API_URL=https://api.your-backend.com EXPO_PUBLIC_USE_MOCK_API=false npx expo start
  ```

---

## How to evaluate

Open **Demo controls** with the slider icon at the top right of the home screen. From there you can trigger every scenario without changing code:

| What to try | How |
| --- | --- |
| Happy path | Transfer → choose a recipient → amount → Review → Confirm with biometrics → receipt. |
| Network failure + safe retry | Demo controls → _Network error_ → make a transfer → tap **Try again**. |
| Timeout where the bank _did_ process it | Demo controls → _Timeout after processing_ → transfer → **Try again**. You get the original receipt and are only charged once. |
| Server-side insufficient funds | Demo controls → _Insufficient funds_ → transfer. |
| Client-side validation | Enter more than the balance, more than RM 50,000, or emoji in the note. |
| PIN fallback | Demo controls → _Force PIN fallback_, or tap **Use PIN instead** on the review screen. Demo PIN: **`123456`**. |
| Biometric cancel / failure | Cancel the system prompt: nothing is sent and an inline message explains why. |
| Name enquiry | Transfer → recipient → **New recipient**. Numbers ending in **`0000`** simulate "account not found". |
| Contacts | Recipient picker → **Contacts** tab. The permission prompt, the denied state and the Settings link are all handled. |
| Large lists | History (≈1,500 transactions, infinite scroll, sticky day headers) and the recipient picker (≈150 saved recipients plus contacts). |
| Re-send | Tap a Quick send avatar on Home, or open a past transaction → **Send again**. |
| Double taps | Tap **Confirm** or a retry button several times quickly: only one request is sent. |

"Apply once" (on by default) sets the scenario back to _Success_ after one attempt, so the retry demos work without extra taps.

---

## Features

**Transfer interface**
- Recipient picker: saved recipients (recent, favourites, all), phone contacts (DuitNow mobile), or a new bank account / mobile number. Search filters once typing pauses (200 ms).
- **Name enquiry** for new recipients: the account holder's name is fetched and shown before you can continue, so you can check you're paying the right person.
- Large amount input with quick-amount chips. It shows your available balance and, while you type, the **balance after the transfer**.
- Optional note (140 characters, with a counter and allowed-characters validation).
- Clear inline errors. Errors for fields you haven't touched yet appear only after you first tap Review, but going over your balance is flagged as you type.

**Biometric authentication**: see [Security design](#security-design).

**Transaction processing**
- Real HTTP calls to dummy REST endpoints, answered by an in-app mock server with realistic latency, HTTP status codes, typed errors and idempotency.
- Review screen with a full summary (from, to, fee, note, balance after).
- Blocking "processing" overlay. Back navigation (swipe and Android hardware back) is disabled while a transfer is in flight.
- Receipt screen with an animated confirmation, reference number, share sheet and "Make another transfer".

**Stretch goals (both done)**
- Pay contacts from the address book.
- Recent transfer history: Quick send on Home, a Recent section in the picker, and "Send again" from any past transfer (pre-fills recipient, amount and note).

**Extras**
- Hide/show balance (privacy mode, applied to Home, History and the receipt).
- Light and dark mode, haptics, accessibility labels, roles and live regions.
- Pull to refresh. Data refreshes when the app returns to the foreground.

---

## Architecture

```
src/
├── app/                      # Expo Router routes: one folder + index.tsx per screen
│   ├── _layout.tsx           # Providers (Redux, TanStack Query, theme) + Stack
│   ├── index.tsx             # Home: balance, quick send, recent activity
│   ├── history/index.tsx     # Full history (FlashList, infinite query)
│   ├── transaction/[id]/index.tsx # Transaction details + "Send again"
│   ├── demo-settings/index.tsx # Reviewer tooling (modal)
│   └── transfer/
│       ├── index.tsx         # 1. Form
│       ├── recipients/index.tsx    # Recipient picker
│       ├── new-recipient/index.tsx # Manual entry + name enquiry
│       ├── review/index.tsx  # 2. Review + authenticate + submit
│       └── success/index.tsx # 3. Receipt
├── features/                 # Feature modules: state, hooks, feature UI
│   ├── account/              # Balance queries, BalanceCard
│   ├── auth/                 # Device auth adapter, PIN sheet, capability query
│   ├── recipients/           # Saved/recent queries, contacts, list builders, new-recipient form
│   ├── transactions/         # Infinite queries, day grouping, rows
│   ├── transfer/             # Draft slice, validation, error mapping, confirm flow
│   ├── preferences/          # Hide-balance preference
│   └── demo/                 # Demo scenario slice
├── services/
│   ├── api/                  # Endpoint paths, API calls (bank-api.ts), types, errors, limits
│   ├── http/                 # fetch-based JSON client + base URL / mock-mode config
│   └── mock-server/          # Dummy backend: route handlers, mock DB, fetch replacement
├── components/ui/            # Design-system primitives (Button, Card, TextField, AppPressable, …)
├── hooks/                    # Theme, debounced value, throttled press
├── lib/                      # Pure helpers: money, formatting, identifiers, query client
├── store/                    # Redux store + typed hooks
└── constants/                # Design tokens (light/dark), debounce and throttle delays
```

Dependencies only point downwards: `app` → `features` → `services` / `lib` / `components`. Screens put feature pieces together and contain almost no logic.

### State management: Redux for client state, TanStack Query for server state

| Concern | Owner | Why |
| --- | --- | --- |
| Balance, recipients, history, transaction details, name enquiry, device capabilities | **TanStack Query** | Server-owned data needs caching, deduplication, background refresh, retries and invalidation. A query library handles all of that. |
| Transfer draft (recipient, amount, note, idempotency key) | **Redux Toolkit** | Client state that spans several screens and must survive navigation. |
| Demo scenario, hide-balance preference | **Redux Toolkit** | App-wide UI state. |
| New-recipient form (type, bank, account number, mobile) | **React Hook Form + Zod** | Self-contained form state. Convention: screens with 3+ on-page inputs use RHF + Zod. |

Some details:
- **Query-key factory** (`lib/query-keys.ts`) with hierarchical keys, so one call refreshes everything a transfer touches: `invalidateQueries({ queryKey: ["transactions"] })`.
- **Cache sharing:** Home's "Recent activity" is a `select` over the same infinite query that History uses, so History opens instantly. The transaction details screen takes its initial data from any list already in the cache.
- **After a transfer**, the mutation writes the server-confirmed receipt and new balance into the cache (so the receipt renders immediately), then invalidates the balance, history and recent recipients.
- **Retries:** queries retry only errors that might succeed next time (`NETWORK_ERROR`, `TIMEOUT`, `SERVER_ERROR`). Mutations **never** retry automatically (see below).

### API layer

The app talks to a REST API through a small `fetch`-based client (`services/http/http-client.ts`). Every call is a real HTTP request (method, URL, headers, JSON body) to the dummy host `https://api.rytbank.example`. In mock mode the client is given `mockFetch` instead of the global `fetch`. `mockFetch` routes each request to a handler in `services/mock-server/` and replies with a real `Response`, using the mock data as the JSON body. This is the same idea as Mock Service Worker.

All paths are defined once in `services/api/endpoints.ts` (`API_ENDPOINTS`) and imported by both the API functions and the mock server's route table.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/v1/accounts/me` | Account and balance |
| GET | `/v1/recipients` | Saved recipients |
| GET | `/v1/recipients/recent?limit=` | Recently paid recipients |
| POST | `/v1/recipients/lookup` | Name enquiry for an account number or DuitNow mobile |
| GET | `/v1/transactions?cursor=&limit=&filter=` | Keyset-paginated history |
| GET | `/v1/transactions/:id` | Transaction details |
| POST | `/v1/auth/pin/verify` | Verify transaction PIN, returns a single-use token |
| POST | `/v1/transfers` | Make a transfer (`Idempotency-Key` header required) |
| POST | `/v1/demo/reset` | Mock-only: restore the seed data |

- **Errors** come back as `{ "error": { "code", "message", "details" } }` with matching HTTP statuses: 400 invalid input, 401 auth, 404 not found, 422 business rules such as insufficient funds, 423 PIN locked, 503 server error. The client turns them into a typed `ApiError`. A rejected `fetch` becomes `NETWORK_ERROR`, and a request past its deadline is aborted with `AbortController` and becomes `TIMEOUT`.
- **Network failures are simulated at the transport level.** For the demo scenarios, `mockFetch` rejects the way an offline `fetch` does, or processes the request and never answers so the client's 5-second transfer deadline fires.

### Money

All amounts are **integers in sen** (`Sen` type). Converting to and from decimal strings only happens at the UI edge (`lib/money.ts`), so floating-point drift (`0.1 + 0.2`) can't happen.

---

## Security design

### Authentication flow

```
Review ─► [Confirm with Face ID] ─► system biometric prompt
              │                        ├─ success ───────────► submit transfer ─► receipt
              │                        ├─ cancelled ─────────► stay on review, "not sent" notice
              │                        ├─ failed (no match) ─► stay on review, retry allowed
              │                        └─ lockout / unavailable / "Use PIN" ─► PIN sheet
              └─ [Use PIN instead] ─────────────────────────────────────────► PIN sheet
PIN sheet ─► server verifies PIN ─► single-use token ─► submit transfer ─► receipt
```

- **Capability detection** (`features/auth/device-auth.ts`): hardware present, biometrics enrolled, and the enrolled security level. Fallbacks, in order:
  1. Biometrics, when enrolled. On Android, **Class 3 (strong)** biometrics are required whenever the device has them.
  2. Device passcode / screen lock, when set but no biometrics are enrolled.
  3. In-app **transaction PIN**: when the device has no security, on biometric lockout, when the user taps "Use PIN", and on web.
- Capability is checked again whenever the app returns to the foreground, because users can change enrollment in Settings.
- **iOS uses the biometrics-only policy** (`disableDeviceFallback`), so "Use PIN" goes to the app's own PIN rather than the device passcode. A bank shouldn't treat a phone passcode, which may be shared, as approval for a payment.
- The system prompt **names the amount and recipient** ("Send RM 25.00 to Aisyah Lim"), so the user knows exactly what they're approving.
- The Face ID and contacts permission texts are set through config plugins in `app.json`.

### Guarantees in the confirm flow (`use-confirm-transfer.ts`)

- **No approval, no transfer.** The submit call can only be reached from a successful device authentication or a server-verified PIN.
- **Every attempt needs a fresh approval**, retries included. Approvals are never cached.
- **PIN tokens are single-use** and checked by the server, so they can't be replayed. The PIN locks after 5 wrong attempts.
- **Idempotency key per draft.** It is created when the review screen opens and reused for retries. Any edit to the recipient, amount or note invalidates it. The server stores the result per key, so a retry can never send the money twice. This matters most for timeouts, where the client can't know whether the transfer went through.
- **No double submission.** The confirm button is disabled and back navigation blocked while authenticating or submitting. Every tap that sends a POST request (confirm, retry, demo reset) goes through `AppPressable` with throttling, so repeat taps within 250 ms are dropped.
- Nothing sensitive is stored on the device: there is no persistence layer, and the PIN only exists in component state while it's being typed. It is sent straight to the API and never goes through the query cache.

### What production would add

The biometric check here is local, so the server has to trust the client's "success". In production I would use **biometric-bound keys**: a key pair is generated in the Secure Enclave / Android Keystore with `userAuthenticationRequired` (biometric-only), the public key is registered with the backend, and each transfer signs a **server-issued challenge** bound to the amount and recipient. A successful biometric is what unlocks the private key, so the server verifies a cryptographic proof instead of trusting a boolean. The `TransferAuthorization.assertion` field in `services/api/types.ts` is where that signature would go. Other additions: certificate pinning, root/jailbreak detection, hiding the screen in the app switcher, and a session timeout.

---

## Performance

- **FlashList v2** for all long lists (history ≈1,500 rows, recipients ≈150, contacts). Rows are memoised, receive a stable `onSelect(item)` callback, and lists set `getItemType` so header and row cells are recycled separately.
- **Flat, sectioned data with `stickyHeaderIndices`** instead of nested sections, which is the shape FlashList virtualises best. The row builders are pure functions with their own tests.
- **Keyset pagination** (the cursor is the last item's id) with `useInfiniteQuery`, so a new transfer arriving while you scroll never duplicates or skips rows.
- **Granular Redux selectors.** Each component subscribes only to what it renders, so typing in the amount field doesn't re-render the recipient card. The derived amount in sen uses a memoised `createSelector`.
- **`select` in queries** (e.g. `useBalance`) with structural sharing, so components re-render only when the data they use actually changes.
- **React Compiler** is enabled (`experiments.reactCompiler`) for automatic memoisation.
- **Debounced search** (200 ms) in the recipient picker and the bank dropdown, so large lists filter once typing pauses rather than on every keystroke.
- **Debounced name enquiry** (450 ms) plus caching, so retyping a number you already checked doesn't call the API again.
- The Quick send strip is capped at 10 items, so it uses a plain `ScrollView`. Virtualising it would cost more than it saves.

---

## Error handling

Every API failure is a typed `ApiError` with a `code`. The UI switches on the code, never on the message. `describeTransferError` turns each code into copy that says **what happened, whether money moved, and what to do next**, with one action per case:

| Code | Message (summary) | Action |
| --- | --- | --- |
| `NETWORK_ERROR` | You're offline, no money has moved | Try again |
| `TIMEOUT` | Taking longer than usual; retrying is safe, you won't be charged twice | Try again (same idempotency key) |
| `SERVER_ERROR` | Service unavailable, no money has moved | Try again |
| `INSUFFICIENT_FUNDS` | Shows your actual balance (and refreshes it) | Edit amount |
| `DAILY_LIMIT_EXCEEDED` / `LIMIT_EXCEEDED` | How much you can still send | Edit amount |
| `INVALID_RECIPIENT` / `ACCOUNT_NOT_FOUND` | Check the recipient | Change recipient |
| `AUTH_REQUIRED` | Approval expired | Approve again |

Loading and error states are handled on every screen: skeletons, inline retry banners, empty states, permission-denied states, and a redirect when the review screen is opened without a draft (e.g. from a deep link).

---

## Testing

129 tests in 20 suites (`npm test`):

- **Unit:** money parsing and formatting, date and text formatting, identifier normalisation, transfer validation, the draft slice (including idempotency-key invalidation), mapping of biometric results to outcomes and capability fallbacks, and the recipient and history row builders.
- **Hooks:** the debounced value and the throttled press.
- **UI components:** `Button`, `Tabs`, `SearchableDropdown` and `AppPressable` (including throttled repeat taps).
- **HTTP client:** URL, query string, headers and JSON body; error bodies to typed errors; non-JSON 5xx; offline; deadline abort to `TIMEOUT`.
- **Mock server:** JSON responses, path and query parameters, 404s, status codes for business errors, offline simulation.
- **API contract (client + mock server end to end):** idempotent replay, the timeout-after-processing recovery, no debit on network error, insufficient funds, single-use PIN tokens, PIN lockout, and stable pagination.
- **New-recipient form:** the Zod schema's rules per recipient type and its lookup-request output, plus a screen test (`src/__tests__/new-recipient-screen.test.tsx`) for missing-field errors, mobile validation, and verify → return to the transfer form.
- **Integration** (`src/__tests__/transfer-flow.test.tsx`): renders the real Expo Router screens with the real store and query client, mocking only the biometric module. It covers biometric success → receipt, cancel → nothing sent, lockout → PIN → success, and network error → retry → charged exactly once with re-authentication.

---

## Design decisions and trade-offs

- **Real HTTP calls, mocked at the transport.** The endpoint functions and HTTP client are production code; only the `fetch` implementation is swapped for the mock server. Mocking at the network boundary (rather than mocking the API functions) means headers, status codes, JSON serialisation, timeouts and error parsing are all exercised, and switching to a real backend is a configuration change.
- **Demo scenarios are passed per request** in an `X-Mock-Scenario` header, instead of the mock reading global app state. The API layer stays independent of Redux.
- **React Hook Form + Zod for forms with 3+ inputs.** The new-recipient screen keeps its four fields in RHF, and a Zod schema holds the rules and turns valid values straight into the name-enquiry request. The transfer form deliberately stays on Redux: its recipient comes from another screen, and editing must clear the idempotency key, which is simplest when every edit goes through the store.
- **Throttling is opt-in, only for taps that send a POST.** `AppPressable` wraps `Pressable` everywhere (an ESLint rule enforces it), but only buttons that send money or change data turn throttling on. Navigation and selection taps stay instant.
- **Validation is pure and shared.** Client-side rules (`validation.ts`) give instant feedback, the server checks the same limits (`services/api/limits.ts`), and the server stays the source of truth.
- **Errors appear when they're useful.** Errors for untouched fields wait until the first Review tap, so the form doesn't open full of red text. Going over your balance is flagged as you type, because seeing it late would be frustrating.
- **Name enquiry before paying a new account.** Misdirected payments are a common and costly support problem, so seeing the registered name is a deliberate check before any money moves.
- **The processing overlay is in-screen, not a second `Modal`.** iOS can't present a modal while another one (the PIN sheet) is still dismissing.
- **The draft is cleared when the receipt closes, not when it opens.** The review screen is still animating out underneath the receipt, and clearing earlier would briefly show it an empty draft.

## Challenges

- **The timeout case.** When a request times out, the client can't tell whether the money moved. I solved it end to end with an idempotency key kept across retries and cleared by any edit, plus a mock scenario where the server processes the transfer but the response is lost, so the recovery path can be shown and tested.
- **SDK 57 API changes.** `expo-contacts` now has a class-based API (`Contact.getAllDetails` with `ContactField`), and React Navigation is bundled inside Expo Router. I worked from the installed type definitions and the versioned docs rather than older examples.
- **Test tooling.** React Native 0.86, Reanimated 4 (which needs both its own and the Worklets Jest mocks), ESM builds of `immer` and `react-redux`, and Testing Library v14's async `render` (not yet supported by `expo-router/testing-library`) all needed specific configuration (`jest.config.js`, `jest/setup.js`, Testing Library pinned to v13).
- **Typed routes on Windows.** Starting the dev server from a lowercase drive path (`d:\…` instead of `D:\…`) generates broken typed-route definitions. Starting it from the canonical path fixes this.

## Product assumptions

- Single account, currency **MYR**, displayed as `RM`. Per-transfer limit RM 50,000, daily limit RM 30,000, and transfers are free.
- Recipients are bank accounts (10–16 digits) or **DuitNow** Malaysian mobile numbers. Contacts with other numbers are shown but disabled.
- The user is already logged in. App login and session management are out of scope.
- Data lives in memory only and resets on reload (or with _Reset balance & history_ in Demo controls).

## What I'd do next

- Biometric-bound key signing as described above, plus a privacy screen in the app switcher and certificate pinning.
- Offline awareness with `@react-native-community/netinfo` wired into TanStack Query's `onlineManager`.
- Save new recipients after a successful transfer, and scheduled or recurring transfers (the validation and confirm flow are already separate from the screens).
- End-to-end tests on devices (Maestro), and i18n for copy and number formatting.
