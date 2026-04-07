# AMARA Dating App - Project Resource Requirements

To complete the full integration of the application, we require the following resources and API keys:

## 1. Google Maps Platform Keys
*   **API Key**: Required for the **Location Picker** and **Search Settings** (World Map).
*   **APIs to Enable**: 
    - Maps SDK for Android
    - Maps SDK for iOS (if applicable)
    - Places API (for location search autocomplete)
    - Geocoding API (converting coordinates to addresses)

## 2. Razorpay Payment Gateway
*   **Test API Key & Secret**: For testing subscription payments.
*   **Live API Key & Secret**: For production release.
*   **Webhook Secret (Optional)**: To handle failed/delayed payment notifications.

## 3. Firebase Configuration
*   **google-services.json**: This file is needed for **Push Notifications** (Firebase Cloud Messaging) to work on Android.
*   **GoogleService-Info.plist**: (For iOS) Required for the same purpose.

## 4. Production API Endpoint
*   **Base URL (HTTPS)**: Currently, we are using `http://165.22.218.70:9395`. For production (App Store/Play Store), we must use a secure `https://` URL.

## 5. Deployment Assets (For Play Store/App Store)
*   **Privacy Policy URL**: Link to the app's privacy policy (Mandatory for Dating category).
*   **Release Keystore**: If a previous keystore exists for `com.datingapp`, we will need it for updates. If not, we will create a new one.

---

**Note:** Once these keys are provided, we will finalize the integration and the app will be 100% production-ready.
