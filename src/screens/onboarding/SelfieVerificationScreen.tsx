import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Asset, launchCamera } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import LinearGradient from 'react-native-linear-gradient';

import { useMyProfile, useProfile } from '../../api/useProfile';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing, Shadows } from '../../theme';
import { getAuthSession } from '../../utils/session';
import { useAlert } from '../../components/AlertModal';

const SELFIE_MAX_SIZE_BYTES = 60 * 1024;

const formatBytesInMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const resolveAssetSize = async (uri?: string | null) => {
  if (!uri) {
    return null;
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return typeof blob.size === 'number' ? blob.size : null;
  } catch (error) {
    console.warn('Unable to estimate file size:', error);
    return null;
  }
};

const getSelfieErrorMessage = (error: any) => {
  const backendMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Selfie upload failed. Please try once again.';

  if (String(backendMessage).toLowerCase().includes('maximum upload size exceeded')) {
    return 'Your selfie file is too large. Move closer to the camera and retake it in good light.';
  }

  return String(backendMessage);
};

const SelfieVerificationScreen = ({ navigation }: any) => {
  const { images, setAuthUserId, setVerifiedSelfie } = useContext(AppContext);
  const isScreenFocused = useIsFocused();
  const cameraRef = useRef<Camera>(null);
  const frontCamera = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [loadingSession, setLoadingSession] = useState(true);

  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [hasSessionToken, setHasSessionToken] = useState(false);
  const [selfieSizeBytes, setSelfieSizeBytes] = useState<number | null>(null);

  const { uploadSelfie, verifySelfie } = useProfile();
  const { data: profile } = useMyProfile(undefined);
  const { alert, AlertComponent } = useAlert();

  useEffect(() => {
    const loadSession = async () => {
      try {
        const authSession = await getAuthSession();
        if (authSession?.token) {
          setHasSessionToken(true);
          if (authSession?.userId) {
            setAuthUserId?.(String(authSession.userId));
          }
        } else {
          alert('Session Error', 'Please log in again.', [
            {
              text: 'OK',
              onPress: () => navigation.replace('Login'),
            },
          ]);
        }
      } catch (err) {
        console.warn('Session Load Error:', err);
      } finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, [navigation, setAuthUserId]);

  useEffect(() => {
    if (profile?.verifiedSelfie || profile?.selfieVerified) {
      setIsVerified(true);
      setCanContinue(true);
      setVerifiedSelfie?.(true);
    }
  }, [profile, setVerifiedSelfie]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'SelfieVerification');

      const onBackPress = () => {
        if (showCamera) {
          setShowCamera(false);
          return true;
        }

        navigation.replace('UploadImage');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => backHandler.remove();
    }, [navigation, showCamera]),
  );

  const captureCompressedSelfie = async () => {
    const response = await launchCamera({
      mediaType: 'photo',
      cameraType: 'front',
      quality: 0.1,
      maxWidth: 120,
      maxHeight: 160,
      saveToPhotos: false,
      presentationStyle: 'fullScreen',
    });

    if (response.didCancel) {
      return null;
    }

    if (response.errorCode) {
      throw new Error(response.errorMessage || 'Unable to open selfie camera.');
    }

    const asset = response.assets?.[0];
    if (!asset?.uri) {
      throw new Error('Unable to capture selfie right now.');
    }

    const resolvedSize =
      typeof asset.fileSize === 'number' ? asset.fileSize : await resolveAssetSize(asset.uri);

    return {
      ...asset,
      fileSize: resolvedSize ?? asset.fileSize,
    };
  };

  const handleOpenCamera = async () => {
    if (!hasSessionToken) {
      alert('Wait', 'User session loading...');
      return;
    }

    const granted = hasPermission || (await requestPermission());
    if (!granted) {
      alert('Permission Required', 'Camera permission is required');
      return;
    }

    setError(null);
    setIsVerified(false);
    setCanContinue(false);
    setShowCamera(true);
  };

  const handleTakeSelfie = async () => {
    if (!cameraRef.current) {
      setError('Camera is not ready yet.');
      return;
    }

    try {
      setIsCapturing(true);
      setError(null);
      setCanContinue(false);
      setIsVerified(false);
      let resolvedSelfieSize: number | null = null;

      if (Platform.OS === 'android') {
        const snapshot = await cameraRef.current.takeSnapshot({
          quality: 4,
        });
        const snapshotUri = snapshot.path.startsWith('file://')
          ? snapshot.path
          : `file://${snapshot.path}`;
        resolvedSelfieSize = await resolveAssetSize(snapshotUri);

        const asset = {
          uri: snapshotUri,
          fileName: `selfie_${Date.now()}.jpg`,
          type: 'image/jpeg',
        } as Asset;

        setSelfieSizeBytes(resolvedSelfieSize);
        setSelfieUri(snapshotUri);
        setShowCamera(false);

        if (resolvedSelfieSize && resolvedSelfieSize > SELFIE_MAX_SIZE_BYTES) {
          setError(`Your selfie is ${formatBytesInMb(resolvedSelfieSize)}. Please retake it closer to your face in better light.`);
          return;
        }

        await handleUploadAndVerify(asset);
        return;
      }

      const photo = await cameraRef.current.takePhoto({
        enableShutterSound: false,
      });

      const uri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      resolvedSelfieSize = await resolveAssetSize(uri);

      setSelfieSizeBytes(resolvedSelfieSize);

      const asset = {
        uri,
        fileName: `selfie_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as Asset;

      setSelfieUri(uri);
      setShowCamera(false);

      if (resolvedSelfieSize && resolvedSelfieSize > SELFIE_MAX_SIZE_BYTES) {
        setError(`Your selfie is ${formatBytesInMb(resolvedSelfieSize)}. Please retake it closer to your face in better light.`);
        return;
      }

      await handleUploadAndVerify(asset);
    } catch (err: any) {
      setError(err?.message || 'Unable to capture selfie right now.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleUploadAndVerify = async (asset: Asset) => {
    if (!hasSessionToken) {
      setError('User session missing. Please log in again.');
      return;
    }

    setIsUploading(true);
    setError(null);

    if (selfieSizeBytes && selfieSizeBytes > SELFIE_MAX_SIZE_BYTES) {
      setIsUploading(false);
      setCanContinue(false);
      setIsVerified(false);
      setError(`Your selfie is ${formatBytesInMb(selfieSizeBytes)}. Please retake it with better light and keep your face closer to the camera.`);
      return;
    }

    try {
      await uploadSelfie.mutateAsync({ photo: asset });
      setError(null);

      try {
        await verifySelfie.mutateAsync({});
        setIsVerified(true);
        setCanContinue(true);
        setVerifiedSelfie?.(true);
        alert('Success', 'Selfie verified successfully.', [
          { text: 'Continue', onPress: () => navigation.navigate('MoreDetails') },
        ]);
      } catch (verifyError: any) {
        console.warn('Verify Error:', verifyError?.response?.data || verifyError?.message);
        setCanContinue(true);
        alert(
          'Selfie Uploaded',
          'Your selfie was uploaded successfully. Verification is still syncing, but you can continue now.',
          [
            { text: 'Stay Here', style: 'cancel' },
            { text: 'Continue', onPress: () => navigation.navigate('MoreDetails') },
          ],
        );
      }
    } catch (uploadError: any) {
      console.warn('Upload Error:', uploadError?.response?.data || uploadError?.message);
      setCanContinue(false);
      setIsVerified(false);
      setError(getSelfieErrorMessage(uploadError));
    } finally {
      setIsUploading(false);
    }
  };

  const profileImage = images?.find((img: any) => !!img);
  const validationTone = isVerified || canContinue ? Colors.success : error ? Colors.error : Colors.warning;
  const validationTitle = isVerified
    ? 'Perfect selfie'
    : canContinue
      ? 'Selfie uploaded'
      : error
        ? 'Selfie needs retake'
        : 'Take a clear selfie';
  const validationText = isVerified
    ? 'Your selfie is clear and verified.'
    : canContinue
      ? 'Your selfie was accepted. Verification is still syncing.'
      : error
        ? error
        : 'Tap "Open Camera" below to take your selfie.';

  if (loadingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Selfie Verification</Text>

            {showCamera && frontCamera ? (
              <View style={styles.cameraWrapper}>
                <Camera
                  ref={cameraRef}
                  style={styles.cameraPreview}
                  device={frontCamera}
                  isActive={showCamera && isScreenFocused}
                  photo={true}
                  photoQualityBalance="speed"
                />

                <View style={styles.cameraActions}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, isCapturing && styles.disabledButton]}
                    onPress={() => setShowCamera(false)}
                    disabled={isCapturing}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.captureButton, isCapturing && styles.disabledButton]}
                    onPress={handleTakeSelfie}
                    disabled={isCapturing}
                  >
                    {isCapturing ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.buttonText}>Take Selfie</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <View style={styles.avatarSection}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: Colors.surfaceLighter }]} />
              )}
              <Text style={styles.arrowText}>→</Text>
              {selfieUri ? (
                <Image
                  source={{ uri: selfieUri }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: Colors.surfaceLighter }]} />
              )}
            </View>

            <View style={styles.validationCard}>
              <View style={[styles.validationLine, { backgroundColor: validationTone }]} />
              <Text style={[styles.validationTitle, { color: validationTone }]}>{validationTitle}</Text>
              <Text style={styles.validationText}>{validationText}</Text>
              {selfieSizeBytes ? (
                <Text style={styles.validationMeta}>Captured size: {formatBytesInMb(selfieSizeBytes)}</Text>
              ) : null}
            </View>

            {isUploading ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : isVerified ? (
              <Text style={styles.successText}>Verified ✓</Text>
            ) : canContinue ? (
              <Text style={styles.syncText}>Selfie uploaded. Verification is syncing, and you can continue.</Text>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {!isVerified && !showCamera && (
              <TouchableOpacity style={styles.button} onPress={handleOpenCamera}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {selfieUri ? 'Retake Selfie' : 'Open Camera'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, (!canContinue || showCamera) && { opacity: 0.5 }]}
              disabled={!canContinue || showCamera}
              onPress={() => navigation.navigate('MoreDetails')}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Next</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
        {AlertComponent}
      </LinearGradient>
    </View>
  );
};

export default SelfieVerificationScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: Spacing.xl, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: Spacing.xl, color: Colors.text },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceLighter,
    marginHorizontal: Spacing.sm + 2,
    borderWidth: 2,
    borderColor: Colors.glassBorder,
  },
  arrowText: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  validationCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusXxl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  validationLine: {
    width: '100%',
    height: 8,
    borderRadius: Spacing.radiusFull,
    marginBottom: Spacing.md,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  validationText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  validationMeta: {
    marginTop: Spacing.sm,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  cameraWrapper: {
    width: '100%',
    marginBottom: Spacing.xl,
    borderRadius: Spacing.radiusXxl,
    overflow: 'hidden',
    backgroundColor: Colors.black,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  cameraPreview: {
    width: '100%',
    height: 420,
  },
  cameraActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.black,
  },
  button: {
    borderRadius: Spacing.radiusFull,
    overflow: 'hidden',
    marginTop: Spacing.md,
    width: '100%',
    ...Shadows.md,
  },
  buttonGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  captureButton: {
    flex: 1.4,
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: { color: Colors.white, fontWeight: 'bold', fontSize: 15 },
  successText: { color: Colors.success, fontWeight: 'bold', fontSize: 16, marginVertical: Spacing.sm },
  syncText: { color: Colors.primary, fontWeight: 'bold', textAlign: 'center', marginVertical: Spacing.sm },
  errorText: { color: Colors.error, textAlign: 'center', lineHeight: 20, marginVertical: Spacing.sm },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: Spacing.sm + 2, color: Colors.textSecondary },
});
