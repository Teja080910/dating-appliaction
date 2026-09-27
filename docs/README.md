# AMARA — App Status & Gaps (Simple Version)

| | |
|---|---|
| App | AMARA — React Native (Android + iOS), package `com.datingapp` |
| Backend | Spring Boot, `http://168.144.95.58:9395` |
| Scope decision | Keep the current app as it is. **Hide chat for now.** Approved pairs connect on Telegram. |
| Date | 2026-09-25 |

This one document lists **what is already done** in the app and **what gaps need fixing** to make the simple version work.

---

## 1. Simple Model (target)

1. Everyone registers / logs in and creates a profile with photos.
2. Men browse women's profiles and send a dating request (invitation).
3. Women see the requests they received and either **approve** or leave **pending** — no rejection.
4. When a woman approves, both people see each other's **Telegram link** and chat there.
5. No in-app chat. No swipes. Requests stay visible as pending until approved.

This matches the current app's invitation + Telegram features, with two changes: **women's home should show requests instead of browsing**, and **Telegram link must be shown after approval**.

---

## 2. What Is Done

### 2.1 Authentication — ✅ done

| Feature | Where | Status |
|---|---|---|
| Register (name, mobile, password) | `screens/Auth/RegisterScreen.tsx` | ✅ works |
| Registration OTP + resend (30s) | `screens/Auth/OTPScreen.tsx` | ✅ works |
| Login (mobile + password) | `screens/Auth/LoginScreen.tsx` | ✅ works |
| Forgot / reset password | `screens/Auth/ForgotPasswordScreen.tsx` | ✅ works |
| Logout (local) | `ProfileScreen` | ✅ works |
| Delete account (double confirm) | `ProfileScreen` | ✅ works (backend FK bug possible) |
| Session persist + resume | `utils/session.ts`, `utils/sessionState.ts` | ✅ works |
| Auto return to login on 401 | `api/apiClient.ts` | ✅ works |

### 2.2 Onboarding & Profile — ✅ done

| Feature | Where | Status |
|---|---|---|
| Terms & privacy consent | `screens/onboarding/PrivacyScreen.tsx` | ✅ |
| Gender & orientation | `onboarding/GenderOrientationScreen.tsx` | ✅ |
| Display name, DOB (18+ enforced) | `onboarding/DisplayNameScreen.tsx`, `DOBScreen.tsx` | ✅ |
| Photo upload (3–5) + face confirm | `onboarding/UploadImageScreen.tsx`, `components/UploadImageComponents/*` | ✅ |
| Selfie verification (skippable) | `onboarding/SelfieVerificationScreen.tsx` | ✅ |
| Profile details (height, body type, etc.) | `onboarding/MoreDetailsScreen.tsx`, `MoreInfoTab/MoreInfoScreen.tsx` | ✅ |
| Bio + profile submit | `onboarding/AboutProfileScreen.tsx` | ✅ |
| Telegram connect (optional) | `onboarding/ConnectTelegramScreen.tsx`, `api/useTelegram.ts` | ✅ |
| Edit name / bio / birthday | `ProfileTab/ProfileSettingsScreen.tsx` | ✅ |

### 2.3 Browse & Requests — ✅ mostly done

| Feature | Where | Status |
|---|---|---|
| Home grid of profiles | `HomeTab/HomeScreen.tsx`, `components/HomeTabComponents/UserList.tsx` | ✅ (first 20 only) |
| "Active now" / "Just joined" toggle | `components/HomeTabComponents/HomeHeader.tsx` | ✅ |
| Full profile view with photos | `ProfileTab/ViewMyProfileScreen.tsx`, `UserDetails.tsx` | ✅ |
| Send request (invitation) | `UserDetails.tsx`, `api/useConnection.ts` | ✅ |
| Sent / Received request lists | `MessageTab/MessageScreen.tsx` (Invitations tab) | ✅ |
| Approve request | `MessageScreen.tsx` (Received tab → Accept) | ✅ |
| Recall sent request | `MessageScreen.tsx` (Sent tab) | ✅ |
| No rejection option | — | ✅ already true (no decline button in UI) |
| Match celebration screen | `HomeTab/MatchScreen.tsx` | ✅ (shows after sending) |
| Telegram connect / my link | `api/useTelegram.ts` | ✅ |

### 2.4 Supporting Features — done (some not needed)

| Feature | Where | Status |
|---|---|---|
| Subscription paywall + Razorpay | `components/SubscriptionModal.tsx`, `api/useSubscription.ts` | ✅ built — decide if kept |
| Premium badge | `ProfileTabComponents/Header.tsx` | ✅ |
| In-app notifications screen | `ProfileTab/NotificationsScreen.tsx` | ⚠ UI done, backend broken |
| Support tickets | `ProfileTab/SupportScreen.tsx` | ✅ works |
| Report profile | `UserDetails.tsx`, `api/useReport.ts` | ✅ works |
| Privacy policy / terms in-app | `ProfileTab/PrivacyPolicyScreen.tsx` | ✅ |
| Location add (picker/map) | `SearchSettingsComponents/Location.tsx` | ✅ add works |
| Online/offline presence | `App.tsx` (`ServerSync`) | ✅ |
| Dark theme design system | `src/theme/*` | ✅ |
| API client (auth, retry, 401 handling) | `api/apiClient.ts` | ✅ |

---

## 3. Chat — Hide It For Now

Chat is only a UI stub (no backend chat API, input disabled, "Messaging coming soon..."). Keep the code but make it unreachable.

**Changes to hide chat:**

| # | File | Change |
|---|---|---|
| 1 | `MessageTab/MessageScreen.tsx` | Remove/hide the **Messages** main tab. Keep only **Invitations** (Sent / Received). |
| 2 | `HomeTab/MatchScreen.tsx` | Replace the "Say Hello" chat button with nothing yet, or a disabled "Connect on Telegram" (once Telegram handoff is built). |
| 3 | `screens/Navigations/Routes.tsx` | Remove the `ChatDetailScreen` registration (optional; leaving it registered but unreachable is enough). |
| 4 | `api/useChat.ts` | Leave as-is (already throws "chat not available"). |

**Do not delete** `ChatDetailScreen.tsx` — keep it for a future version.

---

## 4. Gaps To Fix

### 4.1 P0 — needed for the simple flow

| # | Gap | Where | What to do |
|---|---|---|---|
| G-01 | **Telegram link not shown after approval** | `MessageScreen.tsx`, `UserDetails.tsx`, `api/useConnection.ts` | When a connection is `ACCEPTED`, show the other person's Telegram username/link + "Open Telegram" button. |
| G-02 | Backend must return `telegramUsername` in request/connection user objects | Backend `ConnectionRequest` sender/receiver DTO | Add `telegramUsername` to the user data returned by `/connections/list`, `/connections/received`, `/connections/sent`. |
| G-03 | **Women's home shows browse, not requests** | `HomeTab/HomeScreen.tsx` | If profile gender = woman → show the Requests (Received) list as the home screen; men keep browsing. |
| G-04 | Browse does not filter to women only | `components/HomeTabComponents/UserList.tsx` | Filter the feed by `profile.gender` (men see women; per app rules). |
| G-05 | **Invites are paywalled** | `utils/useSubscriptionGate.ts` (used in `UserDetails.tsx`) | If the app is free, remove the subscription check from the invite button. Decision needed if payments stay. |

### 4.2 P1 — app fixes

| # | Gap | Where | What to do |
|---|---|---|---|
| G-06 | Home loads only first 20 profiles, no pagination | `UserList.tsx` | Add load-more (page/size) using `GET /dashboard/recent` / `/dashboard/online`. |
| G-07 | Notifications screen loads and mark-read fail (backend) | `api/useNotification.ts` | Fix backend `GET /notification` and `PUT /notification/read` (lazy-load bug + route mismatch), or hide the Notifications row. |
| G-08 | Primary photo cannot be set (backend) | `api/useImages.ts` | Fix `PUT /users/{userId}/profile-photo/{imageId}` to accept valid image ids. |
| G-09 | Search Settings save fails (backend) | `SearchSettings/SearchScreen.tsx`, `api/useDiscovery.ts` | Fix `POST /users/filter` (lazy `User.payments` bug) **or** hide Search Settings in the simple version. |
| G-10 | Dashboard users sometimes lack `userId` → dropped from feed | `useDiscovery.ts` | Backend: include string `userId` in discovery responses (also remove exposed mobile numbers). |
| G-11 | No decline UI (intended) | `api/useConnection.ts` | Nothing to fix — just do not add a Reject button. Keep requests pending. |
| G-12 | Match screen shows before the woman approves | `MatchScreen.tsx`, `ViewMyProfileScreen.tsx` | Simple model: show "Request Sent" instead of "It's a Match". Show Telegram/approval only when `ACCEPTED`. |

### 4.3 P2 — release / production

| # | Gap | Where | What to do |
|---|---|---|---|
| G-13 | API is HTTP and hardcoded | `environment/ApiConfig.ts` | Get HTTPS URL; move to environment config (dev/staging/prod). |
| G-14 | Release build uses debug keystore | `android/app/build.gradle` | Create release keystore + signing config. |
| G-15 | Firebase push not configured | `google-services.json` missing | Either set up FCM or skip push for v1 (not required for the simple flow). |
| G-16 | Google Maps key placeholder | `AndroidManifest.xml` | Add a restricted key, or hide the map location picker in the simple version. |
| G-17 | Location history/current broken (backend) | `api/useLocation.ts` | Not needed for the simple flow — hide those screens. |
| G-18 | Subscription plan mismatch (only `BASIC` works) | `SubscriptionModal.tsx`, backend | Fix the backend plan catalog if payments stay; otherwise hide the paywall. |
| G-19 | No tests / CI | — | At minimum keep `npm run lint` + manual test checklist (Section 6). |
| G-20 | Support/reports optional | `SupportScreen.tsx` | Keep only if already working; otherwise hide to reduce scope. |

---

## 5. What We Are NOT Building (simple version)

- In-app chat / messages (hidden, Telegram is used)
- Swiping / like-dislike
- Reject / decline requests
- Advanced search filters (age, ethnicity, lifestyle, worldwide…)
- Payments / subscriptions — unless monetization is required
- Push notifications — optional
- Location-based discovery — optional
- Mutual-match logic

---

## 6. Test Checklist (simple version)

- [ ] Man registers, completes profile with photos.
- [ ] Woman registers, completes profile with photos.
- [ ] Man sees women profiles in browse and sends a request.
- [ ] Woman sees the request in her list (PENDING).
- [ ] Woman approves → status becomes APPROVED.
- [ ] Man and woman both see the Telegram link/button **only after** approval.
- [ ] Pending request shows no Telegram link.
- [ ] No reject option appears anywhere.
- [ ] Chat / Messages tab is not reachable anywhere.
- [ ] Logout and delete account work.

---

## 7. Suggested Order

1. **Hide chat** (Section 3) — quick, removes dead screens from the flow.
2. **Women → Requests home + women-only browse filter** (G-03, G-04).
3. **Approval → Telegram handoff** (G-01, G-02) — the core of the simple app.
4. **Decide free vs paid invites** (G-05) and hide/keep paywall.
5. **P1 backend fixes** (G-07, G-08, G-10) or hide the affected entries.
6. **Release prep** (G-13, G-14) and ship.
