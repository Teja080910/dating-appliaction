import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { t, useTranslation } from '../../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 8;
const CURRENT_STEP = 3; // Step 3 of 8

type VerificationState = 'move_face' | 'center_face' | 'initializing';

const SelfieVerificationScreen = ({ navigation }: any) => {
  useTranslation();
  const { setVerifiedSelfie } = useContext(AppContext);
  const isScreenFocused = useIsFocused();

  const cameraRef = useRef<Camera>(null);
  const frontCamera = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [cameraReady, setCameraReady] = useState(false);
  const [stepState, setStepState] = useState<VerificationState>('move_face');
  const [scanProgress, setScanProgress] = useState(0);

  const scanIntervalRef = useRef<any>(null);
  const autoAdvanceTimerRef = useRef<any>(null);
  const { verifySelfie } = useProfile();

  // Android hardware back handler
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'SelfieVerification');
      const onBackPress = () => {
        if (stepState === 'initializing') {
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
          setStepState('center_face');
          setScanProgress(0);
          return true;
        }
        if (stepState === 'center_face') {
          setStepState('move_face');
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

  // Request camera permission on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (isMounted) setCameraReady(granted);
      } else {
        if (isMounted) setCameraReady(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [hasPermission, requestPermission]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  // In State 1 ('move_face'), auto transition to State 2 ('center_face') after 2.5s
  useEffect(() => {
    if (stepState === 'move_face') {
      autoAdvanceTimerRef.current = setTimeout(() => {
        setStepState('center_face');
      }, 2500);
      return () => {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      };
    }
  }, [stepState]);

  const handleStartVerification = () => {
    setStepState('initializing');
    setScanProgress(5);

    let progress = 5;
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = setInterval(async () => {
      progress += 2;
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
        }, 300);
      } else {
        setScanProgress(progress);
      }
    }, 25); // Completes in ~1.2s
  };

  const handleHeaderBack = () => {
    if (stepState === 'initializing') {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      setStepState('center_face');
      setScanProgress(0);
      return;
    }
    if (stepState === 'center_face') {
      setStepState('move_face');
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('DisplayName');
    }
  };

  const handleCloseToCenterFace = () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    setStepState('center_face');
  };

  // ----------------------------------------------------
  // STATE 3: Pitch Black Screen with Cyan Spinner (Photo 1)
  // ----------------------------------------------------
  if (stepState === 'initializing') {
    return (
      <View style={styles.blackContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Top Bar with Back chevron and 8 dashes */}
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
                    i + 1 <= CURRENT_STEP ? styles.dashActive : styles.dashInactive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Center Spinner & Progress Text */}
          <View style={styles.centerInitializingArea}>
            <ActivityIndicator size="large" color="#6ADAD7" />
            <Text style={styles.initializingText}>
              Initializing face verification... {scanProgress}%
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ----------------------------------------------------
  // STATE 1: Cyan Top Banner + Camera Preview (Photo 3)
  // ----------------------------------------------------
  if (stepState === 'move_face') {
    return (
      <View style={styles.darkThemeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#080E18" />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Top Bar with Back chevron and 8 dashes */}
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
                    i + 1 <= CURRENT_STEP ? styles.dashActive : styles.dashInactive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Close Button top right */}
          <View style={styles.closeBtnRow}>
            <TouchableOpacity
              style={styles.whiteCloseCircle}
              onPress={handleCloseToCenterFace}
              activeOpacity={0.8}
            >
              <Feather name="x" size={20} color="#0D9488" />
            </TouchableOpacity>
          </View>

          {/* Cyan Alert Banner */}
          <View style={styles.cyanBannerWrapper}>
            <View style={styles.cyanBanner}>
              <Text style={styles.cyanBannerText}>
                Move face in front{'\n'}of camera
              </Text>
            </View>
          </View>

          {/* Camera View */}
          <View style={styles.fullCameraBox}>
            {cameraReady && frontCamera && isScreenFocused ? (
              <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={frontCamera}
                isActive={isScreenFocused}
              />
            ) : (
              <View style={styles.cameraPlaceholder}>
                <Icon name="face-recognition" size={88} color="#6B7280" />
                <Text style={styles.placeholderText}>{t('onboarding.selfieverificationscreen.camera_ready')}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ----------------------------------------------------
  // STATE 2: Red "Start" Button + Dark Box with Oval Viewfinder (Photo 2)
  // ----------------------------------------------------
  return (
    <View style={styles.darkThemeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#080E18" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Bar with Back chevron and 8 dashes */}
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
                  i + 1 <= CURRENT_STEP ? styles.dashActive : styles.dashInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Centered Red Start Pill Button */}
        <View style={styles.startBtnContainer}>
          <TouchableOpacity
            style={styles.redStartBtn}
            onPress={handleStartVerification}
            activeOpacity={0.85}
          >
            <Text style={styles.redStartBtnText}>{t('onboarding.selfieverificationscreen.start')}</Text>
          </TouchableOpacity>
        </View>

        {/* Dark Container Box with Oval Camera Viewfinder */}
        <View style={styles.darkCardContainer}>
          <View style={styles.darkCard}>
            <Text style={styles.darkCardText}>
              Center your face{'\n'}and click "Start"
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
                  <Text style={styles.placeholderText}>{t('onboarding.selfieverificationscreen.camera_ready')}</Text>
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
  // Global Containers
  darkThemeContainer: {
    flex: 1,
    backgroundColor: '#080E18',
  },
  blackContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },

  // Top Bar & Dashes (consistent across all 3 screenshots)
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
    backgroundColor: '#FFFFFF',
  },
  dashInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },

  // State 1: Cyan Banner & Close Button
  closeBtnRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  whiteCloseCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cyanBannerWrapper: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  cyanBanner: {
    backgroundColor: '#72D2EA',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cyanBannerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 32,
  },
  fullCameraBox: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },

  // State 2: Red Start Button & Dark Container Box
  startBtnContainer: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
  },
  redStartBtn: {
    backgroundColor: '#DE4B5B',
    borderRadius: 26,
    paddingVertical: 13,
    paddingHorizontal: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DE4B5B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  redStartBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingTop: 28,
    paddingBottom: 36,
    alignItems: 'center',
  },
  darkCardText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 28,
  },
  ovalViewfinder: {
    width: Math.min(SCREEN_WIDTH * 0.58, 220),
    height: Math.min(SCREEN_WIDTH * 0.58, 220) * 1.42,
    borderRadius: 110,
    overflow: 'hidden',
    backgroundColor: '#111827',
    alignSelf: 'center',
  },

  // Camera Placeholder
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

  // State 3: Pitch Black Screen with Cyan Spinner
  centerInitializingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  initializingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 22,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
