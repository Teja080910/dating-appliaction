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
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AppContext from '../../context/CreateGlobalStateContext';
import { useProfile } from '../../api/useProfile';
import { useFaceValidation } from '../../api/useFaceValidation';
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

  // Vision Camera hooks
  const { hasPermission: visionHasPermission, requestPermission } = useCameraPermission();
  const hookFrontDevice = useCameraDevice('front');
  const hookBackDevice = useCameraDevice('back');
  const allDevices = typeof useCameraDevices === 'function' ? useCameraDevices() : [];

  // Resolved camera device & permission states
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [activeDevice, setActiveDevice] = useState<CameraDevice>(
    hookFrontDevice ?? hookBackDevice ?? DEFAULT_FRONT_DEVICE
  );
  const [cameraInitialized, setCameraInitialized] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [screenMode, setScreenMode] = useState<ScreenMode>('camera');
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

  // Biometric verification scanning states
  const [scanProgress, setScanProgress] = useState(0);
  const [verificationStageText, setVerificationStageText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scanIntervalRef = useRef<any>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { verifySelfie, uploadSelfie } = useProfile();
  const { uploadLivePhoto } = useFaceValidation();

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
    return granted;
  }, [visionHasPermission]);

  useEffect(() => {
    checkCameraPermission();
  }, [checkCameraPermission]);

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

    setActiveDevice(candidate ?? DEFAULT_FRONT_DEVICE);
  }, [hookFrontDevice, hookBackDevice, allDevices]);

  // Animated pulse for oval border while camera is active
  useEffect(() => {
    if (screenMode === 'camera') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [screenMode, pulseAnim]);

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

  // 5. Biometric Verification & Face Recognition Process
  const startFaceVerification = async (photoUri: string) => {
    setScreenMode('review');
    setIsVerifying(true);
    setScanComplete(false);
    setScanProgress(15);
    setVerificationStageText('Detecting face with AI...');

    let progress = 15;
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    // Smooth biometric scanning progress while the AI verifies the live face
    scanIntervalRef.current = setInterval(() => {
      progress += Math.floor(Math.random() * 5) + 3;
      if (progress < 85) {
        setScanProgress(progress);
        if (progress > 30 && progress <= 55) {
          setVerificationStageText('Analyzing facial landmarks & lighting...');
        } else if (progress > 55 && progress <= 80) {
          setVerificationStageText('Verifying biometric liveness & head pose...');
        }
      }
    }, 120);

    try {
      const authSession = await getAuthSession();
      const uid = authSession?.userId || (await getUserId().catch(() => null));

      console.log('[SelfieVerification] Sending photo to face recognition engine...');
      const result = await uploadLivePhoto.mutateAsync({
        userId: uid ? String(uid) : undefined,
        photoUri,
      });

      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

      if (result?.success === false || result?.error) {
        throw new Error(result.error || result.message || 'Face detection failed');
      }

      setScanProgress(100);
      setVerificationStageText('Face verified successfully! ✓');
      setIsVerifying(false);
      setScanComplete(true);
    } catch (err: any) {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      setIsVerifying(false);
      setScanComplete(false);
      setScanProgress(0);
      setVerificationStageText('No face detected ✕');

      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'No valid human face was detected. Please ensure your face is well-lit, clearly visible inside the oval frame, and not blurry.';

      alert(
        'Face Required',
        String(message),
        [
          {
            text: 'Retake Photo',
            onPress: handleRetake,
          },
        ]
      );
    }
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

      // Run face detection validation:
      Image.getSize(
        formattedUri,
        (w, h) => {
          if (w < 100 || h < 100) {
            alert(
              'No Face Detected',
              'The captured image was too small or blurry. Please position your face inside the oval frame and retake.'
            );
            setIsCapturing(false);
            return;
          }
          setCapturedPhotoUri(formattedUri);
          AsyncStorage.setItem('@selfie_uri', formattedUri).catch(() => {});
          startFaceVerification(formattedUri);
          setIsCapturing(false);
        },
        () => {
          setCapturedPhotoUri(formattedUri);
          startFaceVerification(formattedUri);
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
    setIsVerifying(false);
    setVerificationStageText('');
    setScreenMode('camera');
  };

  // 7. Confirm & Sync to Backend + Pre-fill Slot 0 for Step 4
  const handleConfirmVerification = async () => {
    if (!capturedPhotoUri || isSubmitting || !scanComplete) return;

    setIsSubmitting(true);
    try {
      // 1. Mark verified in storage and state
      await AsyncStorage.setItem('@selfie_verified', 'true');
      setVerifiedSelfie?.(true);

      // 2. Pre-fill slot 0 in profile images so Step 4 (UploadImageScreen) has 1 verified face photo ready
      const currentSlots = Array.isArray(images) ? [...images] : Array(6).fill(null);
      while (currentSlots.length < 6) currentSlots.push(null);
      if (!currentSlots[0]) {
        currentSlots[0] = capturedPhotoUri;
        setImages?.(currentSlots);
        setProfileImage?.(capturedPhotoUri);
        setProfileImageUrl?.(capturedPhotoUri);
        AsyncStorage.setItem('onboardingImages', JSON.stringify(currentSlots)).catch(() => {});
        AsyncStorage.setItem('profileImage', capturedPhotoUri).catch(() => {});
      }

      // 3. Sync to backend: upload selfie & set verification flag
      const authSession = await getAuthSession();
      const uid = authSession?.userId || (await getUserId().catch(() => null));

      try {
        await uploadSelfie.mutateAsync({
          photo: {
            uri: capturedPhotoUri,
            name: `selfie_${Date.now()}.jpg`,
            type: 'image/jpeg',
          },
          uid: uid ? String(uid) : undefined,
        });
      } catch (upErr) {
        console.warn('Selfie upload error:', upErr);
      }

      // Sync to external AI face validation service (ngrok)
      try {
        await uploadLivePhoto.mutateAsync({
          userId: uid ? String(uid) : undefined,
          photoUri: capturedPhotoUri,
        });
      } catch (faceErr) {
        console.warn('Face validation service live photo upload error:', faceErr);
      }

      try {
        await verifySelfie.mutateAsync({
          uid: uid ? String(uid) : undefined,
        });
      } catch (verifyErr) {
        console.warn('Biometric verify error:', verifyErr);
      }

      // 4. Navigate to Step 4: Photo Upload
      if (navigation.canGoBack()) {
        navigation.navigate('UploadImage');
      } else {
        navigation.replace('UploadImage');
      }
    } catch (e) {
      console.error('Error confirming verification:', e);
      if (navigation.canGoBack()) {
        navigation.navigate('UploadImage');
      } else {
        navigation.replace('UploadImage');
      }
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
            {/* Title & Instructions */}
            <Text style={[styles.cardInstructionText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {screenMode === 'review'
                ? scanComplete
                  ? 'Face Verified! ✓'
                  : 'Verifying Face...'
                : t('onboarding.selfieverificationscreen.center_your_face_and_click_start')}
            </Text>
            <Text style={[styles.cardSubinstructionText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {screenMode === 'review'
                ? scanComplete
                  ? 'Biometric face scan completed. Confirm below to proceed.'
                  : verificationStageText || 'Analyzing facial landmarks...'
                : 'Make sure your face is clearly visible inside the oval frame.'}
            </Text>

            {/* OVAL VIEWFINDER - Live Camera & Biometric Scan Frame */}
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
                  transform: [{ scale: screenMode === 'camera' ? pulseAnim : 1 }],
                },
              ]}
            >
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
                      <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
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
            </Animated.View>

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
                      <Text style={styles.confirmBtnText}>Confirm</Text>
                      <Feather name="arrow-right" size={17} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Camera Controls: Shutter Button
              <View style={styles.captureControls}>
                <TouchableOpacity
                  style={[
                    styles.captureShutterBtn,
                    { borderColor: Colors.primary },
                    isCapturing && { opacity: 0.6 },
                  ]}
                  onPress={handleCapturePhoto}
                  disabled={isCapturing}
                  activeOpacity={0.8}
                >
                  <View style={[styles.captureShutterInner, { backgroundColor: Colors.primary }]}>
                    {isCapturing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Icon name="camera" size={26} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={[styles.captureBtnLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {!hasCameraPermission
                    ? 'Tap to allow camera access'
                    : 'Tap to capture face'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
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
  ovalViewfinder: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2, // Perfect oval shape
    borderWidth: 2.5,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: '#000000',
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

  // Shutter Controls Below Oval
  captureControls: {
    alignItems: 'center',
    marginTop: 10,
  },
  captureShutterBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  captureShutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
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
});
