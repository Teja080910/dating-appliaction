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
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../theme';
import { getAuthSession } from '../../utils/session';
import Toast from 'react-native-toast-message';
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

  const { updateBasic, updateProfile, useMyProfile } = useProfile();
  const profileQuery = useMyProfile(undefined);
  const { alert, AlertComponent } = useAlert();

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

        const userScopedTg = uid ? await AsyncStorage.getItem(`user_telegram_${uid}`) : null;
        if (userScopedTg) {
          setLocalTelegramUsername(userScopedTg.replace(/^@+/, ''));
        } else {
          setLocalTelegramUsername('');
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
    }

    const rawTg = profile.telegramUsername ? String(profile.telegramUsername).replace(/^@+/, '').trim() : '';
    const normTg = rawTg.toUpperCase();
    if (rawTg && normTg !== 'NONE' && normTg !== 'NULL' && normTg !== 'UNDEFINED' && normTg !== '-' && normTg !== 'N/A') {
      setLocalTelegramUsername(rawTg);
    } else {
      AsyncStorage.getItem('userId').then((uid) => {
        if (uid) {
          AsyncStorage.getItem(`user_telegram_${uid}`).then((st) => {
            setLocalTelegramUsername(st ? st.replace(/^@+/, '') : '');
          }).catch(() => setLocalTelegramUsername(''));
        } else {
          setLocalTelegramUsername('');
        }
      }).catch(() => setLocalTelegramUsername(''));
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

    return Math.max(age, 18);
  }, [localDob]);

  const handleSave = () => {
    if (!localDisplayName.trim()) {
      alert(t('profile.profilesettingsscreen.missing_name'), t('profile.profilesettingsscreen.nickname_first_name_is_required'));
      return;
    }

    const parsedInput = parsePhoneNumberAndCountry(localPhoneNumber);
    const effectiveCountryCode = parsedInput?.code || countryCode;
    const cleanPhoneDigits = (parsedInput?.number || localPhoneNumber).replace(/[^\d]/g, '').trim();
    const fullPhone = cleanPhoneDigits.length >= 7 ? `${effectiveCountryCode} ${cleanPhoneDigits}` : '';

    // Enforce at least one contact method (WhatsApp/Phone OR Telegram)
    const hasValidPhone = Boolean(cleanPhoneDigits && cleanPhoneDigits.length >= 7);
    const hasValidTelegram = Boolean(localTelegramUsername.trim().replace(/^@+/, ''));
    if (!hasValidPhone && !hasValidTelegram) {
      alert(
        'Contact Method Required',
        'Please provide either your WhatsApp number or your Telegram username so your matches can connect with you.'
      );
      return;
    }

    const persistLocalState = async () => {
      setDisplayName(localDisplayName.trim());
      setName(localDisplayName.trim());
      setProfileText(localDescription.trim());
      setDate(new Date(localDob));
      await AsyncStorage.setItem('userDob', localDob);
      const validPhotos = (images || []).filter(Boolean) as string[];
      await AsyncStorage.setItem('onboardingImages', JSON.stringify(images || []));
      if (validPhotos[0]) {
        await AsyncStorage.setItem('profileImage', validPhotos[0]);
        setProfileImage(validPhotos[0]);
        setProfileImageUrl(validPhotos[0]);
      }

      if (fullPhone) {
        setContextPhone(fullPhone);
        await AsyncStorage.setItem('phoneNumber', fullPhone);
        await AsyncStorage.setItem('userMobile', fullPhone);
        const currentUid = (await AsyncStorage.getItem('userId')) || String(profileQuery.data?.userId || profileQuery.data?.id || '');
        if (currentUid) {
          await AsyncStorage.setItem(`user_phone_${currentUid}`, fullPhone);
        }
      } else {
        setContextPhone('');
        await AsyncStorage.removeItem('phoneNumber');
        await AsyncStorage.removeItem('userMobile');
        const currentUid = (await AsyncStorage.getItem('userId')) || String(profileQuery.data?.userId || profileQuery.data?.id || '');
        if (currentUid) {
          await AsyncStorage.removeItem(`user_phone_${currentUid}`);
        }
      }
      const currentUid = (await AsyncStorage.getItem('userId')) || String(profileQuery.data?.userId || profileQuery.data?.id || '');
      if (localTelegramUsername.trim()) {
        const cleanTg = localTelegramUsername.trim().replace(/^@+/, '');
        if (currentUid) {
          await AsyncStorage.setItem(`user_telegram_${currentUid}`, cleanTg);
        }
      } else {
        if (currentUid) {
          await AsyncStorage.removeItem(`user_telegram_${currentUid}`);
        }
      }
      await AsyncStorage.multiRemove(['telegramUsername', '@telegram_username']).catch(() => {});
    };

    const handlePersist = async () => {
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

      const validPhotos = (images || []).filter(Boolean) as string[];

      updateProfile.mutate(
        {
          displayName: localDisplayName.trim(),
          bio: localDescription.trim(),
          dob: localDob,
          age: computedAge,
          telegramUsername: localTelegramUsername.trim() || undefined,
          mobile: fullPhone || undefined,
          phoneNumber: fullPhone || undefined,
          phone: fullPhone || undefined,
          mobileNumber: fullPhone || undefined,
        } as any,
        {
          onSuccess: async () => {
            await persistLocalState();
            await profileQuery.refetch();
            DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED');
            Toast.show({
              type: 'success',
              text1: t('search.location.saved', { defaultValue: 'Saved' }),
              text2: t('profile.profilesettingsscreen.profile_updated_successfully', { defaultValue: 'Profile updated successfully.' }),
              visibilityTime: 2500,
            });
            navigation.goBack();
          },
          onError: async (error: any) => {
            const currentSession = await getAuthSession();
            if (
              currentSession?.token &&
              (Number(error?.response?.status) === 400 ||
                Number(error?.response?.status) === 404 ||
                String(error?.response?.data?.message || error?.message || '')
                  .toLowerCase()
                  .includes('user not found'))
            ) {
              await persistLocalState();
              alert(
                t('profile.profilesettingsscreen.saved_locally'),
                t('profile.profilesettingsscreen.profile_changes_are_saved_in_the_app_and_will_sy'),
                [
                  {
                    text: t('profile.profilesettingsscreen.ok'),
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
              return;
            }

            alert(
              t('profile.profilesettingsscreen.update_failed'),
              getUserFriendlyMessage(error, t('profile.profilesettingsscreen.we_could_not_save_your_profile_please_try_again'))
            );
          },
          onSettled: () => setLoading(false),
        }
      );
    };

    void handlePersist();
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

        <ProfilePhotoGrid initialPhotos={profilePhotos} />

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

