import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAbsoluteUrl } from '../../api/apiClient';
import { useProfile, extractSessionIdFromResponse } from '../../api/useProfile';
import Description from '../../components/ProfileTabComponents/ProfileSettings/Description';
import DisplayName from '../../components/ProfileTabComponents/ProfileSettings/DisplayName';
import ProfileSettingsHeader from '../../components/ProfileTabComponents/ProfileSettings/ProfileSettingHeader';
import ProfilePhotoGrid from '../../components/ProfileTabComponents/ProfileSettings/ProfilePhotoGrid';
import YourBirthday from '../../components/ProfileTabComponents/ProfileSettings/YourBirthday';
import ContactDetails, { getDefaultCountryForLanguage, parsePhoneNumberAndCountry } from '../../components/ProfileTabComponents/ProfileSettings/ContactDetails';
import PhoneOtpModal from '../../components/ProfileTabComponents/ProfileSettings/PhoneOtpModal';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme } from '../../theme';
import { getAuthSession } from '../../utils/session';
import { useAlert } from '../../components/AlertModal';
import { getUserFriendlyMessage } from '../../utils/userFriendlyMessages';
import { dedupeImageUris, isDeletedPhotoUri } from '../../utils/imageHelpers';
import { parseDobToLocalDate, formatDateToDobString, calculateAgeFromDob } from '../../utils/dateUtils';
import { t, useTranslation } from '../../i18n';

const ProfileSettingsScreen = () => {
  const { language } = useTranslation();
  const defaultCountry = getDefaultCountryForLanguage(language);
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

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
  const [localDob, setLocalDob] = useState(() => formatDateToDobString(date));
  const lastSavedDobRef = useRef<string | null>(null);
  const hasUserEditedPhoneRef = useRef(false);
  const userExplicitlyRemovedPhoneRef = useRef(false);
  const lastSavedPhoneRef = useRef<string | null>(null);
  // Track fields the user is actively editing so background profile refreshes
  // (15s polling, photo upload events, focus refetch) never wipe their input.
  const hasUserEditedNameRef = useRef(false);
  const hasUserEditedDescriptionRef = useRef(false);
  const hasUserEditedDobRef = useRef(false);

  // Contact details state (defaults to primary app language country)
  const [countryCode, setCountryCode] = useState(defaultCountry.code);
  const [countryName, setCountryName] = useState(defaultCountry.name);
  const [countryFlag, setCountryFlag] = useState(defaultCountry.flag);
  const [localPhoneNumber, setLocalPhoneNumber] = useState('');
  const [localTelegramUsername, setLocalTelegramUsername] = useState('');
  const [storedUserId, setStoredUserId] = useState('');

  const isCleanPhoneNumber = (val?: string | null): boolean => {
    if (!val) return false;
    const str = String(val).trim();
    if (!str || str.includes('@') || /[a-zA-Z]/.test(str)) return false;
    return /\d/.test(str);
  };

  const { updateProfile, useMyProfile, sendWhatsappOtp, verifyWhatsappOtp } = useProfile();
  const profileQuery = useMyProfile(undefined);
  const { alert, AlertComponent } = useAlert();

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
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

        const storedBio = await AsyncStorage.getItem('bio');
        if (storedBio !== null) {
          if (!hasUserEditedDescriptionRef.current) {
            setLocalDescription(storedBio);
          }
          setProfileText(storedBio);
        } else {
          const onboardingBio = await AsyncStorage.getItem('@onboarding_bio');
          if (onboardingBio) {
            if (!hasUserEditedDescriptionRef.current) {
              setLocalDescription(onboardingBio);
            }
            setProfileText(onboardingBio);
          }
        }

        const uid = (await AsyncStorage.getItem('userId')) || '';
        if (uid) setStoredUserId(uid);
        const userScopedDob = uid ? await AsyncStorage.getItem(`user_dob_${uid}`) : null;
        const storedDob = userScopedDob || (await AsyncStorage.getItem('userDob'));
        if (storedDob && !hasUserEditedDobRef.current) {
          const cleanDob = formatDateToDobString(storedDob);
          setLocalDob(cleanDob);
          setDate(parseDobToLocalDate(cleanDob));
        }

        const [phoneRemovedUid, phoneRemovedGlobal] = await Promise.all([
          uid ? AsyncStorage.getItem(`@amara_phone_removed_${uid}`).catch(() => null) : null,
          AsyncStorage.getItem('@amara_phone_removed_global').catch(() => null),
        ]);
        if (phoneRemovedUid === 'true' || phoneRemovedGlobal === 'true' || userExplicitlyRemovedPhoneRef.current) {
          setLocalPhoneNumber('');
        } else if (!hasUserEditedPhoneRef.current) {
          const userScopedPhone = uid ? await AsyncStorage.getItem(`user_phone_${uid}`) : null;
          const storedPhone = userScopedPhone || (await AsyncStorage.getItem('phoneNumber'));
          if (storedPhone && isCleanPhoneNumber(storedPhone)) {
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
            await AsyncStorage.multiRemove(['phoneNumber', 'userMobile']).catch(() => {});
            setLocalPhoneNumber('');
          }
        }

        const [isDisc, isDiscGlobal] = await Promise.all([
          uid ? AsyncStorage.getItem(`@amara_telegram_disconnected_${uid}`).catch(() => null) : null,
          AsyncStorage.getItem('@amara_telegram_disconnected_global').catch(() => null),
        ]);
        if (isDisc === 'true' || isDiscGlobal === 'true') {
          setLocalTelegramUsername('');
        } else {
          const [uTg, atTg] = await Promise.all([
            uid ? AsyncStorage.getItem(`user_telegram_${uid}`).catch(() => null) : null,
            uid ? AsyncStorage.getItem(`@telegram_username_${uid}`).catch(() => null) : null,
          ]);
          const candTg = [uTg, atTg].find((val) => {
            if (!val) return false;
            const c = String(val).trim().replace(/^@+/, '');
            const n = c.toUpperCase();
            return c && n !== 'NONE' && n !== 'NULL' && n !== 'UNDEFINED' && n !== '-' && n !== 'N/A';
          });
          if (candTg) {
            setLocalTelegramUsername(String(candTg).trim().replace(/^@+/, ''));
          }
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
      if (!hasUserEditedNameRef.current) {
        setLocalDisplayName(nextName);
      }
      setDisplayName(nextName);
      setName(nextName);
    }

    if (profile.bio !== undefined && profile.bio !== null) {
      if (!hasUserEditedDescriptionRef.current) {
        setLocalDescription(profile.bio);
      }
      setProfileText(profile.bio);
    }

    if (profile.dob) {
      const cleanDob = formatDateToDobString(profile.dob);
      if (hasUserEditedDobRef.current) {
        // User has picked a new birthday in this session; keep it.
      } else if (lastSavedDobRef.current && lastSavedDobRef.current !== cleanDob) {
        // Retain the user's freshly saved birthday instead of reverting to stale server response
      } else {
        setLocalDob(cleanDob);
        setDate(parseDobToLocalDate(cleanDob));
      }
    }

    if (hasUserEditedPhoneRef.current || userExplicitlyRemovedPhoneRef.current) {
      // User is actively editing or cleared phone; do not overwrite from query response
    } else {
      AsyncStorage.getItem('userId').then(async (uid) => {
        const [phoneRemovedUid, phoneRemovedGlobal] = await Promise.all([
          uid ? AsyncStorage.getItem(`@amara_phone_removed_${uid}`).catch(() => null) : null,
          AsyncStorage.getItem('@amara_phone_removed_global').catch(() => null),
        ]);
        if (phoneRemovedUid === 'true' || phoneRemovedGlobal === 'true' || userExplicitlyRemovedPhoneRef.current) {
          setLocalPhoneNumber('');
          return;
        }
        if (hasUserEditedPhoneRef.current) return;

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
      }).catch(() => {});
    }

    AsyncStorage.getItem('userId').then(async (uid) => {
      const rawTg = (profile.telegramUsername || (profile as any).telegram || (profile as any).tgUsername)
        ? String(profile.telegramUsername || (profile as any).telegram || (profile as any).tgUsername).replace(/^@+/, '').trim()
        : '';
      const normTg = rawTg.toUpperCase();
      const isValidTg = rawTg && normTg !== 'NONE' && normTg !== 'NULL' && normTg !== 'UNDEFINED' && normTg !== '-' && normTg !== 'N/A';
      if (isValidTg) {
        setLocalTelegramUsername(rawTg);
        await AsyncStorage.removeItem('@amara_telegram_disconnected_global').catch(() => {});
        if (uid) {
          await AsyncStorage.removeItem(`@amara_telegram_disconnected_${uid}`).catch(() => {});
        }
        return;
      }

      const [isDisc, isDiscGlobal] = await Promise.all([
        uid ? AsyncStorage.getItem(`@amara_telegram_disconnected_${uid}`).catch(() => null) : null,
        AsyncStorage.getItem('@amara_telegram_disconnected_global').catch(() => null),
      ]);
      if (isDisc === 'true' || isDiscGlobal === 'true') {
        setLocalTelegramUsername('');
        return;
      }
      const [uTg, atTg] = await Promise.all([
        uid ? AsyncStorage.getItem(`user_telegram_${uid}`).catch(() => null) : null,
        uid ? AsyncStorage.getItem(`@telegram_username_${uid}`).catch(() => null) : null,
      ]);
      const cand = [uTg, atTg].find((val) => {
        if (!val) return false;
        const c = String(val).trim().replace(/^@+/, '');
        const n = c.toUpperCase();
        return c && n !== 'NONE' && n !== 'NULL' && n !== 'UNDEFINED' && n !== '-' && n !== 'N/A';
      });
      if (cand) {
        setLocalTelegramUsername(String(cand).trim().replace(/^@+/, ''));
      }
    }).catch(() => {});
  }, [profileQuery.data, setDate, setDisplayName, setName, setProfileText]);

  const computedAge = useMemo(() => {
    return calculateAgeFromDob(localDob);
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

    // Never fall back to profileQuery.data.id here: that is the numeric DB id,
    // and the backend only accepts the alphanumeric user code (e.g. SA1000).
    const currentUid = (await AsyncStorage.getItem('userId')) || String(profileQuery.data?.userId || '');
    const cleanCurrentUid = currentUid ? String(currentUid).trim() : '';
    const currentUidDigits = cleanCurrentUid.replace(/\D/g, '');

    const userPhotosRaw = cleanCurrentUid
      ? (await AsyncStorage.getItem(`user_photos_${cleanCurrentUid}`).catch(() => null)) ||
        (currentUidDigits ? await AsyncStorage.getItem(`user_photos_${currentUidDigits}`).catch(() => null) : null)
      : null;
    let currentPhotos: string[] | undefined = undefined;
    if (userPhotosRaw) {
      try {
        const parsed = JSON.parse(userPhotosRaw);
        if (Array.isArray(parsed)) {
          currentPhotos = parsed.filter((u: any) => typeof u === 'string' && u.trim().length > 0);
        }
      } catch {}
    }

    const deletedRaw = cleanCurrentUid
      ? (await AsyncStorage.getItem(`deleted_photos_${cleanCurrentUid}`).catch(() => null)) ||
        (await AsyncStorage.getItem('deleted_image_uris').catch(() => null))
      : null;
    const deletedList: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];

    const liveContextPhotos = (images || []).filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
    const sourcePhotos = liveContextPhotos.length > 0
      ? liveContextPhotos
      : (currentPhotos !== undefined
        ? currentPhotos
        : (images || []).filter((u): u is string => typeof u === 'string' && u.trim().length > 0));

    const photosToSend = sourcePhotos.filter((u) => !isDeletedPhotoUri(u, deletedList, getAbsoluteUrl));

    const persistLocalState = async (savePhone = true, photos = photosToSend) => {
      const cleanDob = formatDateToDobString(localDob);
      setDisplayName(cleanName);
      setName(cleanName);
      setProfileText(cleanBio);
      setDate(parseDobToLocalDate(cleanDob));

      await AsyncStorage.setItem('displayName', cleanName);
      await AsyncStorage.setItem('name', cleanName);
      await AsyncStorage.setItem('userName', cleanName);
      await AsyncStorage.setItem('bio', cleanBio);
      await AsyncStorage.setItem('userBio', cleanBio);
      await AsyncStorage.setItem('@onboarding_bio', cleanBio);
      await AsyncStorage.setItem('userDob', cleanDob);
      if (currentUid) {
        await AsyncStorage.setItem(`user_name_${currentUid}`, cleanName);
        await AsyncStorage.setItem(`user_dob_${currentUid}`, cleanDob);
      }

      await AsyncStorage.setItem('onboardingImages', JSON.stringify(photos));
      if (currentUid) {
        const cleanUid = String(currentUid).trim();
        const digits = cleanUid.replace(/\D/g, '');
        await AsyncStorage.setItem(`user_photos_${cleanUid}`, JSON.stringify(photos));
        if (digits && digits !== cleanUid) {
          await AsyncStorage.setItem(`user_photos_${digits}`, JSON.stringify(photos));
        }
      }
      if (photos[0]) {
        await AsyncStorage.setItem('profileImage', photos[0]);
        if (currentUid) {
          await AsyncStorage.setItem(`user_profile_photo_${currentUid}`, photos[0]);
        }
        setProfileImage(photos[0]);
        setProfileImageUrl(photos[0]);
      } else {
        await AsyncStorage.removeItem('profileImage');
        if (currentUid) {
          await AsyncStorage.removeItem(`user_profile_photo_${currentUid}`);
        }
        setProfileImage(null);
        setProfileImageUrl(null);
      }
      setImages(photos);

      if (savePhone && fullPhone) {
        setContextPhone(fullPhone);
        await AsyncStorage.setItem('phoneNumber', fullPhone);
        await AsyncStorage.setItem('userMobile', fullPhone);
        if (currentUid) {
          await AsyncStorage.setItem(`user_phone_${currentUid}`, fullPhone);
          await AsyncStorage.removeItem(`@amara_phone_removed_${currentUid}`).catch(() => {});
        }
        await AsyncStorage.removeItem('@amara_phone_removed_global').catch(() => {});
      } else if (!savePhone) {
        // preserve existing phone without overwriting with conflicting value
      } else {
        setContextPhone('');
        await AsyncStorage.multiRemove(['phoneNumber', 'userMobile']).catch(() => {});
        if (currentUid) {
          await AsyncStorage.removeItem(`user_phone_${currentUid}`).catch(() => {});
          await AsyncStorage.setItem(`@amara_phone_removed_${currentUid}`, 'true').catch(() => {});
        }
        await AsyncStorage.setItem('@amara_phone_removed_global', 'true').catch(() => {});
      }
      if (localTelegramUsername.trim()) {
        const cleanTg = localTelegramUsername.trim().replace(/^@+/, '');
        await AsyncStorage.multiRemove(['telegramUsername', '@telegram_username']).catch(() => {});
        if (currentUid) {
          await AsyncStorage.setItem(`user_telegram_${currentUid}`, cleanTg);
          await AsyncStorage.setItem(`@telegram_username_${currentUid}`, cleanTg);
          await AsyncStorage.removeItem(`@amara_telegram_disconnected_${currentUid}`).catch(() => {});
        }
        await AsyncStorage.removeItem('@amara_telegram_disconnected_global').catch(() => {});
      } else {
        await AsyncStorage.multiRemove(['telegramUsername', '@telegram_username']).catch(() => {});
        if (currentUid) {
          await AsyncStorage.multiRemove([
            `user_telegram_${currentUid}`,
            `@telegram_username_${currentUid}`,
          ]).catch(() => {});
          await AsyncStorage.setItem(`@amara_telegram_disconnected_${currentUid}`, 'true').catch(() => {});
        }
        await AsyncStorage.setItem('@amara_telegram_disconnected_global', 'true').catch(() => {});
      }
    };

    const cleanDobToSave = formatDateToDobString(localDob);
    lastSavedDobRef.current = cleanDobToSave;
    lastSavedPhoneRef.current = fullPhone;
    if (!fullPhone) {
      userExplicitlyRemovedPhoneRef.current = true;
    }
    await persistLocalState(true, photosToSend);

    const tgToPersist = localTelegramUsername.trim()
      ? localTelegramUsername.trim().replace(/^@+/, '')
      : 'NONE';

    updateProfile.mutate(
      {
        userId: currentUid,
        displayName: cleanName,
        name: cleanName,
        bio: cleanBio,
        dob: cleanDobToSave,
        age: ageToSave,
        telegramUsername: tgToPersist,
        mobile: fullPhone || '',
        phoneNumber: fullPhone || '',
        phone: fullPhone || '',
        photos: photosToSend,
        images: photosToSend,
        profileImageUrl: photosToSend[0] || '',
        photo: photosToSend[0] || '',
      } as any,
      {
        onSuccess: async () => {
          await persistLocalState(true, photosToSend);
          await profileQuery.refetch();
          queryClient.invalidateQueries({ queryKey: ['myProfile'] });
          queryClient.invalidateQueries({ queryKey: ['profile-me'] });
          queryClient.invalidateQueries({ queryKey: ['my-telegram-status'] });
          queryClient.invalidateQueries({ queryKey: ['connections'] });
          queryClient.invalidateQueries({ queryKey: ['connections-sent'] });
          queryClient.invalidateQueries({ queryKey: ['connections-received'] });
          queryClient.invalidateQueries({ queryKey: ['userImages'] });
          queryClient.invalidateQueries({ queryKey: ['discovery-filter'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
          queryClient.invalidateQueries({ queryKey: ['users'] });
          setContextPhone(fullPhone || '');
          setImages(photosToSend);
          setProfileImage(photosToSend[0] || null);
          setProfileImageUrl(photosToSend[0] || null);

          DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED', {
            uid: currentUid,
            phoneNumber: fullPhone || '',
            telegramUsername: tgToPersist === 'NONE' ? '' : tgToPersist,
            bio: cleanBio,
            displayName: cleanName,
            name: cleanName,
            photos: photosToSend,
            images: photosToSend,
            photo: photosToSend[0] || '',
            profileImageUrl: photosToSend[0] || '',
          });
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
                dob: formatDateToDobString(localDob),
                age: ageToSave,
                telegramUsername: tgToPersist,
                photos: photosToSend,
                images: photosToSend,
                profileImageUrl: photosToSend[0] || '',
                photo: photosToSend[0] || '',
              } as any);
              await persistLocalState(false, photosToSend);
              await profileQuery.refetch();
              DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED', {
                uid: currentUid,
                phoneNumber: '',
                telegramUsername: tgToPersist === 'NONE' ? '' : tgToPersist,
                bio: cleanBio,
                displayName: cleanName,
                name: cleanName,
                photos: photosToSend,
                images: photosToSend,
                photo: photosToSend[0] || '',
                profileImageUrl: photosToSend[0] || '',
              });
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

          // Keep the user's edits on the device so nothing is lost, but make the
          // failed server sync explicit instead of silently going back.
          const userPhotosRaw = currentUid ? await AsyncStorage.getItem(`user_photos_${currentUid}`).catch(() => null) : null;
          let currentPhotos: string[] | undefined = undefined;
          if (userPhotosRaw) {
            try {
              const parsed = JSON.parse(userPhotosRaw);
              if (Array.isArray(parsed) && parsed.some(Boolean)) {
                currentPhotos = parsed;
              }
            } catch {}
          }
          await persistLocalState();
          DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED', {
            uid: currentUid,
            ...(currentPhotos ? { photos: currentPhotos, photo: currentPhotos[0] || '' } : {}),
          });
          alert(
            t('profile.profilesettingsscreen.save_failed_title', {
              defaultValue: "Couldn't Save Changes",
            }),
            getUserFriendlyMessage(
              error,
              t('profile.profilesettingsscreen.save_failed_desc', {
                defaultValue:
                  'We could not sync your changes to the server. Your edits are kept on this device — please check your connection and try again.',
              })
            ),
            [
              {
                text: t('profile.profilesettingsscreen.go_back', { defaultValue: 'Go Back' }),
                style: 'cancel',
                onPress: () => navigation.goBack(),
              },
              {
                text: t('profile.profilesettingsscreen.try_again', { defaultValue: 'Try Again' }),
                onPress: () => {
                  void executePersist(cleanName, cleanBio, fullPhone, ageToSave);
                },
              },
            ]
          );
        },
        onSettled: () => setLoading(false),
      }
    );
  };

  const extractOtpSessionId = (data: any): string =>
    extractSessionIdFromResponse(data) ||
    data?.sessionId ||
    data?.data?.sessionId ||
    data?.session_id ||
    data?.data?.session_id ||
    data?.otpSessionId ||
    data?.data?.otpSessionId ||
    data?.id ||
    data?.data?.id ||
    '';

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
        pendingSaveDataRef.current = null;
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
      const sessId = extractOtpSessionId(data);
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

  /**
   * Sends a WhatsApp verification code for a newly entered / changed number
   * and opens the OTP modal. The profile is only persisted after verification
   * succeeds (see handleVerifyOtp -> executePersist).
   */
  const requestPhoneVerification = async (phone: string) => {
    setOtpError(null);
    setPendingPhone(phone);
    setPendingSessionId('');
    setSendingOtp(true);
    try {
      const data = await sendWhatsappOtp.mutateAsync({ mobile: phone });
      const sessId = extractOtpSessionId(data);
      if (sessId) setPendingSessionId(sessId);
      setOtpModalVisible(true);
    } catch (err: any) {
      const rawMsg = String(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        ''
      );
      alert(
        t('profile.phone_otp.send_failed_title', { defaultValue: "Couldn't Send Code" }),
        rawMsg ||
          t('profile.phone_otp.send_failed_desc', {
            defaultValue: 'Could not send verification code to this WhatsApp number. Please check the number and try again.',
          })
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSave = async () => {
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

    // A newly entered / changed WhatsApp number has to be verified before the
    // profile is saved. Numbers that were already verified (inline flow) or are
    // unchanged save directly.
    if (fullPhone && isPhoneChanged && !isPhoneVerified) {
      await requestPhoneVerification(fullPhone);
      return;
    }

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
        <DisplayName
          value={localDisplayName}
          onChange={(val: string) => {
            hasUserEditedNameRef.current = true;
            setLocalDisplayName(val);
          }}
        />

        <YourBirthday
          value={localDob}
          onChange={(val: string) => {
            hasUserEditedDobRef.current = true;
            setLocalDob(val);
          }}
        />

        <Description
          value={localDescription}
          onChange={(val: string) => {
            hasUserEditedDescriptionRef.current = true;
            setLocalDescription(val);
          }}
        />

        <ProfilePhotoGrid
          initialPhotos={profilePhotos}
          userId={String(profileQuery.data?.userId || storedUserId || '') || undefined}
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
          setPhoneNumber={(val: string) => {
            hasUserEditedPhoneRef.current = true;
            const trimmed = (val || '').trim();
            if (!trimmed) {
              userExplicitlyRemovedPhoneRef.current = true;
              lastSavedPhoneRef.current = '';
              AsyncStorage.getItem('userId').then(async (uid) => {
                await AsyncStorage.multiRemove(['phoneNumber', 'userMobile']).catch(() => {});
                if (uid) {
                  await AsyncStorage.removeItem(`user_phone_${uid}`).catch(() => {});
                  await AsyncStorage.setItem(`@amara_phone_removed_${uid}`, 'true').catch(() => {});
                }
                await AsyncStorage.setItem('@amara_phone_removed_global', 'true').catch(() => {});
              }).catch(() => {});
            } else {
              userExplicitlyRemovedPhoneRef.current = false;
            }
            setLocalPhoneNumber(val);
          }}
          telegramUsername={localTelegramUsername}
          setTelegramUsername={setLocalTelegramUsername}
          isVerified={isPhoneVerified}
          setIsVerified={setIsPhoneVerified}
        />

        {/* Screenshot 1: Save Pill Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={loading || sendingOtp}
          style={[styles.saveBtn, (loading || sendingOtp) && { opacity: 0.7 }]}
        >
          {loading || sendingOtp ? (
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

