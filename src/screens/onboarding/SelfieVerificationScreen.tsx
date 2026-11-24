import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Image,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  type CameraDevice,
  useCameraDevice,
  useCameraDevices,
  useCameraPermission,
} from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AppContext from '../../context/CreateGlobalStateContext';
import { useProfile } from '../../api/useProfile';
import { useUserImages, parseUploadResponse, getPhotoRejectionKind, getPhotoRejectionCopy } from '../../api/useImages';
import AttractiveLogo from '../../components/AttractiveLogo';
import { useTheme, Colors } from '../../theme';
import { useAlert } from '../../components/AlertModal';
import { t, useTranslation } from '../../i18n';
import { getUserId } from '../../utils/sessionHelper';
import { getAuthSession } from '../../utils/session';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 8;
const CURRENT_STEP = 3; // Step 3 of 8 (Active dash)

// Oval viewfinder geometry (Golden portrait ratio ~ 1:1.38)
const OVAL_WIDTH = Math.min(SCREEN_WIDTH * 0.68, 248);
const OVAL_HEIGHT = OVAL_WIDTH * 1.38;
const OVAL_SCALE_Y = OVAL_HEIGHT / OVAL_WIDTH;
const OVAL_CONTENT_TOP = (OVAL_WIDTH - OVAL_HEIGHT) / 2;

// Fallback device definition to immediately bind Android Front Camera (#1) if async enumeration is delayed
const DEFAULT_FRONT_DEVICE: CameraDevice = {
  id: '1',
  position: 'front',
  physicalDevices: ['wide-angle-camera'],
  isMultiCam: false,
  minZoom: 1,
  maxZoom: 1,
  neutralZoom: 1,
  hasFlash: false,
  hasTorch: false,
  minFocusDistance: 0,
  formats: [],
  supportsLowLightBoost: false,
  supportsRawPhotoMode: false,
  hardwareLevel: 'full',
  sensorOrientation: 'portrait',
} as unknown as CameraDevice;

type ScreenMode = 'camera' | 'review';

const SelfieVerificationScreen = ({ navigation }: any) => {
  useTranslation();
  const { alert, AlertComponent } = useAlert();
  const {
    setVerifiedSelfie,
    images,
    setImages,
    setProfileImage,
    setProfileImageUrl,
  } = useContext(AppContext);
  const { isDark } = useTheme();
  const isScreenFocused = useIsFocused();

  const cameraRef = useRef<Camera>(null);
  const initStartedAtRef = useRef<number>(Date.now());

  // Vision Camera hooks
  const { hasPermission: visionHasPermission, requestPermission } = useCameraPermission();
  const hookFrontDevice = useCameraDevice('front');
  const hookBackDevice = useCameraDevice('back');
  const allDevices = typeof useCameraDevices === 'function' ? useCameraDevices() : [];

  // Resolved camera device & permission states
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [permissionResolved, setPermissionResolved] = useState<boolean>(false);
  const [activeDevice, setActiveDevice] = useState<CameraDevice>(
    hookFrontDevice ?? hookBackDevice ?? DEFAULT_FRONT_DEVICE
  );
  const [cameraInitialized, setCameraInitialized] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [screenMode, setScreenMode] = useState<ScreenMode>('camera');
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

  // Face verification initialization loader (camera/SDK warm-up)
  const [showInitLoader, setShowInitLoader] = useState<boolean>(true);
  const [initProgress, setInitProgress] = useState<number>(0);
  const [verifyProgress, setVerifyProgress] = useState<number>(0);

  // Biometric verification scanning states
  const [scanProgress, setScanProgress] = useState(0);
  const [verificationStageText, setVerificationStageText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bottom-middle toast, same style as the registration screens.
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;
  const toastTimerRef = useRef<any>(null);

  const scanIntervalRef = useRef<any>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const { verifySelfie, uploadSelfie } = useProfile();
  const { uploadImage } = useUserImages();

  // 1. Proactively check camera permission on mount and focus
  const checkCameraPermission = useCallback(async () => {
    let granted = visionHasPermission;
    if (Platform.OS === 'android') {
      try {
        const checkResult = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (checkResult) {
          granted = true;
        }
      } catch (err) {
        console.warn('Android permission check error:', err);
      }
    }
    setHasCameraPermission(granted);
    setPermissionResolved(true);
    return granted;
  }, [visionHasPermission]);

  useEffect(() => {
    checkCameraPermission();
  }, [checkCameraPermission]);

  // Animate the initialization percentage while the camera warms up. The value
  // is capped at 95% until the camera actually reports it is ready.
  useEffect(() => {
    if (!showInitLoader) return;
    const interval = setInterval(() => {
      setInitProgress((prev) => {
        if (prev >= 95) return 95;
        const step = prev < 40 ? 7 : prev < 70 ? 4 : 2;
        return Math.min(95, prev + step);
      });
    }, 140);
    return () => clearInterval(interval);
  }, [showInitLoader]);

  // Finish the loader when the camera is ready (or permission was denied).
  useEffect(() => {
    if (!showInitLoader) return;
    const cameraReady = hasCameraPermission && cameraInitialized;
    const permissionDenied = permissionResolved && !hasCameraPermission;
    if (!cameraReady && !permissionDenied) return;

    setInitProgress(100);
    const elapsed = Date.now() - initStartedAtRef.current;
    const minimumVisibleMs = cameraReady ? 1800 : 0;
    const hideDelay = Math.max(450, minimumVisibleMs - elapsed);
    const timer = setTimeout(() => setShowInitLoader(false), hideDelay);
    return () => clearTimeout(timer);
  }, [showInitLoader, hasCameraPermission, cameraInitialized, permissionResolved]);

  // Safety net: never trap the user behind the initializing overlay.
  useEffect(() => {
    if (!showInitLoader) return;
    const timer = setTimeout(() => {
      setInitProgress(100);
      setTimeout(() => setShowInitLoader(false), 350);
    }, 8000);
    return () => clearTimeout(timer);
  }, [showInitLoader]);

  // Progress feedback while the captured selfie is uploaded and verified.
  useEffect(() => {
    if (!isSubmitting) {
      setVerifyProgress(0);
      return;
    }
    setVerifyProgress(8);
    const interval = setInterval(() => {
      setVerifyProgress((prev) => (prev < 95 ? Math.min(95, prev + 4) : 95));
    }, 200);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  // 2. Request permission explicitly when user interacts
  const handleRequestPermission = async () => {
    let granted = false;
    try {
      granted = await requestPermission();
    } catch (e) {
      console.warn('VisionCamera requestPermission error:', e);
    }

    if (!granted && Platform.OS === 'android') {
      try {
        const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        granted = res === PermissionsAndroid.RESULTS.GRANTED;
      } catch (e) {
        console.warn('PermissionsAndroid request error:', e);
      }
    }

    setHasCameraPermission(granted);
  };

  // 3. Keep activeDevice synchronized, defaulting immediately to front camera #1 so it never hangs
  useEffect(() => {
    let candidate =
      hookFrontDevice ??
      hookBackDevice ??
      allDevices.find((d) => d.position === 'front') ??
      allDevices.find((d) => d.position === 'back') ??
      allDevices[0];

    if (!candidate) {
      try {
        const available = Camera.getAvailableCameraDevices();
        if (Array.isArray(available) && available.length > 0) {
          candidate = available.find((d) => d.position === 'front') ?? available[0];
        }
      } catch (e) {}
    }

    const resolved = candidate ?? DEFAULT_FRONT_DEVICE;
    // VisionCamera hooks can return a new device object on each render. Only
    // update state when the device actually changes, otherwise this effect
    // triggers an endless render loop ("Maximum update depth exceeded").
    setActiveDevice((prev) => {
      if (prev && String(prev.id) === String(resolved.id)) return prev;
      return resolved;
    });
  }, [hookFrontDevice, hookBackDevice, allDevices]);

  // Animated scan beam for review biometric scanning
  useEffect(() => {
    if (isVerifying) {
      const beam = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: OVAL_HEIGHT - 12,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ])
      );
      beam.start();
      return () => beam.stop();
    } else {
      scanLineAnim.setValue(0);
    }
  }, [isVerifying, scanLineAnim]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Android hardware back handler
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'SelfieVerification');
      const onBackPress = () => {
        if (screenMode === 'review') {
          handleRetake();
          return true;
        }
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.replace('DisplayName');
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [navigation, screenMode])
  );

  // 5. Review the captured selfie. The backend performs the actual AI face
  // verification when the user confirms, via /profile/selfie/verify.
  const startFaceVerification = (_photoUri: string) => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setScreenMode('review');
    setScanProgress(100);
    setVerificationStageText('Selfie captured');
    setIsVerifying(false);
    setScanComplete(true);
  };

  // 6. In-App Oval Camera Capture (Never opens stock phone camera app)
  const handleCapturePhoto = async () => {
    if (isCapturing) return;

    // A. If permission not granted, request permission immediately
    if (!hasCameraPermission) {
      await handleRequestPermission();
      return;
    }

    // B. If camera hardware device is not ready yet
    if (!activeDevice || !cameraRef.current) {
      alert(
        'Starting Camera',
        'Camera is starting up. Please hold on a moment and tap capture again.'
      );
      return;
    }

    setIsCapturing(true);
    try {
      // Capture directly from the in-app VisionCamera inside the oval
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      if (!photo?.path) {
        throw new Error('No photo file returned by camera');
      }

      const formattedUri = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;

      // Full-resolution camera captures are several MB. Compress before upload:
      // the backend rejects oversized selfies and large multipart bodies can
      // also fail with "Network Error / Stream Closed" on mobile data.
      let uploadUri = formattedUri;
      try {
        const compressed = await ImageManipulator.manipulateAsync(
          formattedUri,
          [{ resize: { width: 1080 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        if (compressed?.uri) {
          uploadUri = compressed.uri;
        }
      } catch (compressErr) {
        console.warn('Selfie compression failed, using original file:', compressErr);
      }

      // Run face detection validation:
      Image.getSize(
        uploadUri,
        (w, h) => {
          if (w < 100 || h < 100) {
            alert(
              'No Face Detected',
              'The captured image was too small or blurry. Please position your face inside the oval frame and retake.'
            );
            setIsCapturing(false);
            return;
          }
          setCapturedPhotoUri(uploadUri);
          AsyncStorage.setItem('@selfie_uri', uploadUri).catch(() => {});
          startFaceVerification(uploadUri);
          setIsCapturing(false);
        },
        () => {
          setCapturedPhotoUri(uploadUri);
          startFaceVerification(uploadUri);
          setIsCapturing(false);
        }
      );
    } catch (err: any) {
      console.warn('VisionCamera capture error:', err);
      setIsCapturing(false);
      alert(
        'Capture Failed',
        'Could not capture photo from the camera. Please ensure good lighting and try again.'
      );
    }
  };

  const handleRetake = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setCapturedPhotoUri(null);
    setScanProgress(0);
    setScanComplete(false);
    setIsVerified(false);
    setIsVerifying(false);
    setVerificationStageText('');
    setScreenMode('camera');
  };

  const dismissBottomToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 20,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  }, [toastOpacity, toastTranslateY]);

  const showBottomToast = useCallback(
    (message: string) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToastMessage(message);
      setToastVisible(true);
      toastOpacity.setValue(0);
      toastTranslateY.setValue(20);
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      toastTimerRef.current = setTimeout(() => {
        dismissBottomToast();
      }, 4500);
    },
    [dismissBottomToast, toastOpacity, toastTranslateY],
  );

  // 7. Confirm & Sync to Backend + Pre-fill Slot 0 for Step 4
  const handleConfirmVerification = async () => {
    if (!capturedPhotoUri || isSubmitting || !scanComplete) return;

    setIsSubmitting(true);
    try {
      const authSession = await getAuthSession();
      const uid = authSession?.userId || (await getUserId().catch(() => null));

      // 1. Upload the reference selfie, then have the backend verify it. This
      //    MUST succeed before anything is marked verified: every later gallery
      //    photo is matched against this selfie.
      let spotPhotoUri = capturedPhotoUri;
      try {
        await uploadSelfie.mutateAsync({
          photo: {
            uri: capturedPhotoUri,
            name: `selfie_${Date.now()}.jpg`,
            type: 'image/jpeg',
          },
          uid: uid ? String(uid) : undefined,
        });

        // The backend refuses to verify before the account has a profile photo
        // ("Upload a profile photo first."), so the selfie also becomes the
        // first gallery image. It is the user's face by definition.
        const uploaded = parseUploadResponse(
          await uploadImage.mutateAsync({
            photo: {
              uri: capturedPhotoUri,
              name: `selfie_${Date.now()}.jpg`,
              type: 'image/jpeg',
            },
          })
        );
        if (uploaded.imageUrl) {
          spotPhotoUri = uploaded.imageUrl;
        }

        await verifySelfie.mutateAsync({
          uid: uid ? String(uid) : undefined,
        });

        // Show the verified state briefly before navigating.
        setIsVerified(true);
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (verifyErr: any) {
        const serverMessage = String(
          verifyErr?.response?.data?.message ||
          verifyErr?.response?.data?.error ||
          (typeof verifyErr?.response?.data === 'string' ? verifyErr.response.data : '') ||
          verifyErr?.message ||
          ''
        ).trim();
        const details = String(
          verifyErr?.response?.data?.details ||
          verifyErr?.response?.data?.reason ||
          ''
        ).trim();

        console.warn('[SelfieVerification] upload/verify failed:', serverMessage || verifyErr);

        const rejectionKind = getPhotoRejectionKind(verifyErr, { isPrimary: true });
        const isGenericRejection =
          /^photo rejected\.?$/i.test(serverMessage) || /^invalid image\.?$/i.test(serverMessage);

        if (isGenericRejection) {
          showBottomToast(
            'Selfie rejected: our face check could not confirm a clear human face. Please retake it with your face fully visible, in good lighting, and without filters, sunglasses or hats.'
          );
          return;
        }

        if (rejectionKind) {
          const copy = getPhotoRejectionCopy(rejectionKind, t);
          showBottomToast(`${copy.title}: ${copy.message}`);
          return;
        }

        showBottomToast(
          `${t('onboarding.selfieverificationscreen.verification_failed_title', {
            defaultValue: 'Verification Failed',
          })}: ${
            details ||
            serverMessage ||
            t('onboarding.selfieverificationscreen.verification_failed_desc', {
              defaultValue:
                'We could not verify your selfie. Please retake it in good lighting and try again.',
            })
          }`
        );
        return;
      }

      // 2. Mark verified in storage and state only after the backend agreed
      await AsyncStorage.setItem('@selfie_verified', 'true');
      setVerifiedSelfie?.(true);

      // 3. Pre-fill slot 0 in profile images so Step 4 (UploadImageScreen) has 1 verified face photo ready
      const currentSlots = Array.isArray(images) ? [...images] : Array(6).fill(null);
      while (currentSlots.length < 6) currentSlots.push(null);
      currentSlots[0] = spotPhotoUri;
      setImages?.(currentSlots);
      setProfileImage?.(spotPhotoUri);
      setProfileImageUrl?.(spotPhotoUri);
      AsyncStorage.setItem('onboardingImages', JSON.stringify(currentSlots)).catch(() => {});
      AsyncStorage.setItem('profileImage', spotPhotoUri).catch(() => {});
      if (uid) {
        AsyncStorage.setItem(`user_photos_${String(uid)}`, JSON.stringify(currentSlots)).catch(() => {});
        AsyncStorage.setItem(`user_profile_photo_${String(uid)}`, spotPhotoUri).catch(() => {});
      }

      // 4. Navigate to Step 4: Photo Upload
      if (navigation.canGoBack()) {
        navigation.navigate('UploadImage');
      } else {
        navigation.replace('UploadImage');
      }
    } catch (e) {
      console.error('Error confirming verification:', e);
      alert(
        t('onboarding.selfieverificationscreen.verification_failed_title', {
          defaultValue: 'Verification Failed',
        }),
        t('onboarding.selfieverificationscreen.verification_failed_desc', {
          defaultValue:
            'We could not verify your selfie. Please retake it in good lighting and try again.',
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHeaderBack = () => {
    if (screenMode === 'review') {
      handleRetake();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('DisplayName');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F0D1A' : '#FFFFFF' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0F0D1A' : '#FFFFFF'}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header Bar with Back chevron and 8 Dashes (Dash 3 active) */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleHeaderBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="chevron-left" size={28} color={isDark ? '#FFFFFF' : '#111827'} />
          </TouchableOpacity>
          <View style={styles.dashRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dash,
                  i + 1 === CURRENT_STEP
                    ? [styles.dashActive, { backgroundColor: isDark ? '#FFFFFF' : '#111827' }]
                    : [
                        styles.dashInactive,
                        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : '#D1D5DB' },
                      ],
                ]}
              />
            ))}
          </View>
        </View>

        {/* Main Card Container */}
        <View style={styles.cardContainer}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1A1730' : '#F9FAFB',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB',
              },
            ]}
          >
            <View style={styles.cardHeader}>
              {/* Start button at the top of the camera (like the reference) */}
              {screenMode === 'camera' && (
                <TouchableOpacity
                  style={[
                    styles.startButton,
                    (!hasCameraPermission || isCapturing) && styles.startButtonDisabled,
                  ]}
                  onPress={handleCapturePhoto}
                  disabled={isCapturing}
                  activeOpacity={0.85}
                >
                  {isCapturing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.startButtonText}>
                      {t('onboarding.selfieverificationscreen.start')}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Title & Instructions */}
              <Text style={[styles.cardInstructionText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {screenMode === 'review'
                  ? isVerified
                    ? 'Face Verified! ✓'
                    : 'Selfie Captured! ✓'
                  : t('onboarding.selfieverificationscreen.center_your_face_and_click_start')}
              </Text>
              <Text style={[styles.cardSubinstructionText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {screenMode === 'review'
                  ? isVerified
                    ? 'Verification successful. Taking you to the next step…'
                    : 'Tap "Use This Selfie" to verify and continue.'
                  : 'Make sure your face is clearly visible inside the oval frame.'}
              </Text>
            </View>

            {/* OVAL VIEWFINDER - Live Camera & Biometric Scan Frame */}
            <View style={styles.ovalFrameWrapper}>
              <Animated.View
                style={[
                  styles.ovalViewfinder,
                  {
                    borderColor:
                      screenMode === 'review' && scanComplete
                        ? '#10B981'
                        : isVerifying
                        ? Colors.primary
                        : isDark
                        ? 'rgba(255, 255, 255, 0.25)'
                        : '#D1D5DB',
                    transform: [
                      { scaleY: OVAL_SCALE_Y },
                    ],
                  },
                ]}
              >
                <View style={styles.ovalContent}>
              {screenMode === 'review' && capturedPhotoUri ? (
                // 1. Captured Photo Frozen in Oval for Review & Verification
                <>
                  <Image
                    source={{ uri: capturedPhotoUri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                  {isVerifying && (
                    <View style={styles.scanningOverlay}>
                      {/* Animated Green Scanning Laser */}
                      <Animated.View
                        style={[
                          styles.scanLaser,
                          {
                            transform: [{ translateY: scanLineAnim }],
                          },
                        ]}
                      />
                      <ActivityIndicator size="large" color="#FFFFFF" />
                      <Text style={styles.scanningPercentText}>{scanProgress}%</Text>
                      {Boolean(verificationStageText) && (
                        <Text style={styles.scanningStageText}>{verificationStageText}</Text>
                      )}
                    </View>
                  )}
                  {scanComplete && (
                    <View style={styles.verifiedBadgeOverlay}>
                      <Icon name="check-decagram" size={18} color="#FFFFFF" />
                      <Text style={styles.verifiedBadgeText}>
                        {isVerified ? 'VERIFIED' : 'CAPTURED'}
                      </Text>
                    </View>
                  )}
                </>
              ) : hasCameraPermission && activeDevice && isScreenFocused ? (
                // 2. Live In-App Front Camera Feed inside Oval Frame
                <>
                  <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    device={activeDevice}
                    isActive={isScreenFocused && screenMode === 'camera'}
                    photo={true}
                    androidPreviewViewType="texture-view"
                    onInitialized={() => setCameraInitialized(true)}
                    onError={(e) => {
                      console.warn('VisionCamera error:', e);
                    }}
                  />
                  {/* Subtle Face Alignment Guides inside the Oval */}
                  <View style={styles.faceGuideFrame} pointerEvents="none">
                    <View style={styles.eyeLineGuide} />
                    <View style={styles.centerAxisGuide} />
                  </View>
                  {!cameraInitialized && (
                    <View
                      style={[
                        styles.cameraPlaceholder,
                        { backgroundColor: isDark ? '#1E293B' : '#F3F4F6' },
                      ]}
                    >
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={[styles.placeholderText, { color: isDark ? '#94A3B8' : '#6B7280' }]}>
                        {t('onboarding.selfieverificationscreen.camera_ready')}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                // 3. Camera Permission Needed
                <View
                  style={[
                    styles.cameraPlaceholder,
                    { backgroundColor: isDark ? '#1E293B' : '#F3F4F6' },
                  ]}
                >
                  <Icon name="face-recognition" size={72} color={isDark ? '#6B7280' : '#9CA3AF'} />
                  <Text style={[styles.placeholderText, { color: isDark ? '#94A3B8' : '#6B7280' }]}>
                    Camera permission required
                  </Text>
                  <TouchableOpacity
                    style={[styles.smallPermissionBtn, { backgroundColor: Colors.primary }]}
                    onPress={handleRequestPermission}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.smallPermissionBtnText}>Allow Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
                </View>
              </Animated.View>
            </View>

            {/* Controls Section directly under the Oval Viewfinder */}
            {screenMode === 'review' ? (
              // Review Controls: Retake or Confirm
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.retakeBtn,
                    { borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : '#D1D5DB' },
                  ]}
                  onPress={handleRetake}
                  disabled={isVerifying || isSubmitting}
                  activeOpacity={0.8}
                >
                  <Feather name="refresh-cw" size={16} color={isDark ? '#FFFFFF' : '#111827'} />
                  <Text style={[styles.retakeBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    Retake
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: Colors.primary },
                    (!scanComplete || isSubmitting) && { opacity: 0.6 },
                  ]}
                  onPress={handleConfirmVerification}
                  disabled={!scanComplete || isSubmitting}
                  activeOpacity={0.88}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.confirmBtnText}>Use This Selfie</Text>
                      <Feather name="arrow-right" size={17} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Keep the oval vertically balanced in camera mode now that the
              // bottom shutter is gone and "Start" is the only capture action.
              <View style={styles.captureControlsSpacer} />
            )}
          </View>

          {(showInitLoader || isSubmitting) && (
            <View
              style={[
                styles.initializingOverlay,
                { backgroundColor: isDark ? '#0F0D1A' : '#FFFFFF' },
              ]}
            >
              <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={styles.initializingSpinner}
              />
              <Text style={[styles.initializingText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('onboarding.selfieverificationscreen.initializing_face_verification', {
                  scanProgress: showInitLoader ? initProgress : verifyProgress,
                })}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Bottom-middle toast, same style used by the registration screens */}
      {toastVisible ? (
        <Animated.View
          style={[
            styles.bottomToastContainer,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={dismissBottomToast}
            style={styles.bottomToastInner}
          >
            <View style={styles.bottomToastLogoWrap}>
              <AttractiveLogo size={26} />
            </View>
            <Text style={styles.bottomToastText} numberOfLines={3}>
              {toastMessage}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      {AlertComponent}
    </View>
  );
};

export default SelfieVerificationScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  // Top Bar & 8-Dash Progress Indicator
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  dashRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dash: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
  },
  dashActive: {
    backgroundColor: '#111827',
  },
  dashInactive: {
    backgroundColor: '#D1D5DB',
  },

  // Main Card
  cardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  initializingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 100,
    elevation: 100,
  },
  initializingSpinner: {
    marginBottom: 28,
    transform: [{ scale: 1.5 }],
  },
  initializingText: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 22,
    paddingBottom: 28,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  startButton: {
    minWidth: 156,
    height: 46,
    paddingHorizontal: 38,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardHeader: {
    width: '100%',
    alignItems: 'center',
  },
  cardInstructionText: {
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  cardSubinstructionText: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 12,
    paddingHorizontal: 22,
  },

  // OVAL VIEWFINDER
  ovalFrameWrapper: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovalViewfinder: {
    width: OVAL_WIDTH,
    height: OVAL_WIDTH,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 2.5,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: '#000000',
  },
  ovalContent: {
    position: 'absolute',
    top: OVAL_CONTENT_TOP,
    left: 0,
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    // Counter-scale the content so the elliptical mask never distorts the
    // camera preview / captured photo.
    transform: [{ scaleY: 1 / OVAL_SCALE_Y }],
  },
  faceGuideFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeLineGuide: {
    width: '55%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  centerAxisGuide: {
    position: 'absolute',
    height: '60%',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 13.5,
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  smallPermissionBtn: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  smallPermissionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Biometric Scanning Overlay
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  scanningPercentText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  scanningStageText: {
    color: '#E5E7EB',
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  verifiedBadgeOverlay: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  // Spacer keeps the oval vertically balanced now that "Start" is the only
  // capture control (no bottom shutter).
  captureControlsSpacer: {
    height: 94,
  },

  // Review Buttons Below Oval
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    width: '100%',
    paddingHorizontal: 16,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  retakeBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomToastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 104 : 118,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 20,
  },
  bottomToastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#160E1A',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    maxWidth: '90%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  bottomToastLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bottomToastText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    lineHeight: 19,
  },
});
