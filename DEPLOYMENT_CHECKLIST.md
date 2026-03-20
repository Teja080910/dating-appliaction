# AMARA Dating App — Deployment Checklist

App Name: **AMARA**  
Package: `com.datingapp`  
Backend URL: `http://165.22.218.70:8080`

---

## 1. Backend / API

- [ ] Sir se API base URL confirm karo (abhi HTTP hai, HTTPS chahiye production ke liye)
- [ ] Sir se Postman collection ya API docs maango (login, register, profile, match, chat endpoints)
- [ ] Backend URL ko HTTPS pe shift karo — `https://` wala URL lao sir se
- [ ] `src/environment/ApiConfig.ts` mein production URL update karo

---

## 2. Firebase Setup (MISSING — CRITICAL)

- [ ] Firebase project create karo: https://console.firebase.google.com
- [ ] Android app add karo with package name: `com.datingapp`
- [ ] `google-services.json` download karke `android/app/` folder mein daalo
- [ ] iOS ke liye `GoogleService-Info.plist` download karke `ios/DatingApp/` mein daalo
- [ ] Firebase Messaging (Push Notifications) enable karo Firebase console mein

---

## 3. Android Release Build

- [ ] Release keystore file banao:
  ```
  keytool -genkey -v -keystore amara-release.keystore -alias amara -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Keystore file `android/app/` mein rakho
- [ ] `android/app/build.gradle` mein release signingConfig update karo (abhi debug keystore use ho raha hai release mein bhi — fix karna hai)
- [ ] `android/gradle.properties` mein keystore credentials add karo
- [ ] Release APK/AAB build karo:
  ```
  cd android && ./gradlew bundleRelease
  ```

---

## 4. iOS Release Build

- [ ] Apple Developer Account chahiye ($99/year)
- [ ] Xcode mein Bundle ID set karo: `com.datingapp`
- [ ] Provisioning Profile aur Certificate banao
- [ ] `pod install` run karo `ios/` folder mein
- [ ] Archive build karo Xcode se

---

## 5. App Store / Play Store

### Google Play Store
- [ ] Google Play Console account ($25 one-time)
- [ ] App listing banao (screenshots, description, icon)
- [ ] AAB file upload karo
- [ ] Content rating fill karo (dating app hai — 17+ hoga)
- [ ] Privacy Policy URL chahiye (dating app ke liye mandatory)

### Apple App Store
- [ ] App Store Connect pe app create karo
- [ ] Screenshots (6.5", 5.5" sizes)
- [ ] Privacy Policy URL (mandatory)
- [ ] Age rating: 17+ (dating app)

---

## 6. App Icon & Splash Screen

- [ ] App icon set hai? Check karo `android/app/src/main/res/mipmap-*/`
- [ ] Splash screen configured hai?

---

## 7. Permissions (Already in code, verify karo)

- [ ] Camera permission (FaceVerification ke liye)
- [ ] Gallery/Storage permission (Image upload ke liye)
- [ ] Location permission (Search settings ke liye)
- [ ] Notification permission (Firebase messaging ke liye)

---

## 8. Environment / Security

- [ ] API URL hardcoded hai — production mein `.env` file use karo (`react-native-config` package)
- [ ] Koi bhi secret key code mein nahi honi chahiye

---

## Sabse Pehle Kya Karo (Priority Order)

1. Sir se `google-services.json` aur HTTPS API URL maango
2. Firebase setup complete karo
3. Release keystore banao
4. Release build test karo
5. Store listing prepare karo
