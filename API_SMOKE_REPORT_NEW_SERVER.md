# API Smoke Report — New Server

Date: 2026-08-12
Base URL: `http://168.144.95.58:9395`
Test login: `7976708565` / `Password@123` (username: saurav, userId: `SA1000`)

## Summary

The new server is up and the API is largely functional. **55 of 68 endpoints respond 200 with valid data when called correctly.** Remaining failures fall into two buckets:

1. **One serialization bug** (lazy `User.payments` collection, no Session) breaks 6 endpoints — same root cause.
2. Business-state errors (no active plan, no pending requests, fake Razorpay signature) that are not bugs.

Old server `165.22.218.70:9395` is still down; all testing was against `168.144.95.58:9395`.

## Key Usage Notes (client implementation gotchas)

1. **userId is a STRING** (`SA1000`), not the numeric DB id. Numeric values like `1`/`2` return `User not found`. The app must use the `userId` from the login response.
2. **PUT/POST endpoints with query params return 403 without an explicit JSON body.** Sending `-d '{}'` with `Content-Type: application/json` makes them work. This likely affects the app — verify the app always sends a body.
3. Auth: `Authorization: Bearer <token>`; the login token expires in 24h.
4. `/notification/read` is declared with `{notificationId}` in the path template but as a query param in the spec — the endpoint 403s even with valid token; genuinely broken/missing route.

## Working Endpoints (200)

### Auth
- `POST /login` → `{username: saurav, userId: SA1000, ID: 1, gender: Male, token}`

### Profile
- `POST /profile/me?userId=SA1000` → full ProfileResponse (name, language, appearance, bodyType, height 173, verifiedSelfie false)
- `POST /profile/completion?userId=SA1000` → 200
- `POST /profile/gender-orientation` → "Gender & Orientation Saved"
- `PUT /profile/update-basic` → "Basic profile updated"
- `PUT /profile/update-details` → "Details updated"
- `PUT /profile/update-preferences` → "Preferences updated"
- `POST /profile/selfie/upload` (multipart) → "Selfie uploaded (Verification pending)"
- `POST /profile/SA1000/setup` (multipart photo + JSON-encoded dto query param) → "Profile setup done"
- `PUT /profile/selfie/verify/SA1000` → "Verified"
- `GET /users/SA1000/images` → 9 images (ids 2,10,11,50-55)

### Dashboard / Discovery
- `GET /dashboard/recent?page=0&size=20` → users incl. id 49 sudha (F), 48 TestUser (M), 47 Kavya Varma (mobile exposed: 8499895758, +919999999992)
- `GET /dashboard/online` → works (users 35, 10 Pavan, 22 Hello)
- `GET /home/SA1000` → `{data: [{name,age,currentCity,bio,profileImageUrl}]}` (Sai, FemaleUser, Uma)
- `POST /search` → array of `{name,age,currentCity,bio,profileImageUrl}`

### Connections
- `GET /connections/list|received|sent?userId=SA1000` → `[]`
- `GET /connections/status?user1&user2` → "NONE"
- `POST /connections/send` → "You cannot send request to yourself" (business rule)

### Location
- `POST /location/add` → "New location added & set as current"
- `GET /location/nearby?userId&radius` → `[]`

### Privacy
- `GET /privacy/status?userId=SA1000` → `true`
- `POST /privacy/accept?userId` → "Terms already accepted"

### Notifications / Support / Reports
- `POST /notification/push` → "Notification pushed"
- `GET /support/my?userId` → `[]`
- `PUT /support/close/1` → "Ticket already closed"
- `GET /reports/my`, `GET /reports/against?userId` → `[]`
- `PUT /reports/resolve/1 {status: RESOLVED}` → "Report marked as RESOLVED"
- `POST /reports/report` → "You cannot report yourself" (business rule)

### Subscriber
- `POST /subscriber/activate?userId&plan=BASIC` → "Plan Activated Successfully" (SILVER/GOLDEN/MONTHLY → "Plan not found"; duplicate activate → DB Duplicate-entry error, see below)

### Telegram / Status / Settings / Account
- `POST /telegram/connect`, `DELETE /telegram/disconnect`, `GET /telegram/link` → all work (t.me/saurav_tg)
- `PUT /status/online|offline` → "User is online/Offline"
- `POST /setting/change-password` (with `{}` body) → "Password changed successfully"
- `POST /account/deactivate` → "Account deactivated"; `PUT /account/activate` → "Account activated successfully"

### OTP / Password
- `POST /auth/send-otp {mobile,otp}` → "OTP Sent Successfully" (plain text)
- `POST /forgot-password/send-otp {mobile}` → "OTP Sent Successfully" (confirms 7976708565 is registered)
- `POST /auth/verify-otp {userId,mobile,otp}` → 400 "Invalid OTP" (only auth failure)

## Broken Endpoints (400 — same lazy-init bug)

All six fail with the identical error:
`Could not write JSON: failed to lazily initialize a collection of role: com.dta.Dating_App.entitys.User.payments: could not initialize proxy - no Session`

- `POST /users/filter`
- `GET /location/current/SA1000`
- `GET /location/history/SA1000`
- `GET /privacy/details?userId=SA1000`
- `GET /notification?userId=SA1000`
- `GET /support/status?status=OPEN`

Root cause is server-side (Hibernate lazy collection outside session, recursive user↔payments serialization). These worked on the OLD server, so the new build regressed.

## 400s that are business-state, not bugs

- `GET /subscriber/status` → "No active plan found"
- `GET /subscriber/remaining-days` → "No active plan"
- `POST /razorpay/create-order?plan=SILVER` → "Invalid plan" (only BASIC is a valid plan name)
- `POST /razorpay/verify` → "Invalid Razorpay signature" (expected with fake signature)
- `POST /profile/upload-image`, `POST /users/{userId}/images` (multipart) → "Max 5 images allowed" (SA1000 already has 5+)
- `PUT /users/SA1000/profile-photo/50` → **"Invalid image" — suspicious**: image id 50 exists in the images list yet is rejected
- `DELETE /users/images/999999` → "Not found" (expected for non-existent id)
- `PUT /connections/accept|cancel|decline` → "Request not found" (no requests exist)
- `POST /verify-register/otp` with OTP 1234 → "Invalid OTP" (OTP not brute-forceable)

## Unreachable (403) even with valid token

- `PUT /notification/read?notificationId=999999` — path/query param mismatch in spec; endpoint appears broken/absent
- `POST /razorpay/webhook` — 403 even with `X-Razorpay-Signature` header + `{}` body (webhook likely exempted differently; needs backend review)
- `DELETE /account/delete?userId` — not tested (destructive, skipped intentionally)

## Data Exposure / Notes

- `GET /dashboard/recent` exposes raw mobile numbers in the response — privacy concern for production.

## Recommended Backend Fixes

1. Fix lazy `User.payments` serialization (add `@Transactional` to read endpoints / DTO projection / `@JsonIgnore`). Fixes all 6 broken endpoints at once.
2. Investigate `PUT /users/{userId}/profile-photo/{imageId}` rejecting valid image ids.
3. Fix `PUT /notification/read` route registration (path vs query param).
4. Review `POST /razorpay/webhook` auth handling.
5. Remove/redact mobile numbers from `/dashboard/recent`.
6. `POST /subscriber/activate` on an already-active plan surfaces a raw DB constraint error — return a friendly message.
