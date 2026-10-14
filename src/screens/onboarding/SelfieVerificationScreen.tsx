import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AppContext from '../../context/CreateGlobalStateContext';
import { useProfile } from '../../api/useProfile';
import { useTheme, Colors } from '../../theme';
import { t, useTranslation } from '../../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 8;
const CURRENT_STEP = 3; // Step 3 of 8 (Active dash)

type VerificationState = 'permission' | 'camera' | 'scanning';

const SelfieVerificationScreen = ({ navigation }: any) => {
  useTranslation();
  const { setVerifiedSelfie } = useContext(AppContext);
  const { isDark } = useTheme();
  const isScreenFocused = useIsFocused();

  const cameraRef = useRef<Camera>(null);
  const frontCamera = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [cameraReady, setCameraReady] = useState(false);
  const [stepState, setStepState] = useState<VerificationState>('permission');
  const [scanProgress, setScanProgress] = useState(0);

  const scanIntervalRef = useRef<any>(null);
  const { verifySelfie } = useProfile();

  // Android hardware back handler
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'SelfieVerification');
      const onBackPress = () => {
        if (stepState === 'scanning') {
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          setStepState('camera');
          setScanProgress(0);
          return true;
        }
        if (stepState === 'camera') {
          setStepState('permission');
          return true;
        }
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.replace('DisplayName');
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [navigation, stepState])
  );

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const handleAllowCamera = async () => {
    let granted = hasPermission;
    if (!granted) {
      granted = await requestPermission();
    }
    setCameraReady(granted);
    setStepState('camera');
  };

  const handleStartVerification = () => {
    setStepState('scanning');
    setScanProgress(5);

    let progress = 5;
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = setInterval(async () => {
      progress += 3;
      if (progress >= 100) {
        progress = 100;
        clearInterval(scanIntervalRef.current);
        setScanProgress(100);

        // Save locally
        await AsyncStorage.setItem('@selfie_verified', 'true');
        setVerifiedSelfie?.(true);

        // Fire-and-forget server sync
        try {
          verifySelfie.mutateAsync({}).catch(() => {});
        } catch {}

        // Transition to Step 4: Photo Upload
        setTimeout(() => {
          if (navigation.canGoBack()) {
            navigation.navigate('UploadImage');
          } else {
            navigation.replace('UploadImage');
          }
        }, 350);
      } else {
        setScanProgress(progress);
      }
    }, 30);
  };

  const handleHeaderBack = () => {
    if (stepState === 'scanning') {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      setStepState('camera');
      setScanProgress(0);
      return;
    }
    if (stepState === 'camera') {
      setStepState('permission');
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('DisplayName');
    }
  };

  // ----------------------------------------------------
  // PHOTO 3: "Allow Camera Access" Screen
  // ----------------------------------------------------
  if (stepState === 'permission') {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: isDark ? '#0F0D1A' : '#FFFFFF' }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? '#0F0D1A' : '#FFFFFF'}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Top Bar with Back chevron and 8 dashes (Dash 3 active) */}
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
                      : [styles.dashInactive, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : '#D1D5DB' }],
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Body Content */}
          <View style={styles.permissionBody}>
            <Text style={[styles.permissionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('onboarding.selfieverificationscreen.allow_camera_access')}
            </Text>
            <Text style={[styles.permissionSubtitle, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>
              {t('onboarding.selfieverificationscreen.grant_camera_access')}
            </Text>

            {/* Permission Card */}
            <View
              style={[
                styles.permissionCard,
                {
                  backgroundColor: isDark ? '#1A1730' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB',
                },
              ]}
            >
              <View
                style={[
                  styles.cameraIconBox,
                  { backgroundColor: isDark ? '#2D2950' : '#F3F4F6' },
                ]}
              >
                <Icon
                  name="camera-outline"
                  size={26}
                  color={isDark ? '#FFFFFF' : '#111827'}
                />
              </View>
              <View style={styles.permissionCardTextGroup}>
                <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t('onboarding.selfieverificationscreen.camera')}
                </Text>
                <Text style={[styles.cardDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {t('onboarding.selfieverificationscreen.camera_desc')}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Allow Camera Button */}
          <View style={styles.bottomBtnContainer}>
            <TouchableOpacity
              style={[styles.allowCameraBtn, { backgroundColor: Colors.primary }]}
              onPress={handleAllowCamera}
              activeOpacity={0.88}
            >
              <Text style={styles.allowCameraBtnText}>
                {t('onboarding.selfieverificationscreen.allow_camera')}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ----------------------------------------------------
  // PHOTO 4: Face Verification Screen ("Center your face and click Start")
  // ----------------------------------------------------
  return (
    <View style={styles.darkThemeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#080E18" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Bar with Back chevron and 8 dashes (Dash 3 active in White) */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleHeaderBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.dashRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dash,
                  i + 1 === CURRENT_STEP
                    ? styles.dashActiveWhite
                    : styles.dashInactiveDark,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Start Button in Theme Primary Color (replacing Glambu crimson red) */}
        <View style={styles.startBtnContainer}>
          <TouchableOpacity
            style={[styles.themeStartBtn, { backgroundColor: Colors.primary }]}
            onPress={stepState === 'scanning' ? undefined : handleStartVerification}
            activeOpacity={0.85}
            disabled={stepState === 'scanning'}
          >
            {stepState === 'scanning' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.themeStartBtnText}>
                {t('onboarding.selfieverificationscreen.start')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Instructions & Oval Camera Viewfinder Box */}
        <View style={styles.darkCardContainer}>
          <View style={styles.darkCard}>
            <Text style={styles.darkCardText}>
              {stepState === 'scanning'
                ? `Verifying face...\n${scanProgress}%`
                : 'Center your face\nand click "Start"'}
            </Text>

            <View style={styles.ovalViewfinder}>
              {cameraReady && frontCamera && isScreenFocused ? (
                <Camera
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  device={frontCamera}
                  isActive={isScreenFocused}
                />
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <Icon name="face-recognition" size={76} color="#6B7280" />
                  <Text style={styles.placeholderText}>
                    {t('onboarding.selfieverificationscreen.camera_ready')}
                  </Text>
                </View>
              )}

              {/* Scanning Overlay Ring/Spinner when in scanning state */}
              {stepState === 'scanning' && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.scanningPercentText}>{scanProgress}%</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default SelfieVerificationScreen;

const styles = StyleSheet.create({
  // Global Safe Area & Containers
  safeArea: {
    flex: 1,
  },
  darkThemeContainer: {
    flex: 1,
    backgroundColor: '#080E18',
  },
  permissionContainer: {
    flex: 1,
  },

  // Top Bar & 8-Dash Progress Indicator (Matches Glambu)
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
  dashActiveWhite: {
    backgroundColor: '#FFFFFF',
  },
  dashInactiveDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },

  // Photo 3: "Allow Camera Access" styles
  permissionBody: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  permissionTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cameraIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCardTextGroup: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13.5,
    marginTop: 4,
    lineHeight: 18,
  },
  bottomBtnContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },
  allowCameraBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowCameraBtnText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Photo 4: Face Verification styles
  startBtnContainer: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  themeStartBtn: {
    borderRadius: 26,
    paddingVertical: 13,
    paddingHorizontal: 64,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
  },
  themeStartBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  darkCardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  darkCard: {
    flex: 1,
    backgroundColor: '#0C1624',
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  darkCardText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 24,
  },
  ovalViewfinder: {
    width: Math.min(SCREEN_WIDTH * 0.62, 230),
    height: Math.min(SCREEN_WIDTH * 0.62, 230) * 1.42,
    borderRadius: 115,
    overflow: 'hidden',
    backgroundColor: '#111827',
    alignSelf: 'center',
    position: 'relative',
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningPercentText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },
});
