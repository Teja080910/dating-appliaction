# Postman API Smoke Report

Date: 2026-04-04
Base URL: `http://165.22.218.70:9395`
Test login: `8887626782`

## Summary

Authentication works and profile data exists in the backend.
Direct API hits confirm that at least one real profile is available and can be fetched.

Main blocker for app testing is not missing data, but broken listing/filter endpoints on the backend.

## Login Result

Endpoint: `POST /login`
Status: `200 OK`
Result:

```json
{
  "message": "Login Successful",
  "success": true,
  "token": "JWT returned successfully"
}
```

## Confirmed Existing Profile

Endpoint: `GET /profile/me/2`
Status: `200 OK`
Result:

```json
{
  "id": 2,
  "name": "Savej ali",
  "displayName": "Savej87",
  "bio": "Love",
  "language": "hindi",
  "height": 6,
  "smoke": "No",
  "drink": "No",
  "verifiedSelfie": false,
  "profileImageUrl": "/uploads/58d2f6ec-0a6d-4f0a-be45-2f19899d07a7_Savej W.jpg",
  "images": []
}
```

Endpoint: `GET /profile/completion/2`
Status: `200 OK`
Result: `80`

This confirms profile data is already stored in the API.

Additional observations from `GET /profile/me/2`:

- `height` is returned as `6`, which looks invalid for a dating profile.
- `appearance` is returned as `"0"`.
- `bodyType` is returned as `"0"`.
- `englishLevel` is returned as `"string"`.
- `ethnicity` is returned as `"string"`.

These fields look like placeholder or incorrectly saved values and should be validated.

## Working Endpoints

- `POST /login`
- `POST /search`
- `GET /profile/me/2`
- `GET /profile/completion/2`
- `GET /privacy/status?userId=2`
- `GET /telegram/link?userId=2`
- `GET /notification?userId=2`
- `GET /support/my?userId=2`
- `GET /reports/my?userId=2`
- `GET /reports/against?userId=2`
- `GET /connections/list?userId=2`
- `GET /connections/sent?userId=2`
- `GET /connections/received?userId=2`
- `GET /connections/status?user1=2&user2=2`
- `GET /location/current/2`
- `GET /location/history/2`
- `GET /users/2/images`

Observed working data:

- `GET /location/current/2` returns current location successfully
- `GET /location/history/2` returns location history successfully
- `GET /telegram/link?userId=2` returns a valid Telegram URL
- `GET /support/status?status=OPEN` returns `[]`
- `GET /notification?userId=2` returns `[]`
- `GET /support/my?userId=2` returns `[]`
- `GET /reports/my?userId=2` returns `[]`
- `GET /reports/against?userId=2` returns `[]`

## Broken Endpoints

### 1. Dashboard Recent

Endpoint: `GET /dashboard/recent?page=0&size=20`
Status: `400`
Error:

```json
{
  "success": false,
  "message": "No property 'createdAt' found for type 'User'"
}
```

### 2. Dashboard Online

Endpoint: `GET /dashboard/online?page=0&size=20`
Status: `400`
Error:

```json
{
  "success": false,
  "message": "Could not resolve attribute 'online' of 'com.dta.Dating_App.entitys.User'"
}
```

### 3. Users Filter

Endpoint: `POST /users/filter`
Status: `400`
Error:

```json
{
  "success": false,
  "message": "Could not write JSON: failed to lazily initialize a collection of role: com.dta.Dating_App.entitys.User.payments: could not initialize proxy - no Session"
}
```

### 4. Subscription Status

Endpoint: `GET /subscription/status?userId=2`
Status: `400`
Error:

```json
{
  "success": false,
  "message": "Could not write JSON: could not initialize proxy [com.dta.Dating_App.entitys.User#2] - no Session"
}
```

### 5. Privacy Details

Endpoint: `GET /privacy/details?userId=2`
Status: `400`
Error:

```json
{
  "success": false,
  "message": "Terms not accepted yet"
}
```

This one is business-state related, not necessarily a backend bug.

## Data Consistency Issues

### 1. Profile Image Inconsistency

- `GET /profile/me/2` returns a non-empty `profileImageUrl`
- `GET /users/2/images` returns `[]`

This means image-related endpoints are inconsistent for the same user.

### 2. Connection Endpoint Mismatch

- `GET /connections/list?userId=2` returns data
- `GET /connections/sent?userId=2` returns `[]`
- `GET /connections/received?userId=2` returns `[]`
- `GET /connections/status?user1=2&user2=2` returns `NONE`

These results do not look aligned and should be verified.

### 3. User Identifier Mismatch

- Login works with mobile number `8887626782`
- `GET /profile/me/8887626782` returns `User not found`
- `GET /profile/me/2` works correctly

This suggests the API expects an internal numeric user id for profile endpoints, while login/JWT subject appears to be based on mobile number.

That mismatch can easily break session restore and profile fetch logic in clients if not handled consistently by the backend.

## Search Endpoint Observation

Endpoint: `POST /search`
Status: `200 OK`

It returns user/profile data, but response structure appears deeply nested and recursive because `user -> profile -> user -> profile` repeats heavily.

This may cause oversized payloads or serialization problems in clients.

## Connection List Observation

Endpoint: `GET /connections/list?userId=2`
Status: `200 OK`

This endpoint also appears to return a heavily nested recursive payload, similar to `/search`.

This may cause:

- very large payload sizes
- serialization overhead
- slow UI rendering
- risk of client parsing/performance issues

## Conclusion

Profiles are present in the API.
The main issue is that listing endpoints required for showing many profiles in the app are broken.

Backend needs to fix:

- `/dashboard/recent`
- `/dashboard/online`
- `/users/filter`
- `/subscription/status`

Backend should also review:

- recursive serialization in `/search`
- recursive serialization in `/connections/list`
- inconsistent image data between `/profile/me/{id}` and `/users/{id}/images`
- invalid-looking profile field values such as `height: 6`, `appearance: "0"`, `bodyType: "0"`, `englishLevel: "string"`, and `ethnicity: "string"`
- mismatch between `/connections/list`, `/connections/sent`, `/connections/received`, and `/connections/status`
- inconsistency between login/mobile identity and numeric profile identity

After these fixes, profile listing in testing should work much more reliably.
