# AMARA Dating App - API Documentation (Updated)

This document provides a comprehensive overview of all API endpoints integrated into the AMARA Android application, based on the backend Swagger UI.

**Base URL**: `http://165.22.218.70:9395`

---

## 🔐 1. Authentication & Account Management

### Register User
*   **Endpoint**: `POST /register`
*   **Request Body**: `RegisterRequest` (name, mobile, password, confirmPassword, otp)

### Verify OTP (Registration)
*   **Endpoint**: `POST /verify-register/otp`
*   **Request Body**: JSON object `{ mobile, otp }`

### Login User
*   **Endpoint**: `POST /login`
*   **Request Body**: `LoginRequest` (mobile, password)

### Send/Verify OTP (Auth)
*   **Endpoints**:
    - `POST /auth/send-otp` (mobile, otp)
    - `POST /auth/verify-otp` (userId, mobile, otp)

### Password Management
*   **Endpoints**:
    - `POST /setting/change-password` (query: userId, oldPassword, newPassword)
    - `POST /forgot-password/send-otp` (mobile)
    - `POST /forgot-password/reset` (mobile, otp, newPassword)

### Account Actions
*   **Endpoints**:
    - `POST /account/deactivate` (query: userId)
    - `DELETE /account/delete` (query: userId)

---

## 👤 2. User Profile Management

### Get Profile
*   **Endpoint**: `GET /profile/me/{userId}`

### Setup Profile (Multipart)
*   **Endpoint**: `POST /profile/{userId}/setup`
*   **Body**: `data` (stringified ProfileRequestDTO), `photo` (file)

### Upload Images/Selfie
*   **Endpoints**:
    - `POST /profile/upload-image` (query: userId, body: image file)
    - `POST /profile/selfie/upload` (query: userId, body: selfie file)
    - `PUT /profile/selfie/verify/{userId}` (Verify selfie)

### Gender & Orientation
*   **Endpoint**: `POST /profile/gender-orientation` (userId, gender, orientation)

### User Images
*   **Endpoints**:
    - `GET /users/{userId}/images` (List images)
    - `PUT /users/{userId}/profile-photo/{imageId}` (Set profile photo)
    - `DELETE /users/images/{imageId}` (Delete image)

---

## 🔍 3. Discovery & Search

### Discovery Dashboards
*   **Endpoints**:
    - `GET /dashboard/recent?page=0&size=10`
    - `GET /dashboard/online?page=0&size=10`

### Advanced Search & Filter
*   **Endpoints**:
    - `POST /users/filter` (UserFilterRequest)
    - `POST /search` (SearchFilterRequest)

---

## 🤝 4. Connections & Interactions

### Requests
*   **Endpoints**:
    - `POST /connections/send` (senderId, receiverId)
    - `PUT /connections/accept` (requestId, userId)
    - `PUT /connections/decline` (requestId, userId)
    - `PUT /connections/cancel` (requestId, userId)

### Connection Lists & Status
*   **Endpoints**:
    - `GET /connections/list?userId={userId}` (All)
    - `GET /connections/sent?userId={userId}` (Sent)
    - `GET /connections/received?userId={userId}` (Received)
    - `GET /connections/status?user1={u1}&user2={u2}` (Status check)

---

## 📍 5. Location Services

### Actions
*   **Endpoints**:
    - `POST /location/add` (LocationRequest: city, state, lat, lng, etc.)
    - `PUT /location/switch?userId={userId}&locationId={locationId}`
    - `GET /location/current/{userId}`
    - `GET /location/history/{userId}`

---

## 💳 6. Payments & Subscriptions (Razorpay)

### Orders & Activation
*   **Endpoints**:
    - `POST /razorpay/create-order?userId={userId}&plan={plan}`
    - `POST /subscription/activate?userId={userId}&plan={plan}`
    - `GET /subscription/status?userId={userId}`

---

## ⚡ 7. Support, Reports & Integrations

### Support & Reports
*   **Endpoints**:
    - `POST /support/create` (Object)
    - `GET /support/my?userId={userId}`
    - `PUT /support/close/{ticketId}`
    - `POST /reports/report` (Object)
    - `GET /reports/my?userId={userId}`
    - `GET /reports/against?userId={userId}`

### Notification & Status
*   **Endpoints**:
    - `GET /notification?userId={userId}`
    - `PUT /notification/read/{notificationId}`
    - `PUT /status/online?userId={userId}`
    - `PUT /status/offline?userId={userId}`

### Telegram & privacy
*   **Endpoints**:
    - `POST /telegram/connect?userId={userId}&username={user}`
    - `GET /telegram/link?userId={userId}`
    - `POST /privacy/accept?userId={userId}`
    - `GET /privacy/status?userId={userId}`

---

**Last Updated**: 2026-03-28 (Synced with Swagger)
