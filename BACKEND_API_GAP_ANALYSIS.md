# Backend API Gap Analysis & Integration Report

I have analyzed the current frontend implementation against the provided `DattingApp.txt` API specification. Below is the status of each API and the documentation for missing endpoints.

## 1. Integrated & Matched APIs
The following APIs from `DattingApp.txt` are already integrated into the frontend service layer:

| Feature | Backend Endpoint (Legacy) | Frontend Service/Hook |
| :--- | :--- | :--- |
| **Registration** | `POST /register` | `useRegisterMutation.tsx` |
| **Login** | `POST /login` | `useLogin.tsx`, `useLoginMutation.tsx` |
| **Search** | `POST /search` | `useSearchAndDashboard.tsx` |
| **User Filter** | `POST /users/filter` | `useSearchAndDashboard.tsx`, `UserList.tsx` |
| **Razorpay Order** | `POST /razorpay/create-order` | `useRazorpay.tsx` |
| **Razorpay Verify** | `POST /razorpay/verify` | `useRazorpay.tsx` |
| **Razorpay Webhook** | `POST /razorpay/webhook` | `useRazorpay.tsx` |
| **Sub Request** | `POST /subscription/request` | `useSubscription.tsx` |
| **Sub Respond** | `PUT /subscription/respond` | `useSubscription.tsx` |
| **Sub Activate** | `POST /subscription/activate` | `useSubscription.tsx` |
| **Sub Status** | `GET /subscription/status` | `useSubscription.tsx` |

---

## 2. Missing APIs (Not in DattingApp.txt)
The frontend requires the following endpoints which were not listed in the provided documentation. Please provide these APIs or confirm if they should be aliased to existing ones.

### A. Profile Management
*   **Update Profile**
    *   **Description**: Updates user's bio, images, height, etc.
    *   **Proposed Endpoint**: `POST /auth/user/updateUser`
    *   **Used In**: `AboutProfileScreen.tsx`, `ProfileSettingsScreen.tsx`

*   **Delete Profile**
    *   **Description**: Permanently removes user account.
    *   **Proposed Endpoint**: `POST /auth/user/delete?userId={id}`
    *   **Used In**: `ProfileScreen.tsx`

### B. Dashboard & Discovery
*   **Online Users**
    *   **Description**: Fetches users who are currently active.
    *   **Proposed Endpoint**: `GET /dashboard/online?page=0&size=10`
    *   **Used In**: `HomeScreen.tsx` (Online filter)

*   **Recent Users**
    *   **Description**: Fetches users who recently joined.
    *   **Proposed Endpoint**: `GET /dashboard/recent?page=0&size=10`
    *   **Used In**: `HomeScreen.tsx` (Newest filter)

### C. Authentication Extras
*   **Forgot Password**
    *   **Description**: Sends OTP to mobile for password reset.
    *   **Proposed Endpoint**: `POST /auth/forgot-password`
    *   **Used In**: `ForgotPasswordScreen.tsx`

*   **Reset Password**
    *   **Description**: Verifies OTP and sets new password.
    *   **Proposed Endpoint**: `POST /auth/reset-password`
    *   **Used In**: `ResetPasswordScreen.tsx`

---

## 3. Recommended Actions
1.  **Uniformity**: The `connections/send` and `subscription/request` endpoints seem to serve similar purposes in the UI. We should decide on one naming convention.
2.  **Dashboard API**: If `/users/filter` can handle "online" and "recent" sorting, we can remove the separate dashboard endpoints.
3.  **Update API**: This is critical for the onboarding flow to save user details (bio, height, smoking habits).

---
**Status**: Real-time integration has been verified for Login, Register, and Search/Filter. `UserList.tsx` has been updated to use the live `/users/filter` API.
