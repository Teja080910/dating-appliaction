import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '../../api/useProfile';
import Description from '../../components/ProfileTabComponents/ProfileSettings/Description';
import DisplayName from '../../components/ProfileTabComponents/ProfileSettings/DisplayName';
import ProfileSettingsHeader from '../../components/ProfileTabComponents/ProfileSettings/ProfileSettingHeader';
import ProfilePhotoGrid from '../../components/ProfileTabComponents/ProfileSettings/ProfilePhotoGrid';
import YourBirthday from '../../components/ProfileTabComponents/ProfileSettings/YourBirthday';
import ContactDetails, { COUNTRIES_LIST, getDefaultCountryForLanguage, parsePhoneNumberAndCountry } from '../../components/ProfileTabComponents/ProfileSettings/ContactDetails';
import PhoneOtpModal from '../../components/ProfileTabComponents/ProfileSettings/PhoneOtpModal';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../theme';
import { getAuthSession } from '../../utils/session';
import { useAlert } from '../../components/AlertModal';
import { getUserFriendlyMessage } from '../../utils/userFriendlyMessages';
import { dedupeImageUris } from '../../utils/imageHelpers';
import { t, useTranslation } from '../../i18n';

const ProfileSettingsScreen = () => {
  const { language } = useTranslation();
  const defaultCountry = getDefaultCountryForLanguage(language);
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const {
    displayName,
    setDisplayName,
    profileText,
    setProfileText,
    date,
    setDate,
    setName,
    images,
    setImages,
    setProfileImage,
    setProfileImageUrl,
    phoneNumber: contextPhone,
    setPhoneNumber: setContextPhone,
  } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [localDisplayName, setLocalDisplayName] = useState(displayName);
  const [localDescription, setLocalDescription] = useState(profileText);
  const [localDob, setLocalDob] = useState(date.toISOString().split('T')[0]);

  // Contact details state (defaults to primary app language country)
  const [countryCode, setCountryCode] = useState(defaultCountry.code);
  const [countryName, setCountryName] = useState(defaultCountry.name);
  const [countryFlag, setCountryFlag] = useState(defaultCountry.flag);
  const [localPhoneNumber, setLocalPhoneNumber] = useState('');
  const [localTelegramUsername, setLocalTelegramUsername] = useState('');

  const isCleanPhoneNumber = (val?: string | null): boolean => {
    if (!val) return false;
    const str = String(val).trim();
    if (!str || str.includes('@') || /[a-zA-Z]/.test(str)) return false;
    return /\d/.test(str);
  };

  const { updateBasic, updateProfile, useMyProfile, sendWhatsappOtp, verifyWhatsappOtp } = useProfile();
  const profileQuery = useMyProfile(undefined);
  const { alert, AlertComponent } = useAlert();

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string>('');
  const [pendingSessionId, setPendingSessionId] = useState<string>('');
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(true);
  const pendingSaveDataRef = useRef<{
    cleanName: string;
    cleanBio: string;
    fullPhone: string;
    computedAge: number;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      profileQuery.refetch();
    }, [])
  );

  useEffect(() => {
    const loadStoredDobAndContact = async () => {
      try {
        const storedName = (await AsyncStorage.getItem('displayName')) || (await AsyncStorage.getItem('name'));
        if (storedName) {
          setLocalDisplayName((prev) => prev || storedName);
          setDisplayName((prev) => prev || storedName);
        }

        const storedBio = (await AsyncStorage.getItem('bio')) || (await AsyncStorage.getItem('@onboarding_bio'));
        if (storedBio) {
          setLocalDescription((prev) => prev || storedBio);
          setProfileText((prev) => prev || storedBio);
        }

        const storedDob = await AsyncStorage.getItem('userDob');
        if (storedDob) {
          setLocalDob(storedDob);
          setDate(new Date(storedDob));
        }

        const uid = (await AsyncStorage.getItem('userId')) || '';
        const userScopedPhone = uid ? await AsyncStorage.getItem(`user_phone_${uid}`) : null;
        const storedPhone = userScopedPhone || (await AsyncStorage.getItem('phoneNumber'));
        if (storedPhone) {
          if (isCleanPhoneNumber(storedPhone)) {
            const parsed = parsePhoneNumberAndCountry(storedPhone);
            if (parsed?.code) {
              setCountryCode(parsed.code);
              if (parsed.name) setCountryName(parsed.name);
              if (parsed.flag) setCountryFlag(parsed.flag);
            }
            if (parsed?.number) {
              setLocalPhoneNumber(parsed.number);
            }
          } else {
            // Clean up any stale/email-contaminated value from storage
            await AsyncStorage.removeItem('phoneNumber');
            setLocalPhoneNumber('');
          }
        }

        const [uTg, atTg, legTg, legAtTg] = await Promise.all([
          uid ? AsyncStorage.getItem(`user_telegram_${uid}`).catch(() => null) : null,
          uid ? AsyncStorage.getItem(`@telegram_username_${uid}`).catch(() => null) : null,
          AsyncStorage.getItem('telegramUsername').catch(() => null),
          AsyncStorage.getItem('@telegram_username').catch(() => null),
        ]);
        const candTg = [uTg, atTg, legTg, legAtTg].find((val) => {
          if (!val) return false;
          const c = String(val).trim().replace(/^@+/, '');
          const n = c.toUpperCase();
          return c && n !== 'NONE' && n !== 'NULL' && n !== 'UNDEFINED' && n !== '-' && n !== 'N/A';
        });
        if (candTg) {
          setLocalTelegramUsername(String(candTg).trim().replace(/^@+/, ''));
        }
      } catch (e) {}
    };
    void loadStoredDobAndContact();
  }, [setDate, setDisplayName, setProfileText]);

  const profilePhotos = useMemo(() => {
    return dedupeImageUris([
      profileQuery.data?.photos,
      profileQuery.data?.images,
      profileQuery.data?.allImages,
      profileQuery.data?.profileImageUrl,
    ]);
  }, [
    profileQuery.data?.photos,
    profileQuery.data?.images,
    profileQuery.data?.profileImageUrl,
  ]);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;

    const nextName = profile.displayName || profile.name;
    if (nextName) {
      setLocalDisplayName(nextName);
      setDisplayName(nextName);
      setName(nextName);
    }

    if (profile.bio) {
      setLocalDescription(profile.bio);
      setProfileText(profile.bio);
    }

    if (profile.dob) {
      setLocalDob(profile.dob);
      setDate(new Date(profile.dob));
    }

    const candidatePhone = profile.phoneNumber || profile.mobile || profile.phone || (profile as any).mobileNumber;
    if (candidatePhone && isCleanPhoneNumber(candidatePhone)) {
      const parsed = parsePhoneNumberAndCountry(candidatePhone);
      if (parsed?.code) {
        setCountryCode(parsed.code);
        if (parsed.name) setCountryName(parsed.name);
        if (parsed.flag) setCountryFlag(parsed.flag);
      }
      if (parsed?.number) {
        setLocalPhoneNumber(parsed.number);
      }
    } else {
      setLocalPhoneNumber('');
    }

    const rawTg = (profile.telegramUsername || (profile as any).telegram || (profile as any).tgUsername)
      ? String(profile.telegramUsername || (profile as any).telegram || (profile as any).tgUsername).replace(/^@+/, '').trim()
      : '';
    const normTg = rawTg.toUpperCase();
    if (rawTg && normTg !== 'NONE' && normTg !== 'NULL' && normTg !== 'UNDEFINED' && normTg !== '-' && normTg !== 'N/A') {
      setLocalTelegramUsername(rawTg);
    } else {
      AsyncStorage.getItem('userId').then(async (uid) => {
        const [uTg, atTg, legTg, legAtTg] = await Promise.all([
          uid ? AsyncStorage.getItem(`user_telegram_${uid}`).catch(() => null) : null,
          uid ? AsyncStorage.getItem(`@telegram_username_${uid}`).catch(() => null) : null,
          AsyncStorage.getItem('telegramUsername').catch(() => null),
          AsyncStorage.getItem('@telegram_username').catch(() => null),
        ]);
        const cand = [uTg, atTg, legTg, legAtTg].find((val) => {
          if (!val) return false;
          const c = String(val).trim().replace(/^@+/, '');
          const n = c.toUpperCase();
          return c && n !== 'NONE' && n !== 'NULL' && n !== 'UNDEFINED' && n !== '-' && n !== 'N/A';
        });
        if (cand) {
          setLocalTelegramUsername(String(cand).trim().replace(/^@+/, ''));
        }
      }).catch(() => {});
    }
  }, [profileQuery.data, setDate, setDisplayName, setName, setProfileText]);

  const computedAge = useMemo(() => {
    const dob = new Date(localDob);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthGap = now.getMonth() - dob.getMonth();

    if (monthGap < 0 || (monthGap === 0 && now.getDate() < dob.getDate())) {
      age -= 1;
    }

    return age;
  }, [localDob]);

  const executePersist = async (
    cleanName: string,
    cleanBio: string,
    fullPhone: string,
    ageToSave: number
  ) => {
    setLoading(true);
    const authSession = await getAuthSession();
    if (!authSession?.token) {
      alert(t('more_info.moreinfoscreen.session_error'), t('profile.profilesettingsscreen.please_log_in_again'), [
        {
          text: t('profile.profilesettingsscreen.ok'),
          onPress: () => navigation.replace('Login'),
        },
      ]);
      setLoading(false);
      return;
    }

    const currentUid = (await AsyncStorage.getItem('userId')) || String(profileQuery.data?.userId || profileQuery.data?.id || '');

    const persistLocalState = async (savePhone = true) => {
      setDisplayName(cleanName);
      setName(cleanName);
      setProfileText(cleanBio);
      setDate(new Date(localDob));

      await AsyncStorage.setItem('displayName', cleanName);
      await AsyncStorage.setItem('name', cleanName);
      await AsyncStorage.setItem('userName', cleanName);
      await AsyncStorage.setItem('bio', cleanBio);
      await AsyncStorage.setItem('userBio', cleanBio);
      await AsyncStorage.setItem('@onboarding_bio', cleanBio);
      await AsyncStorage.setItem('userDob', localDob);
      if (currentUid) {
        await AsyncStorage.setItem(`user_name_${currentUid}`, cleanName);
        await AsyncStorage.setItem(`user_dob_${currentUid}`, localDob);
      }
      const validPhotos = (images || []).filter(Boolean) as string[];
      await AsyncStorage.setItem('onboardingImages', JSON.stringify(images || []));
      if (currentUid) {
        await AsyncStorage.setItem(`user_photos_${currentUid}`, JSON.stringify(images || []));
      }
      if (validPhotos[0]) {
        await AsyncStorage.setItem('profileImage', validPhotos[0]);
        if (currentUid) {
          await AsyncStorage.setItem(`user_profile_photo_${currentUid}`, validPhotos[0]);
        }
        setProfileImage(validPhotos[0]);
        setProfileImageUrl(validPhotos[0]);
      } else {
        await AsyncStorage.removeItem('profileImage');
        if (currentUid) {
          await AsyncStorage.removeItem(`user_profile_photo_${currentUid}`);
        }
      }

      if (savePhone && fullPhone) {
        setContextPhone(fullPhone);
        await AsyncStorage.setItem('phoneNumber', fullPhone);
        await AsyncStorage.setItem('userMobile', fullPhone);
        if (currentUid) {
          await AsyncStorage.setItem(`user_phone_${currentUid}`, fullPhone);
        }
      } else if (!savePhone) {
        // preserve existing phone without overwriting with conflicting value
      } else {
        setContextPhone('');
        await AsyncStorage.removeItem('phoneNumber');
        await AsyncStorage.removeItem('userMobile');
        if (currentUid) {
          await AsyncStorage.removeItem(`user_phone_${currentUid}`);
        }
      }
      if (localTelegramUsername.trim()) {
        const cleanTg = localTelegramUsername.trim().replace(/^@+/, '');
        await AsyncStorage.setItem('telegramUsername', cleanTg);
        await AsyncStorage.setItem('@telegram_username', cleanTg);
        if (currentUid) {
          await AsyncStorage.setItem(`user_telegram_${currentUid}`, cleanTg);
          await AsyncStorage.setItem(`@telegram_username_${currentUid}`, cleanTg);
          await AsyncStorage.removeItem(`@amara_telegram_disconnected_${currentUid}`).catch(() => {});
        }
      } else {
        const isExplicitlyDisconnected = currentUid
          ? (await AsyncStorage.getItem(`@amara_telegram_disconnected_${currentUid}`).catch(() => null)) === 'true'
          : false;
        if (isExplicitlyDisconnected) {
          await AsyncStorage.multiRemove(['telegramUsername', '@telegram_username']).catch(() => {});
          if (currentUid) {
            await AsyncStorage.multiRemove([
              `user_telegram_${currentUid}`,
              `@telegram_username_${currentUid}`,
            ]).catch(() => {});
          }
        }
      }
    };

    updateProfile.mutate(
      {
        userId: currentUid,
        displayName: cleanName,
        name: cleanName,
        bio: cleanBio,
        dob: localDob,
        age: ageToSave,
        telegramUsername: localTelegramUsername.trim() || undefined,
        mobile: fullPhone || '',
        phoneNumber: fullPhone || '',
      } as any,
      {
        onSuccess: async () => {
          await persistLocalState();
          await profileQuery.refetch();
          DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED', { uid: currentUid });
          navigation.goBack();
        },
        onError: async (error: any) => {
          const status = Number(error?.response?.status || error?.status);
          const code = String(error?.response?.data?.code || error?.code || '').toUpperCase();
          const rawMsg = String(
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            (typeof error?.response?.data === 'string' ? error.response.data : '') ||
            error?.message ||
            ''
          ).toLowerCase();

          const isDuplicatePhone =
            status === 409 ||
            code === 'CONFLICT' ||
            code === 'DUPLICATE_ENTRY' ||
            rawMsg.includes('already exists') ||
            rawMsg.includes('already registered') ||
            rawMsg.includes('already in use') ||
            rawMsg.includes('duplicate');

          if (isDuplicatePhone) {
            try {
              // Retry saving profile without conflicting mobile so name, bio, dob, photos still save!
              await updateProfile.mutateAsync({
                userId: currentUid,
                displayName: cleanName,
                name: cleanName,
                bio: cleanBio,
                dob: localDob,
                age: ageToSave,
                telegramUsername: localTelegramUsername.trim() || undefined,
              } as any);
              await persistLocalState(false);
              await profileQuery.refetch();
              DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED', { uid: currentUid });
              alert(
                t('profile.profilesettingsscreen.phone_already_exists_title', {
                  defaultValue: 'Number Already in Use',
                }),
                t('profile.profilesettingsscreen.phone_already_exists_desc', {
                  defaultValue:
                    'Your profile details were saved, but this WhatsApp number is already linked to another account in the database. Please use a different number.',
                }),
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
              return;
            } catch {
              alert(
                t('profile.profilesettingsscreen.phone_already_exists_title', {
                  defaultValue: 'Number Already in Use',
                }),
                t('profile.profilesettingsscreen.phone_already_exists_desc', {
                  defaultValue:
                    'This WhatsApp / phone number is already registered with another account. Please use a different number.',
                })
              );
              return;
            }
          }

          // Always save locally and return smoothly without disruptive popups
          await persistLocalState();
          await profileQuery.refetch();
          DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED', { uid: currentUid });
          navigation.goBack();
        },
        onSettled: () => setLoading(false),
      }
    );
  };

  const handleVerifyOtp = async (enteredOtp: string) => {
    if (!pendingPhone) return;
    setOtpLoading(true);
    setOtpError(null);
    try {
      await verifyWhatsappOtp.mutateAsync({
        mobile: pendingPhone,
        otp: enteredOtp,
        sessionId: pendingSessionId,
      });
      setIsPhoneVerified(true);
      setOtpLoading(false);
      setOtpModalVisible(false);
      if (pendingSaveDataRef.current) {
        const { cleanName, cleanBio, fullPhone, computedAge: ageVal } = pendingSaveDataRef.current;
        void executePersist(cleanName, cleanBio, fullPhone, ageVal);
      }
    } catch (err: any) {
      setOtpLoading(false);
      const rawMsg = String(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        ''
      );
      setOtpError(
        rawMsg && !rawMsg.includes('400') && !rawMsg.includes('Network')
          ? rawMsg
          : t('profile.phone_otp.invalid_code', {
              defaultValue: 'Invalid or expired verification code. Please check and try again.',
            })
      );
    }
  };

  const handleResendOtp = async () => {
    if (!pendingPhone) return;
    setOtpError(null);
    try {
      const data = await sendWhatsappOtp.mutateAsync({ mobile: pendingPhone });
      const sessId =
        data?.sessionId ||
        data?.data?.sessionId ||
        data?.session_id ||
        data?.data?.session_id ||
        data?.otpSessionId ||
        data?.data?.otpSessionId ||
        data?.id ||
        data?.data?.id ||
        '';
      if (sessId) setPendingSessionId(sessId);
    } catch (err: any) {
      const rawMsg = String(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        ''
      );
      setOtpError(
        rawMsg ||
          t('profile.phone_otp.send_failed_desc', {
            defaultValue: 'Could not send verification code to this WhatsApp number. Please check the number and try again.',
          })
      );
    }
  };

  const handleSave = () => {
    if (isNaN(computedAge) || computedAge < 18) {
      alert(
        t('onboarding.dobscreen.age_restriction', { defaultValue: 'Age Restriction' }),
        t('onboarding.dobscreen.you_must_be_at_least_18_years_old_to_register', {
          defaultValue: 'You must be at least 18 years old.',
        })
      );
      return;
    }

    const cleanName = (localDisplayName.trim() || displayName || t('home.usercard.user')).trim();
    const cleanBio = localDescription.trim();

    const parsedInput = parsePhoneNumberAndCountry(localPhoneNumber);
    const effectiveCountryCode = parsedInput?.code || countryCode;
    let cleanPhoneDigits = (parsedInput?.number || localPhoneNumber).replace(/[^\d]/g, '').trim();

    // Prevent duplicate country code prefix: if cleanPhoneDigits starts with country code digits (e.g. 91), strip it
    const codeDigits = effectiveCountryCode.replace(/\D/g, '');
    while (codeDigits && cleanPhoneDigits.startsWith(codeDigits) && cleanPhoneDigits.length >= codeDigits.length + 7) {
      cleanPhoneDigits = cleanPhoneDigits.slice(codeDigits.length);
    }
    const fullPhone = cleanPhoneDigits.length >= 7 ? `${effectiveCountryCode} ${cleanPhoneDigits}` : '';

    if (localPhoneNumber.trim() && cleanPhoneDigits.length < 7) {
      alert(
        t('profile.profilesettingsscreen.invalid_phone_title', { defaultValue: 'Invalid Phone Number' }),
        t('profile.profilesettingsscreen.invalid_phone_desc', { defaultValue: 'Please enter a valid mobile number.' })
      );
      return;
    }

    const normalizeForCompare = (phoneStr?: string | null) => {
      if (!phoneStr) return '';
      const parsed = parsePhoneNumberAndCountry(phoneStr);
      const code = (parsed?.code || '').replace(/\D/g, '');
      let num = (parsed?.number || phoneStr).replace(/\D/g, '');
      if (code && num.startsWith(code) && num.length >= code.length + 7) {
        num = num.slice(code.length);
      }
      return `${code}${num}`;
    };

    const existingCandidate =
      profileQuery.data?.phoneNumber ||
      profileQuery.data?.mobile ||
      profileQuery.data?.phone ||
      (profileQuery.data as any)?.mobileNumber ||
      contextPhone ||
      '';

    const isPhoneChanged =
      Boolean(fullPhone) &&
      normalizeForCompare(fullPhone) !== normalizeForCompare(existingCandidate);

    pendingSaveDataRef.current = {
      cleanName,
      cleanBio,
      fullPhone,
      computedAge,
    };

    // Persist profile changes directly to the database via PUT /profile/update
    void executePersist(cleanName, cleanBio, fullPhone, computedAge);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ProfileSettingsHeader />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            backgroundColor: themeColors.background,
            paddingBottom: Math.max(insets.bottom, 16) + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DisplayName value={localDisplayName} onChange={setLocalDisplayName} />

        <YourBirthday value={localDob} onChange={setLocalDob} />

        <Description value={localDescription} onChange={setLocalDescription} />

        <ProfilePhotoGrid
          initialPhotos={profilePhotos}
          userId={String(profileQuery.data?.userId || profileQuery.data?.id || '') || undefined}
        />

        {/* Contact Details (WhatsApp & Telegram) */}
        <ContactDetails
          showWhatsApp={true}
          countryCode={countryCode}
          setCountryCode={setCountryCode}
          countryName={countryName}
          setCountryName={setCountryName}
          countryFlag={countryFlag}
          setCountryFlag={setCountryFlag}
          phoneNumber={localPhoneNumber}
          setPhoneNumber={setLocalPhoneNumber}
          telegramUsername={localTelegramUsername}
          setTelegramUsername={setLocalTelegramUsername}
          isVerified={isPhoneVerified}
          setIsVerified={setIsPhoneVerified}
        />

        {/* Screenshot 1: Save Pill Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>{t('more_info.savebutton.save')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <PhoneOtpModal
        visible={otpModalVisible}
        phoneNumber={pendingPhone}
        loading={otpLoading}
        errorMessage={otpError}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onClose={() => {
          setOtpModalVisible(false);
          setOtpError(null);
        }}
      />

      {AlertComponent}
    </SafeAreaView>
  );
};

export default ProfileSettingsScreen;

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      backgroundColor: colors.background,
      flexGrow: 1,
    },
    saveBtn: {
      backgroundColor: '#E05353',
      marginHorizontal: 20,
      marginTop: 32,
      marginBottom: 16,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowColor: '#E05353',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  });

