import React, {
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AppContext from '../../context/CreateGlobalStateContext';
import {Colors, Spacing, Shadows} from '../../theme';
import {useProfile} from '../../api/useProfile';
import {useUserImages, mapImagesToSlots} from '../../api/useImages';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getAuthSession} from '../../utils/session';
import {useAlert} from '../../components/AlertModal';

const AboutProfileScreen = ({navigation}: any) => {
  const {
    profileText,
    setProfileText,
    name,
    displayName,
    date,
    height,
    selectedLanguages,
    selectedEthinicity,
    selectedSmoking,
    selectedDrinking,
    selectedLookingFor,
    images,
    setImages,
    profileImage,
    setProfileImage,
    profileImageUrl,
    setProfileImageUrl,
    authUserId,
    selected,
    selectedAppearance,
    selectedBodyType,
    englishSkillLevel,
  } = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(true);
  const [identityPending, setIdentityPending] = useState(false);
  const {updateUser, uploadImage} = useProfile();
  const {getAllImages} = useUserImages();
  const resolveAttemptsRef = useRef(0);
  const {alert, AlertComponent} = useAlert();

  const continueToNextStep = async () => {
    setLoading(false);
    await AsyncStorage.setItem('onboardingStep', 'ConnectTelegram');
    navigation.replace('ConnectTelegram');
  };

  const resolveGenderOrientation = (selection?: string | null) => {
    switch (selection) {
      case 'straight_woman':
        return {gender: 'woman', orientation: 'straight'};
      case 'straight_man':
        return {gender: 'man', orientation: 'straight'};
      case 'lgbtqia':
        return {gender: 'lgbtqia', orientation: 'lgbtqia'};
      default:
        return {gender: 'woman', orientation: 'straight'};
    }
  };

  const normalizeTextValue = (value: unknown, fallback: string) => {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return fallback;
  };

  const normalizeJoinedValues = (value: unknown, fallback: string) => {
    if (Array.isArray(value)) {
      const joined = value
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .join(', ');
      return joined || fallback;
    }
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return fallback;
  };

  const shouldAllowLocalFallback = (error: any) => {
    const statusCode = Number(error?.response?.status);
    const message = String(
      error?.response?.data?.message || error?.message || '',
    ).toLowerCase();
    return (
      message.includes('network error') ||
      message.includes('timeout') ||
      statusCode >= 500
    );
  };

  const isSessionSyncError = (error: any) => {
    const statusCode = Number(error?.response?.status);
    const message = String(
      error?.response?.data?.message || error?.message || '',
    ).toLowerCase();
    return (
      statusCode === 401 ||
      statusCode === 403 ||
      message.includes('user not found') ||
      message.includes('profile not found') ||
      message.includes('invalid userid')
    );
  };

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'AboutProfile');
    }, []),
  );

  useEffect(() => {
    let isMounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const resolveIdentity = async () => {
      const authSession = await getAuthSession();
      if (authSession?.token) {
        if (isMounted) {
          setIdentityPending(false);
          setIsResolving(false);
        }
        return;
      }

      resolveAttemptsRef.current += 1;
      if (resolveAttemptsRef.current >= 3) {
        if (isMounted) {
          setIdentityPending(true);
          setIsResolving(false);
        }
        return;
      }

      retryTimer = setTimeout(resolveIdentity, 2000);
    };

    resolveIdentity();

    return () => {
      isMounted = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [navigation]);

  useEffect(() => {
    let isMounted = true;
    const preloadImages = async () => {
      const hasImagesInContext =
        Array.isArray(images) && images.some(img => Boolean(img));
      if (hasImagesInContext) return;

      try {
        const stored = await AsyncStorage.getItem('onboardingImages');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.some(Boolean)) {
            if (isMounted) setImages?.(parsed);
            return;
          }
        }
      } catch (e) {}

      try {
        const authSession = await getAuthSession();
        const uid = authSession?.userId || authUserId;
        if (uid) {
          const res = await getAllImages.mutateAsync(String(uid));
          const mapped = mapImagesToSlots(res);
          if (mapped.slots.some(Boolean) && isMounted) {
            setImages?.(mapped.slots);
            if (mapped.profileImageUrl) {
              setProfileImage?.(mapped.profileImageUrl);
              setProfileImageUrl?.(mapped.profileImageUrl);
            }
          }
        }
      } catch (e) {}
    };

    preloadImages();
    return () => {
      isMounted = false;
    };
  }, [authUserId, getAllImages, images, setImages, setProfileImage, setProfileImageUrl]);

  const handleFinishOnboarding = async (retryCount = 0): Promise<void> => {
    if (retryCount > 2) {
      setLoading(false);
      alert(
        'Sync Error',
        'We are having trouble syncing your account. Please try again or contact support.',
      );
      return;
    }

    try {
      setLoading(true);

      const authSession = await getAuthSession();
      const hasUsableSessionToken = Boolean(authSession?.token);

      if (!hasUsableSessionToken) {
        setIdentityPending(true);
        await continueToNextStep();
        return;
      }

      const safeDate = date ? new Date(date) : new Date('2000-01-01');
      const today = new Date();
      let calculatedAge = today.getFullYear() - safeDate.getFullYear();
      const monthGap = today.getMonth() - safeDate.getMonth();
      if (
        monthGap < 0 ||
        (monthGap === 0 && today.getDate() < safeDate.getDate())
      ) {
        calculatedAge -= 1;
      }

      const {gender, orientation} = resolveGenderOrientation(selected);
      let availableImages = (Array.isArray(images) ? images : []).filter(
        (img): img is string => typeof img === 'string' && img.trim().length > 0,
      );

      if (availableImages.length === 0) {
        try {
          const stored = await AsyncStorage.getItem('onboardingImages');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              availableImages = parsed.filter(
                (img): img is string =>
                  typeof img === 'string' && img.trim().length > 0,
              );
              if (availableImages.length > 0) {
                setImages?.(parsed);
              }
            }
          }
        } catch (e) {}
      }

      if (availableImages.length === 0) {
        try {
          const uid = authSession?.userId || authUserId;
          if (uid) {
            const res = await getAllImages.mutateAsync(String(uid));
            const mapped = mapImagesToSlots(res);
            if (mapped.slots.some(Boolean)) {
              availableImages = mapped.slots.filter(
                (img): img is string =>
                  typeof img === 'string' && img.trim().length > 0,
              );
              setImages?.(mapped.slots);
              if (mapped.profileImageUrl) {
                setProfileImage?.(mapped.profileImageUrl);
                setProfileImageUrl?.(mapped.profileImageUrl);
              }
            }
          }
        } catch (e) {
          console.warn('[AboutProfile] Failed to fetch server images:', e);
        }
      }

      const uploadableImages = availableImages.filter(
        (image): image is string =>
          Boolean(image) && !String(image).startsWith('http'),
      );

      const firstImage =
        uploadableImages[0] ||
        availableImages[0] ||
        profileImage ||
        profileImageUrl ||
        null;

      if (!firstImage) {
        setLoading(false);
        alert(
          'Photo Required',
          'Please go back and add your profile photo first.',
        );
        return;
      }

      const profilePhoto = !String(firstImage).startsWith('http')
        ? {
            uri: firstImage,
            type: 'image/jpeg',
            name: 'profile.jpg',
          }
        : undefined;
      const storedName =
        (await AsyncStorage.getItem('name')) ||
        (await AsyncStorage.getItem('displayName')) ||
        (await AsyncStorage.getItem('userName'));
      const effectiveName = normalizeTextValue(
        displayName || name || storedName,
        'User',
      );

      const profileData = {
        name: effectiveName,
        displayName: effectiveName,
        gender,
        orientation,
        age: calculatedAge,
        bio: normalizeTextValue(
          profileText,
          'Hello, I am excited to meet new people here.',
        ),
        dob: safeDate.toISOString().split('T')[0],
        language: normalizeJoinedValues(selectedLanguages, 'English'),
        appearance: normalizeTextValue(selectedAppearance, 'Attractive'),
        bodyType: normalizeTextValue(selectedBodyType, 'Slim'),
        height: Number(height) || 165,
        englishLevel:
          ['Beginner', 'Intermediate', 'Advanced', 'Native'][
            englishSkillLevel || 0
          ] || 'Beginner',
        ethnicity: normalizeTextValue(selectedEthinicity, 'Indian'),
        lookingFor: normalizeJoinedValues(selectedLookingFor, 'Relationship'),
        smoke: normalizeTextValue(selectedSmoking, 'No'),
        drink: normalizeTextValue(selectedDrinking, 'No'),
      };

      try {
        const res = await updateUser.mutateAsync({
          uid: '',
          dto: profileData,
          photo: profilePhoto,
        });

        console.log('[AboutProfile] Profile setup success:', res);

        const remainingImages = uploadableImages.slice(profilePhoto ? 1 : 0);
        if (remainingImages.length > 0) {
          await Promise.allSettled(
            remainingImages.map((uri, i) =>
              uploadImage.mutateAsync({
                photo: {uri, name: `gallery_${i + 1}.jpg`, type: 'image/jpeg'},
              }),
            ),
          );
        }

        await continueToNextStep();
      } catch (error: any) {
        console.warn(
          '[AboutProfile] Submission Error:',
          error?.response?.data || error.message,
        );

        if (isSessionSyncError(error)) {
          setLoading(false);
          alert(
            'Sync Required',
            'Your account is taking longer than usual to sync. Would you like to try again?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => setLoading(false),
              },
              {
                text: 'Retry Now',
                onPress: () => handleFinishOnboarding(retryCount + 1),
              },
              {text: 'Skip & Finish', onPress: () => continueToNextStep()},
            ],
          );
          return;
        }

        if (shouldAllowLocalFallback(error)) {
          await continueToNextStep();
          return;
        }

        throw error;
      }
    } catch (error) {
      console.warn('Unexpected error:', error);
      alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (isResolving) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled">
              <View style={styles.progressBackground}>
                <View style={styles.progressBar} />
              </View>

              <Text style={styles.heading}>Wow, looking sharp!</Text>

              <Text style={styles.subtext}>
                Now tell us something about yourself. You can write about your
                hobbies, values and visions in life.
              </Text>

              {identityPending ? (
                <Text style={styles.pendingText}>
                  Your account is still syncing. You can continue now, and we
                  will finish profile sync as soon as your numeric account ID is
                  available.
                </Text>
              ) : null}

              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Your profile text"
                  placeholderTextColor={Colors.textMuted}
                  value={profileText}
                  onChangeText={setProfileText}
                  maxLength={500}
                  multiline
                />
              </View>

              <Text style={styles.charCount}>
                {profileText?.length || 0} / 500
              </Text>

              <Text style={styles.footerText}>
                For more info, questions, feedback, and perhaps to say hello,
                kindly send an e-mail to hi@amara.app.
              </Text>

              <TouchableOpacity
                style={[
                  styles.nextButton,
                  (!profileText?.trim() || loading) && {opacity: 0.5},
                ]}
                disabled={!profileText?.trim() || loading}
                onPress={() => handleFinishOnboarding(0)}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.nextGradient}>
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.nextButtonText}>Next</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
        {AlertComponent}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  gradient: {flex: 1},
  safeArea: {flex: 1},
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: Platform.OS === 'android' ? Spacing.lg : 0,
    justifyContent: 'flex-start',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  progressBackground: {
    height: 4,
    backgroundColor: Colors.surfaceLighter,
    borderRadius: 2,
    marginTop: Spacing.sm + 2,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  progressBar: {
    width: '90%',
    height: '100%',
    backgroundColor: Colors.primary,
  },
  heading: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: Spacing.sm + 2,
  },
  subtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  pendingText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    height: 180,
    paddingTop: Spacing.lg,
    textAlignVertical: 'top',
    fontSize: 16,
    color: Colors.text,
  },
  charCount: {
    textAlign: 'right',
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },
  nextButton: {
    borderRadius: Spacing.radiusFull,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  nextGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
});

export default AboutProfileScreen;
