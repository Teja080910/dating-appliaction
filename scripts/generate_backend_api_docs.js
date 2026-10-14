const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const i18nDir = path.join(rootDir, 'i18n');
const outputFile = path.join(rootDir, 'API_SPECIFICATION.md');

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'ro', name: 'Romanian (Română)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'zh', name: 'Chinese (Simplified - 简体中文)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'id', name: 'Indonesian (Bahasa Indonesia)' },
];

console.log('Generating comprehensive API Specification document...');

let doc = `# AMARA Dating App — Complete Backend API Specification & Integration Guide
**Document Version:** 3.1 (Complete Frontend Contracts & Multi-Language Seed Reference)  
**Target Audience:** Backend Developers, API Engineers, Database Administrators, QA  
**Companion App Client:** React Native Mobile Client (iOS & Android) with Dark/Light Mode & 10 Supported Languages  

---

## 📋 Table of Contents
1. [Architecture Overview & Global Standards](#1-architecture-overview--global-standards)
2. [Domain 1: Authentication & Account Lifecycle](#2-domain-1-authentication--account-lifecycle)
3. [Domain 2: Onboarding & Profile Setup (Steps 1 to 8)](#3-domain-2-onboarding--profile-setup-steps-1-to-8)
4. [Domain 3: User Profile, Presence & Preferences](#4-domain-3-user-profile-presence--preferences)
5. [Domain 4: Discovery Feed & Search Settings](#5-domain-4-discovery-feed--search-settings)
6. [Domain 5: Connections, Invites & Mutual Matches](#6-domain-5-connections-invites--mutual-matches)
7. [Domain 6: Telegram Connect & Direct Chat Unlocking](#7-domain-6-telegram-connect--direct-chat-unlocking)
8. [Domain 7: Subscriptions & Payments (Razorpay)](#8-domain-7-subscriptions--payments-razorpay)
9. [Domain 8: Geolocation & Multi-City Matching](#9-domain-8-geolocation--multi-city-matching)
10. [Domain 9: Safety, User Reporting & Blocking](#10-domain-9-safety-user-reporting--blocking)
11. [Domain 10: Help Desk & Customer Support](#11-domain-10-help-desk--customer-support)
12. [Domain 11: Notifications & Communication Logs](#12-domain-11-notifications--communication-logs)
13. [Domain 12: Legal, Terms & Privacy Acceptance](#13-domain-12-legal-terms--privacy-acceptance)
14. [Domain 13: PostgreSQL Production Database Schema DDL](#14-domain-13-postgresql-production-database-schema-ddl)
15. [Domain 14: Multi-Language Database Seed (10 Languages / 635 Keys Each)](#15-domain-14-multi-language-database-seed-10-languages--635-keys-each)

---

## 1. Architecture Overview & Global Standards

### 1.1 Base URLs & Environments
* **Production**: \`https://api.amara-app.com/api/v1\`
* **Staging / QA**: \`https://staging-api.amara-app.com/api/v1\`
* **Local Development**: \`http://localhost:9395\` or LAN IP \`http://192.168.1.x:9395\`
* **Client Protocol**: RESTful JSON over HTTPS (with Multipart for image uploads).

### 1.2 Authentication & Authorization
* **Mechanism**: HTTP Bearer Token (JWT).
* **Header Format**:
  \`\`\`http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  \`\`\`
* All endpoints require an active Bearer Token unless explicitly marked as **Public** in this document.
* **Token Expiration**: Recommended 30 days for mobile devices (with optional refresh token rotation).
* The Axios client automatically attaches this token to every non-public request.

### 1.3 Standard Response Formats

#### Success Envelope (HTTP 200 OK / 201 Created)
\`\`\`json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": { ... }
}
\`\`\`
*(Note: Some entity endpoints return direct objects or arrays as documented per endpoint below).*

#### Error Envelope (HTTP 400, 401, 403, 404, 409, 422, 500)
\`\`\`json
{
  "status": "error",
  "message": "Human-readable error description for client display",
  "code": "ERROR_CODE_STRING",
  "details": null
}
\`\`\`

### 1.4 User Identifier Conventions
* Primary User Identifiers are string tokens formatted as \`usr_man_<id>\` or \`usr_woman_<id>\` or UUIDv4 (e.g., \`"usr_man_101"\`, \`"usr_woman_201"\`).
* Both numeric \`id\` and alphanumeric \`userId\` must be consistently supported by the backend.

---

## 2. Domain 1: Authentication & Account Lifecycle

### 💡 Development Environment OTP Note
* For local development, QA testing, and automated tests, the backend should accept the static test code **\`123456\`** for \`POST /verify-register/otp\` and \`POST /forgot-password/reset\`.
* In production (\`NODE_ENV === 'production'\`), real email/SMS dispatch should be executed, and the OTP must not be exposed in client-facing logs.

---

### 2.1 Initiate Registration
* **Endpoint**: \`POST /register\` (or \`POST /auth/register\`)
* **Access**: Public
* **Description**: Initiates registration with name, email (or mobile), password, and confirmPassword. Dispatches an OTP verification code.
* **Request Body**:
  \`\`\`json
  {
    "name": "Rahul Sharma",
    "email": "rahul@amara.com",
    "password": "Password@123",
    "confirmPassword": "Password@123",
    "mobile": "9876543210"
  }
  \`\`\`
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "status": "success",
    "message": "Registration initiated. Verification code sent to rahul@amara.com.",
    "sessionId": "sess_reg_1728901234",
    "data": {
      "sessionId": "sess_reg_1728901234",
      "email": "rahul@amara.com",
      "name": "Rahul Sharma"
    }
  }
  \`\`\`
* **Error Responses**:
  - \`400 Bad Request\`: \`{ "status": "error", "message": "Please enter a valid email address." }\`
  - \`400 Bad Request\`: \`{ "status": "error", "message": "Passwords do not match." }\`
  - \`400 Bad Request\`: \`{ "status": "error", "message": "Password must be at least 6 characters." }\`
  - \`409 Conflict\`: \`{ "status": "error", "message": "An account with this email already exists." }\`

---

### 2.2 Verify Registration OTP & Complete Account Creation
* **Endpoint**: \`POST /verify-register/otp\` (or \`POST /verifyOtp\`)
* **Access**: Public
* **Description**: Verifies the OTP, creates the user record, and issues a JWT token.
* **Request Body**:
  \`\`\`json
  {
    "email": "rahul@amara.com",
    "otp": "123456",
    "sessionId": "sess_reg_1728901234",
    "name": "Rahul Sharma",
    "password": "Password@123"
  }
  \`\`\`
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "status": "success",
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "usr_man_101",
    "user": {
      "id": 1,
      "userId": "usr_man_101",
      "name": "Rahul Sharma",
      "displayName": "Rahul Sharma",
      "email": "rahul@amara.com",
      "mobile": "9876543210",
      "gender": "man",
      "telegramUsername": "",
      "profile": null
    }
  }
  \`\`\`
* **Error Response (400 Bad Request)**:
  \`\`\`json
  {
    "status": "error",
    "message": "Invalid OTP. Please check and try again."
  }
  \`\`\`

---

### 2.3 User Login
* **Endpoint**: \`POST /login\` (or \`POST /auth/login\`)
* **Access**: Public
* **Description**: Authenticates user using email (or mobile) and password. Returns JWT token and user profile.
* **Request Body**:
  \`\`\`json
  {
    "email": "rahul@amara.com",
    "password": "Password@123"
  }
  \`\`\`
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "usr_man_101",
    "user": {
      "id": 1,
      "userId": "usr_man_101",
      "name": "Rahul Sharma",
      "displayName": "Rahul Sharma",
      "email": "rahul@amara.com",
      "mobile": "9876543210",
      "gender": "man",
      "telegramUsername": "rahul_amara",
      "profile": {
        "age": 28,
        "bio": "Entrepreneur and travel enthusiast.",
        "photos": ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800"],
        "photoVerified": true
      }
    }
  }
  \`\`\`
* **Error Responses**:
  - \`400 Bad Request\`: \`{ "status": "error", "message": "Email and password are required." }\`
  - \`401 Unauthorized\`: \`{ "status": "error", "message": "Invalid credentials. Please verify your password." }\`
  - \`404 Not Found\`: \`{ "status": "error", "message": "Account not found. Please register first." }\`

---

### 2.4 Forgot Password — Send OTP
* **Endpoint**: \`POST /forgot-password/send-otp\`
* **Access**: Public
* **Request Body**:
  \`\`\`json
  {
    "email": "rahul@amara.com"
  }
  \`\`\`
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "status": "success",
    "message": "Password reset OTP sent successfully to rahul@amara.com",
    "sessionId": "reset_sess_998124"
  }
  \`\`\`

---

### 2.5 Forgot Password — Reset Password
* **Endpoint**: \`POST /forgot-password/reset\`
* **Access**: Public
* **Request Body**:
  \`\`\`json
  {
    "email": "rahul@amara.com",
    "otp": "123456",
    "sessionId": "reset_sess_998124",
    "newPassword": "NewPassword@123",
    "confirmPassword": "NewPassword@123"
  }
  \`\`\`
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "status": "success",
    "message": "Password reset successfully. You can now login with your new password."
  }
  \`\`\`

---

### 2.6 Account Lifecycle (Deactivate, Activate, Delete)
* **Deactivate Account**: \`POST /account/deactivate\` (Bearer Auth)
  - Query/Body: \`{ userId?: string }\`
  - Response: \`{ "status": "success", "message": "Account deactivated successfully." }\`
* **Reactivate Account**: \`PUT /account/activate\` (Bearer Auth)
  - Query/Body: \`{ userId?: string }\`
  - Response: \`{ "status": "success", "message": "Account reactivated successfully." }\`
* **Permanently Delete Account**: \`DELETE /account/delete\` (Bearer Auth)
  - Query/Body: \`{ userId?: string }\`
  - Action: Permanently purges user record, images, subscriptions, matches, and location data in compliance with GDPR.
  - Response: \`{ "status": "success", "message": "Account permanently deleted." }\`

---

## 3. Domain 2: Onboarding & Profile Setup (Steps 1 to 8)

The frontend guides newly registered users through an 8-step setup sequence:

### 3.1 Step 1: Gender & Orientation
* **Endpoint**: \`POST /profile/gender-orientation\`
* **Access**: Bearer Auth
* **Request Body**:
  \`\`\`json
  {
    "userId": "usr_man_101",
    "gender": "man",
    "orientation": "straight"
  }
  \`\`\`
  *(Allowed values: gender: \`"man"\`, \`"woman"\`, \`"lgbtqia"\`; orientation: \`"straight"\`, \`"lgbtqia"\`)*
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "status": "success",
    "message": "Gender and orientation saved successfully",
    "data": {
      "userId": "usr_man_101",
      "gender": "man",
      "orientation": "straight"
    }
  }
  \`\`\`

### 3.2 Step 2: Display Name & Step 3: Date of Birth
* User provides their preferred display name and birthday.
* App enforces that the user must be at least 18 years old:
  - If underage: Rejects registration with \`"You must be at least 18 years old to use AMARA."\`
* Values are committed in final profile setup.

### 3.3 Step 4: Biometric Selfie Verification
* **Endpoint**: \`PUT /profile/selfie/verify/:userId\` (or \`POST /profile/selfie/upload\`)
* **Access**: Bearer Auth
* **Description**: User performs a live 3D head scan via camera. Upon completion, marks \`photoVerified: true\` on their profile to display the blue verified badge.
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "status": "success",
    "message": "Verified",
    "data": {
      "userId": "usr_man_101",
      "photoVerified": true
    }
  }
  \`\`\`

### 3.4 Step 5: Multi-Photo Upload (3 to 6 Photos)
* **Upload Image**: \`POST /profile/upload-image\`
  - **Headers**: \`Content-Type: multipart/form-data\`
  - **Form Field**: \`photo\` or \`image\` (binary JPEG/PNG image)
  - **Query/Param**: \`uid?: string\`
  - **Success Response (200 OK)**:
    \`\`\`json
    {
      "status": "success",
      "message": "Image uploaded successfully",
      "imageUrl": "https://cdn.amara-app.com/photos/usr_man_101_1.jpg",
      "data": {
        "id": 101,
        "imageUrl": "https://cdn.amara-app.com/photos/usr_man_101_1.jpg",
        "isProfile": true
      }
    }
    \`\`\`
* **Get User Gallery Images**: \`GET /users/:userId/images\`
  - **Success Response (200 OK)**:
    \`\`\`json
    [
      { "id": 101, "userId": "usr_man_101", "imageUrl": "https://cdn.amara-app.com/photos/1.jpg", "isProfile": true },
      { "id": 102, "userId": "usr_man_101", "imageUrl": "https://cdn.amara-app.com/photos/2.jpg", "isProfile": false },
      { "id": 103, "userId": "usr_man_101", "imageUrl": "https://cdn.amara-app.com/photos/3.jpg", "isProfile": false }
    ]
    \`\`\`
* **Set Primary Profile Avatar**: \`PUT /users/:userId/profile-photo/:imageId\`
  - **Success Response (200 OK)**: \`{ "status": "success", "message": "Profile photo set successfully" }\`
* **Delete Photo**: \`DELETE /users/images/:imageId\` (or \`DELETE /users/:userId/images/:imageId\`)
  - **Success Response (200 OK)**: \`{ "status": "success", "message": "Image deleted successfully" }\`

### 3.5 Step 6: Connect Telegram
* **Endpoint**: \`POST /telegram/connect\`
* **Request Body / Query**: \`{ "userId": "usr_man_101", "username": "rahul_amara" }\`
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "status": "success",
    "message": "Telegram account connected successfully",
    "telegramUsername": "rahul_amara",
    "telegramLink": "https://t.me/rahul_amara"
  }
  \`\`\`

### 3.6 Step 7: About Me & Step 8: Extended Lifestyle Setup
* **Endpoint**: \`POST /profile/:userId/setup\`
* **Request Body**:
  \`\`\`json
  {
    "name": "Rahul Sharma",
    "displayName": "Rahul",
    "gender": "man",
    "orientation": "straight",
    "age": 28,
    "dob": "1998-05-15",
    "bio": "Entrepreneur and travel enthusiast passionate about art, tech, and fitness.",
    "height": 178,
    "appearance": "Attractive",
    "bodyType": "Athletic",
    "language": "English, Spanish",
    "englishLevel": "Good",
    "ethnicity": "South Asian",
    "kidCount": "Someday",
    "netWorth": "$250k+",
    "lookingFor": "Relationship, Casual Dating",
    "smoke": "No",
    "drink": "Socially",
    "photos": [
      "https://cdn.amara-app.com/photos/usr_man_101_1.jpg",
      "https://cdn.amara-app.com/photos/usr_man_101_2.jpg",
      "https://cdn.amara-app.com/photos/usr_man_101_3.jpg"
    ]
  }
  \`\`\`
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "status": "success",
    "message": "Profile setup completed successfully"
  }
  \`\`\`

### 3.7 Profile Completion Calculation
* **Endpoint**: \`POST /profile/completion\` or \`GET /profile/completion\`
* **Query**: \`?userId=usr_man_101\`
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "percentage": 100,
    "isComplete": true,
    "missingFields": []
  }
  \`\`\`

---

## 4. Domain 3: User Profile, Presence & Preferences

### 4.1 Get Full Profile
* **Endpoint**: \`GET /profile/me/:userId\` (or \`POST /profile/me?userId=...\`)
* **Access**: Bearer Auth
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "userId": "usr_man_101",
    "id": 1,
    "name": "Rahul Sharma",
    "displayName": "Rahul",
    "email": "rahul@amara.com",
    "mobile": "9876543210",
    "gender": "man",
    "orientation": "straight",
    "age": 28,
    "dob": "1998-05-15",
    "bio": "Entrepreneur and travel enthusiast.",
    "height": 178,
    "appearance": "Attractive",
    "bodyType": "Athletic",
    "language": "English, Spanish",
    "englishLevel": "Good",
    "ethnicity": "South Asian",
    "kidCount": "Someday",
    "netWorth": "$250k+",
    "lookingFor": "Relationship",
    "smoke": "No",
    "drink": "Socially",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "photoVerified": true,
    "isOnline": true,
    "lastActive": "Just now",
    "telegramUsername": "rahul_amara",
    "photos": [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800"
    ]
  }
  \`\`\`

### 4.2 Segmented Profile Updates
* **Basic Details**: \`PUT /profile/update-basic\` (or \`PUT /profile/update\`)
  \`\`\`json
  {
    "name": "Rahul Sharma",
    "displayName": "Rahul S.",
    "bio": "Updated bio text here...",
    "dob": "1998-05-15",
    "age": 28
  }
  \`\`\`
* **Physical & Background Details**: \`PUT /profile/update-details\`
  \`\`\`json
  {
    "height": 180,
    "language": "English, Spanish, Hindi",
    "appearance": "Attractive",
    "bodyType": "Athletic",
    "englishLevel": "Very Good",
    "ethnicity": "South Asian",
    "kidCount": "No kids",
    "netWorth": "$250k - $500k"
  }
  \`\`\`
* **Lifestyle & Preferences**: \`PUT /profile/update-preferences\`
  \`\`\`json
  {
    "lookingFor": "Long-term relationship",
    "smoke": "No",
    "drink": "Socially",
    "ethnicity": "South Asian"
  }
  \`\`\`
* **Online Presence Status**:
  - \`PUT /status/online?userId=usr_man_101\`
  - \`PUT /status/offline?userId=usr_man_101\`

---

## 5. Domain 4: Discovery Feed & Search Settings

### 5.1 Main Feed Algorithm
* **Endpoint**: \`GET /home/:userId\`
* **Business Logic**:
  1. Filters prospective matches based on user's gender, orientation, and search settings.
  2. For heterosexual men: default feed shows women profiles.
  3. **Strict Block Filtering**: Must exclude all users present in the caller's \`blocked_users\` table.
  4. Returns curated card array with distance, bio, verification status, and gallery photos.
* **Success Response (200 OK)**:
  \`\`\`json
  [
    {
      "id": "usr_woman_201",
      "userId": "usr_woman_201",
      "name": "Ananya Roy",
      "displayName": "Ananya",
      "age": 24,
      "gender": "woman",
      "city": "Mumbai",
      "country": "India",
      "distance": "5 km away",
      "bio": "Architect & design lover.",
      "photoVerified": true,
      "isOnline": true,
      "lastActive": "5m ago",
      "photos": [
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800"
      ],
      "appearance": "Attractive",
      "bodyType": "Slim",
      "height": 165,
      "language": "English, Spanish",
      "lookingFor": "Long-term relationship",
      "smoke": "No",
      "drink": "No"
    }
  ]
  \`\`\`

### 5.2 Filtered Search
* **Endpoint**: \`POST /search\` (or \`POST /users/filter\`)
* **Request Body**:
  \`\`\`json
  {
    "ageRange": [21, 32],
    "distance": 50,
    "searchWorldwide": false,
    "showMe": ["women"],
    "lookingFor": ["Relationship"],
    "bodyType": "Slim",
    "height": [150, 175],
    "smoke": "No",
    "drink": "No"
  }
  \`\`\`
  *(Note: Men can select \`showMe: ["women"]\`, \`["men"]\`, or \`["women", "men"]\`)*

### 5.3 Recent & Online Feeds
* **Online Members**: \`GET /dashboard/online\`
* **Newest Members**: \`GET /dashboard/recent\`

---

## 6. Domain 5: Connections, Invites & Mutual Matches

### 6.1 Send Connection Invitation
* **Endpoint**: \`POST /connections/send\`
* **Quota Enforcement**:
  - Checks sender's active subscription tier in \`subscriptions\` table.
  - Free: 0 or restricted daily invites.
  - Silver: 10 invites / day.
  - Gold: 20 invites / day.
  - Elite: Unlimited invites.
  - If limit reached: Returns \`403 Forbidden\` with \`code: "QUOTA_EXCEEDED"\`.
* **Request Body**:
  \`\`\`json
  {
    "senderId": "usr_man_101",
    "receiverId": "usr_woman_201"
  }
  \`\`\`
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "status": "success",
    "message": "Invitation sent successfully",
    "data": {
      "id": 501,
      "requestId": "req_501",
      "senderId": "usr_man_101",
      "receiverId": "usr_woman_201",
      "status": "PENDING",
      "createdAt": "2026-10-14T16:00:00Z"
    }
  }
  \`\`\`

### 6.2 Sent & Received Invites
* **Sent**: \`GET /connections/sent?userId=usr_man_101\`
  \`\`\`json
  [
    {
      "id": 501,
      "requestId": "req_501",
      "senderId": "usr_man_101",
      "receiverId": "usr_woman_201",
      "status": "PENDING",
      "createdAt": "2026-10-14T16:00:00Z",
      "receiverProfile": { "name": "Ananya Roy", "photos": ["https://..."] }
    }
  ]
  \`\`\`
* **Received**: \`GET /connections/received?userId=usr_woman_201\`
* **Accept Invitation**: \`PUT /connections/accept\`
  - Request Body: \`{ "requestId": "req_501", "userId": "usr_woman_201" }\`
  - Response:
    \`\`\`json
    {
      "status": "success",
      "message": "Connection accepted. You can now chat on Telegram!",
      "match": true,
      "telegramLink": "https://t.me/rahul_amara"
    }
    \`\`\`
* **Reject Invitation**: \`PUT /connections/reject\` \`{ "requestId": "req_501" }\`
* **Check Status**: \`GET /connections/status?senderId=usr_man_101&receiverId=usr_woman_201\`
  - Response: \`{ "status": "PENDING", "requestId": "req_501", "canInvite": false }\`
* **Mutual Matches List**: \`GET /connections/list?userId=usr_man_101\`
  - Returns array of accepted connections with unlocked Telegram links.
* **Restore Access**: \`POST /connections/restore-access\` \`{ "requestId": "req_501" }\`

---

## 7. Domain 6: Telegram Connect & Direct Chat Unlocking

The AMARA platform unlocks authentic 1-on-1 private messaging via Telegram upon mutual match:

### 7.1 Telegram Integration Architecture
* **Direct Match Chatting (User-to-User)**:
  - When two users match or an invitation is accepted, the frontend directly opens the matched user's personal Telegram handle via \`tg://resolve?domain=<username>\` (falling back to \`https://t.me/<username>\`).
  - **Does NOT require a bot** to facilitate the chat — it connects users directly in Telegram DMs.
* **Official Amara Telegram Bot (\`@amara_dating_bot\`)**:
  - Used during onboarding (Step 5: Connect Telegram) to verify identity, welcome users, provide login/help commands (\`/start\`, \`/login\`, \`/help\`, \`/connect\`), and dispatch match/invitation alerts.

---

### 7.2 API Endpoints
* **Connect Username**: \`POST /telegram/connect\`
  - Request: \`{ "userId": "usr_man_101", "username": "rahul_amara" }\`
  - Response (200 OK):
    \`\`\`json
    {
      "status": "success",
      "message": "Telegram account connected successfully",
      "telegramUsername": "rahul_amara",
      "telegramLink": "https://t.me/rahul_amara"
    }
    \`\`\`
* **Get Link**: \`GET /telegram/link?userId=usr_man_101\`
  - Response (200 OK):
    \`\`\`json
    {
      "status": "success",
      "telegramUsername": "rahul_amara",
      "telegramLink": "https://t.me/rahul_amara"
    }
    \`\`\`
* **Disconnect**: \`DELETE /telegram/disconnect?userId=usr_man_101\`
  - Response (200 OK):
    \`\`\`json
    {
      "status": "success",
      "message": "Telegram account disconnected successfully"
    }
    \`\`\`

---

### 7.3 Backend Developer Guide: Production Setup & 24/7 Hosting for \`telegram-bot/\`

> [!IMPORTANT]
> The mobile frontend connects to the Telegram Bot via \`tg://resolve?domain=amara_dating_bot\`. For this bot to actively respond to users when they install the APK and tap "Open Bot", the backend developer **must host and run \`telegram-bot/bot.js\` continuously (24/7)** on the production backend server.

#### Step 1: Create or Confirm the Production Bot with Telegram @BotFather
1. Open Telegram and search for **\`@BotFather\`**.
2. Run \`/newbot\` (or \`/mybots\` to manage an existing bot).
3. Set the Bot Name (e.g. \`Amara Dating\`) and Username (e.g. \`amara_dating_bot\`).
4. Copy the API Token provided by BotFather (format: \`123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ\`).
5. *(Note: If you choose a different username, inform the frontend team to update \`AMARA_BOT_USERNAME\` in \`src/utils/telegramHelper.ts\`)*.

#### Step 2: Configure Environment Variables
Inside the \`telegram-bot/\` directory on your server, create or update \`.env\`:
\`\`\`env
TELEGRAM_BOT_TOKEN="YOUR_REAL_BOT_TOKEN_FROM_BOTFATHER"
APP_LOGIN_URL="amara://login"
\`\`\`

#### Step 3: Deploy & Run 24/7 on the Linux Backend Server using PM2
The bot is a standard Node.js daemon using the Telegraf framework. To ensure it runs 24/7 and automatically restarts if the server reboots:

\`\`\`bash
# 1. Navigate to the bot directory
cd /path/to/amara/telegram-bot

# 2. Install production dependencies
npm install --production

# 3. Install PM2 process manager globally (if not already installed)
sudo npm install -g pm2

# 4. Start the bot daemon
pm2 start bot.js --name "amara-telegram-bot"

# 5. Save the PM2 process list
pm2 save

# 6. Configure PM2 to auto-start on server reboot
pm2 startup
\`\`\`

#### Step 4: Verification & Logs
* To check bot status: \`pm2 status amara-telegram-bot\`
* To view live bot logs: \`pm2 logs amara-telegram-bot\`
* Open Telegram on your phone and send \`/start\` to \`@amara_dating_bot\`. The bot will immediately reply with the welcome card and action buttons.

#### Step 5: (Optional) Sending Automated Match Notifications via the Bot
When a user receives a new invitation or mutual match, the backend can trigger the bot to dispatch an instant push message to the user's Telegram:
\`\`\`javascript
// Example backend notification dispatch:
const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

async function notifyUserOnMatch(telegramChatId, matchedUserName) {
  try {
    await bot.telegram.sendMessage(
      telegramChatId,
      \`🎉 *It's a Match!*\n\nYou and *\${matchedUserName}* liked each other on Amara! Open Amara or tap below to start chatting.\`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Failed to dispatch Telegram message:', error);
  }
}
\`\`\`

---

## 8. Domain 7: Subscriptions & Payments (Razorpay)

### 8.1 Plan Hierarchy
| Plan Code | Price (INR) | Validity | Daily Invites | Key Features |
| :--- | :--- | :--- | :--- | :--- |
| **FREE** | ₹0 | Unlimited | 0 (or trial) | Browse discovery feed |
| **SILVER** | ₹1,499 | 30 Days | 10 / day | Unlocks Telegram chat, standard search |
| **GOLD** | ₹2,999 | 90 Days | 20 / day | Priority discovery, worldwide search, badge |

### 8.2 Create Razorpay Order
* **Endpoint**: \`POST /razorpay/create-order\`
* **Request**: \`{ "plan": "GOLD", "userId": "usr_man_101" }\`
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "status": "success",
    "orderId": "order_RZP_102938",
    "amount": 299900,
    "currency": "INR",
    "key": "rzp_live_xxxxxxxxxxxx",
    "plan": "GOLD",
    "name": "Amara Gold Plan",
    "description": "Unlimited invitations & priority matching for 90 days"
  }
  \`\`\`

### 8.3 Verify Signature & Activate Subscription
* **Endpoint**: \`POST /razorpay/verify\`
* **Verification Algorithm**:
  \`\`\`python
  # Server-side signature check
  expected_signature = hmac.new(
      bytes(RAZORPAY_SECRET, 'utf-8'),
      bytes(order_id + "|" + payment_id, 'utf-8'),
      hashlib.sha256
  ).hexdigest()
  \`\`\`
* **Request Body**:
  \`\`\`json
  {
    "orderId": "order_RZP_102938",
    "paymentId": "pay_RZP_998877",
    "signature": "a1b2c3d4e5f6...",
    "plan": "GOLD",
    "userId": "usr_man_101"
  }
  \`\`\`
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "status": "success",
    "message": "Payment verified and subscription activated successfully",
    "plan": "GOLD",
    "durationDays": 90,
    "expiresAt": "2027-01-12T16:00:00Z"
  }
  \`\`\`

### 8.4 Check Subscription Status & Days Remaining
* **Status**: \`GET /subscriber/status?userId=usr_man_101\`
  \`\`\`json
  {
    "isSubscriber": true,
    "plan": "GOLD",
    "status": "ACTIVE",
    "expiresAt": "2027-01-12T16:00:00Z",
    "daysRemaining": 90,
    "dailyRequestLimit": 20
  }
  \`\`\`
* **Days Remaining**: \`GET /subscriber/remaining-days?userId=usr_man_101\`
  \`\`\`json
  {
    "remainingDays": 90,
    "plan": "GOLD",
    "isActive": true
  }
  \`\`\`
* **Webhook**: \`POST /razorpay/webhook\` (handles \`order.paid\`, \`payment.failed\`, \`subscription.cancelled\`)

---

## 9. Domain 8: Geolocation & Multi-City Matching

* **Add New Location**: \`POST /location/add\`
  - Request: \`{ "userId": "usr_man_101", "city": "Mumbai", "state": "Maharashtra", "country": "India", "latitude": 19.0760, "longitude": 72.8777 }\`
  - Response: \`{ "status": "success", "locationId": 10 }\`
* **Switch Active Location**: \`PUT /location/switch?userId=usr_man_101&locationId=10\`
* **Location History**: \`GET /location/history/:userId\`
* **Current Location**: \`GET /location/current/:userId\`
* **Nearby Profiles by Radius**: \`GET /location/nearby?userId=usr_man_101&radius=50\`

---

## 10. Domain 9: Safety, User Reporting & Blocking

### 10.1 Block User
* **Endpoint**: \`POST /reports/block\` (or \`POST /users/block\`)
* **Immediate Effect**:
  - When User A blocks User B, User B is immediately removed from User A's discovery feed, search results, and chat inbox.
  - User A is also removed from User B's feeds.
* **Request Body**:
  \`\`\`json
  {
    "blockerUserId": "usr_man_101",
    "blockedUserId": "usr_woman_207"
  }
  \`\`\`
* **Success Response (200 OK)**:
  \`\`\`json
  {
    "status": "success",
    "message": "User has been blocked. They will no longer appear in your feeds or messages.",
    "blockedUserId": "usr_woman_207"
  }
  \`\`\`
* **List Blocked Users**: \`GET /reports/blocked?userId=usr_man_101\` (or \`GET /users/blocked\`)
* **Unblock User**: \`POST /reports/unblock\` (or \`POST /users/unblock\`)
  - Request: \`{ "blockerUserId": "usr_man_101", "unblockedUserId": "usr_woman_207" }\`
  - Response: \`{ "status": "success", "message": "User unblocked successfully." }\`

### 10.2 Report Profile
* **Endpoint**: \`POST /reports/report\`
* **Request Body**:
  \`\`\`json
  {
    "reporterUserId": "usr_man_101",
    "reportedUserId": "usr_woman_207",
    "reason": "SPAM_SCAM",
    "details": "Soliciting external money transfer links."
  }
  \`\`\`
  *(Allowed reasons: \`"SPAM_SCAM"\`, \`"INAPPROPRIATE_PHOTOS"\`, \`"HARASSMENT"\`, \`"UNDERAGE"\`, \`"FAKE_PROFILE"\`, \`"OTHER"\`)*
* **List Reports by User**: \`GET /reports/my?userId=usr_man_101\`
* **Moderator Queue**: \`GET /reports/against\` & \`PUT /reports/resolve/:reportId\` \`{ "status": "RESOLVED" }\`

---

## 11. Domain 10: Help Desk & Customer Support

* **Create Support Ticket**: \`POST /support/create\`
  - Request: \`{ "userId": "usr_man_101", "subject": "Verification Question", "message": "How do I upgrade to Gold plan?", "priority": "MEDIUM" }\`
  - Response: \`{ "status": "success", "ticketId": "ticket_101", "status": "OPEN" }\`
* **List User's Tickets**: \`GET /support/my?userId=usr_man_101\`
* **Filter Tickets**: \`GET /support/status?userId=usr_man_101&status=OPEN\`
* **Close Ticket**: \`PUT /support/close/:ticketId\`

---

## 12. Domain 11: Notifications & Communication Logs

* **Get In-App Notifications**: \`GET /notification?userId=usr_man_101\`
  \`\`\`json
  [
    {
      "id": "notif_1",
      "userId": "usr_man_101",
      "title": "New Match!",
      "message": "Ananya accepted your invitation.",
      "type": "MATCH",
      "read": false,
      "createdAt": "2026-10-14T15:00:00Z"
    }
  ]
  \`\`\`
* **Mark Read**: \`PUT /notification/read/:id\`
* **Get Preferences**: \`GET /notification/preferences?userId=usr_man_101\`
  \`\`\`json
  {
    "userId": "usr_man_101",
    "emailNotifications": true,
    "pushNotifications": true,
    "matchAlerts": true,
    "invitationAlerts": true
  }
  \`\`\`
* **Update Preferences**: \`PUT /notification/preferences\`
  - Request: \`{ "emailNotifications": true, "pushNotifications": false }\`
* **Email Dispatch Log**: \`GET /emails/my?userId=usr_man_101\`
* **Trigger Push Notification**: \`POST /notification/push\` \`{ "userId": "usr_man_101", "title": "...", "body": "..." }\`

---

## 13. Domain 12: Legal, Terms & Privacy Acceptance

* **Check Terms Status**: \`GET /privacy/status?userId=usr_man_101\`
  - Response: \`{ "accepted": true, "version": "2.1", "acceptedAt": "2026-10-14T10:00:00Z" }\`
* **Accept Terms**: \`POST /privacy/accept\`
  - Request: \`{ "userId": "usr_man_101", "version": "2.1" }\`
  - Response: \`{ "status": "success", "message": "Terms accepted successfully" }\`
* **Fetch Privacy Content**: \`GET /privacy/details\`

---

## 14. Domain 13: PostgreSQL Production Database Schema DDL

The following relational DDL can be directly executed in PostgreSQL to create all necessary tables:

\`\`\`sql
-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(32) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(128) NOT NULL,
    display_name VARCHAR(128),
    gender VARCHAR(32) NOT NULL DEFAULT 'man',
    orientation VARCHAR(32) NOT NULL DEFAULT 'straight',
    telegram_username VARCHAR(128),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    age INT,
    dob DATE,
    bio TEXT,
    height INT DEFAULT 165,
    appearance VARCHAR(64),
    body_type VARCHAR(64),
    language VARCHAR(255),
    english_level VARCHAR(64),
    ethnicity VARCHAR(64),
    kid_count VARCHAR(64),
    net_worth VARCHAR(64),
    looking_for VARCHAR(255),
    smoke VARCHAR(64),
    drink VARCHAR(64),
    photo_verified BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. USER IMAGES TABLE
CREATE TABLE IF NOT EXISTS user_images (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_profile BOOLEAN DEFAULT FALSE,
    slot_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CONNECTIONS / INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS connections (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(64) UNIQUE NOT NULL,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_connection_pair UNIQUE(sender_id, receiver_id)
);

-- 5. BLOCKED USERS TABLE
CREATE TABLE IF NOT EXISTS blocked_users (
    id SERIAL PRIMARY KEY,
    blocker_user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    blocked_user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_block_pair UNIQUE(blocker_user_id, blocked_user_id)
);

-- 6. REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reported_user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason VARCHAR(64) NOT NULL,
    details TEXT,
    status VARCHAR(32) DEFAULT 'OPEN', -- OPEN, RESOLVED, DISMISSED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    plan VARCHAR(32) NOT NULL, -- FREE, SILVER, GOLD
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    razorpay_order_id VARCHAR(128),
    razorpay_payment_id VARCHAR(128),
    daily_request_limit INT DEFAULT 10,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. USER LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS user_locations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(128),
    country VARCHAR(128) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. APP TRANSLATIONS TABLE (For dynamic database-backed localization)
CREATE TABLE IF NOT EXISTS app_translations (
    id SERIAL PRIMARY KEY,
    string_key VARCHAR(255) NOT NULL,
    lang_code VARCHAR(10) NOT NULL, -- en, es, pt, de, fr, ro, ru, zh, ja, id
    translation_text TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_translation_entry UNIQUE(string_key, lang_code)
);

CREATE INDEX IF NOT EXISTS idx_trans_key_lang ON app_translations(string_key, lang_code);
\`\`\`

---

## 15. Domain 14: Multi-Language Database Seed (10 Languages / 635 Keys Each)

The AMARA mobile client supports **10 international languages** with exactly 635 standardized dot-notated string keys per language.

### How to insert these translations into your Database:
1. **Automated SQL Script Execution**:
   Run the generated seed script directly against your database:
   \`\`\`bash
   psql -U your_db_user -d amara_db -f scripts/seed_i18n.sql
   \`\`\`
2. **Method A (Relational Key-Value Table)**:
   Use the \`app_translations\` table schema above:
   \`\`\`sql
   INSERT INTO app_translations (string_key, lang_code, translation_text)
   VALUES ('home.usercard.nearby', 'en', 'Nearby')
   ON CONFLICT (string_key, lang_code) DO UPDATE SET translation_text = EXCLUDED.translation_text;
   \`\`\`
3. **Method B (JSONB Document Table / MongoDB)**:
   Store each language pack as a single document/row:
   \`\`\`sql
   CREATE TABLE IF NOT EXISTS language_packs (
       lang_code VARCHAR(10) PRIMARY KEY,
       name VARCHAR(64) NOT NULL,
       strings JSONB NOT NULL
   );
   \`\`\`
   And insert the JSON dictionary below directly into the \`strings\` column.

Below are the complete string dictionaries for all 10 supported languages ready for database seeding:
`;

for (const lang of languages) {
  const filePath = path.join(i18nDir, `${lang.code}.json`);
  let jsonData = {};
  if (fs.existsSync(filePath)) {
    jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  const keyCount = Object.keys(jsonData).length;
  doc += `\n### 15.${languages.indexOf(lang) + 1} ${lang.name} (\`${lang.code}\` — ${keyCount} Keys)\n\n`;
  doc += '```json\n';
  doc += JSON.stringify(jsonData, null, 2);
  doc += '\n```\n';
}

fs.writeFileSync(outputFile, doc, 'utf8');
console.log(`Successfully generated ${outputFile} (${fs.statSync(outputFile).size} bytes)!`);
