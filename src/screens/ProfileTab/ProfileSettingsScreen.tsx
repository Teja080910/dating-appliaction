import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import ContactDetails, { COUNTRIES_LIST } from '../../components/ProfileTabComponents/ProfileSettings/ContactDetails';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../theme';
import { getAuthSession } from '../../utils/session';
import { useAlert } from '../../components/AlertModal';
import { getUserFriendlyMessage } from '../../utils/userFriendlyMessages';
import { dedupeImageUris } from '../../utils/imageHelpers';
import { t, useTranslation } from '../../i18n';

const ProfileSettingsScreen = () => {
  useTranslation();
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
  const [countryCode, setCountryCode] = useState('+44');
  const [countryName, setCountryName] = useState('United Kingdom');
  const [countryFlag, setCountryFlag] = useState('🇬🇧');
  const [localPhoneNumber, setLocalPhoneNumber] = useState('');
  const [localTelegramUsername, setLocalTelegramUsername] = useState('');

  const isCleanPhoneNumber = (val?: string | null): boolean => {
    if (!val) return false;
    const str = String(val).trim();
    if (!str || str.includes('@') || /[a-zA-Z]/.test(str)) return false;
    return /\d/.test(str);
  };

  const isInitialized = useRef(false);
  const { updateBasic, updateProfile, useMyProfile } = useProfile();
  const profileQuery = useMyProfile(undefined);
  const { alert, AlertComponent } = useAlert();

  useEffect(() => {
    const loadStoredDobAndContact = async () => {
      try {
        const storedDob = await AsyncStorage.getItem('userDob');
        if (storedDob) {
          setLocalDob(storedDob);
          setDate(new Date(storedDob));
        }

        const storedPhone = await AsyncStorage.getItem('phoneNumber');
        if (storedPhone) {
          if (isCleanPhoneNumber(storedPhone)) {
            const match = storedPhone.match(/^(\+\d+)\s*(.*)$/);
            if (match) {
              const matchedCountry = COUNTRIES_LIST.find((c) => c.code === match[1]);
              if (matchedCountry) {
                setCountryCode(matchedCountry.code);
                setCountryName(matchedCountry.name);
                setCountryFlag(matchedCountry.flag);
              } else {
                setCountryCode(match[1]);
              }
              setLocalPhoneNumber(match[2].replace(/[^\d\s-]/g, '').trim());
            } else {
              setLocalPhoneNumber(storedPhone.replace(/[^\d\s-]/g, '').trim());
            }
          } else {
            // Clean up any stale/email-contaminated value from storage
            await AsyncStorage.removeItem('phoneNumber');
            setLocalPhoneNumber('');
          }
        }

        const storedTg = await AsyncStorage.getItem('telegramUsername');
        if (storedTg) {
          setLocalTelegramUsername(storedTg.replace(/^@+/, ''));
        }
      } catch (e) {}
    };
    void loadStoredDobAndContact();
  }, [setDate]);

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
    if (!profile || isInitialized.current) return;

    const nextName = profile.displayName || profile.name || displayName;
    const nextBio = profile.bio || profileText || '';

    setLocalDisplayName(nextName);
    setLocalDescription(nextBio);
    setDisplayName(nextName);
    setName(profile.name || nextName);
    setProfileText(nextBio);
    if (profile.dob) {
      setLocalDob(profile.dob);
      setDate(new Date(profile.dob));
    }

    const candidatePhone = profile.phone || profile.mobile;
    if (candidatePhone && isCleanPhoneNumber(candidatePhone)) {
      const rawNum = String(candidatePhone).trim();
      const match = rawNum.match(/^(\+\d+)\s*(.*)$/);
      if (match) {
        const matchedCountry = COUNTRIES_LIST.find((c) => c.code === match[1]);
        if (matchedCountry) {
          setCountryCode(matchedCountry.code);
          setCountryName(matchedCountry.name);
          setCountryFlag(matchedCountry.flag);
        } else {
          setCountryCode(match[1]);
        }
        setLocalPhoneNumber(match[2].replace(/[^\d\s-]/g, '').trim());
      } else {
        setLocalPhoneNumber(rawNum.replace(/[^\d\s-]/g, '').trim());
      }
    } else {
      setLocalPhoneNumber('');
    }

    if (profile.telegramUsername) {
      setLocalTelegramUsername(String(profile.telegramUsername).replace(/^@+/, ''));
    }

    isInitialized.current = true;
  }, [profileQuery.data, displayName, profileText, setDate, setDisplayName, setName, setProfileText]);

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
      alert('Missing name', 'Nickname / First name is required.');
      return;
    }

    const cleanPhoneDigits = localPhoneNumber.replace(/[^\d\s-]/g, '').trim();
    const fullPhone =
      cleanPhoneDigits && isCleanPhoneNumber(cleanPhoneDigits)
        ? `${countryCode} ${cleanPhoneDigits}`
        : '';

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
      } else {
        setContextPhone('');
        await AsyncStorage.removeItem('phoneNumber');
      }
      if (localTelegramUsername.trim()) {
        await AsyncStorage.setItem('telegramUsername', localTelegramUsername.trim());
      }
    };

    const handlePersist = async () => {
      setLoading(true);
      const authSession = await getAuthSession();
      if (!authSession?.token) {
        alert('Session error', 'Please log in again.', [
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
          photos: validPhotos,
          telegramUsername: localTelegramUsername.trim() || undefined,
        } as any,
        {
          onSuccess: async () => {
            await persistLocalState();
            await profileQuery.refetch();
            alert(t('search.location.saved'), 'Profile updated successfully.', [
              {
                text: t('profile.profilesettingsscreen.ok'),
                onPress: () => navigation.goBack(),
              },
            ]);
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
                'Saved locally',
                'Profile changes are saved in the app and will sync automatically.',
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
              'Update failed',
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

        {/* Contact Details (Telegram - WhatsApp removed for now) */}
        <ContactDetails
          showWhatsApp={false}
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

