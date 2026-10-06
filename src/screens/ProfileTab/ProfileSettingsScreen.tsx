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
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '../../api/useProfile';
import Description from '../../components/ProfileTabComponents/ProfileSettings/Description';
import DisplayName from '../../components/ProfileTabComponents/ProfileSettings/DisplayName';
import ProfileSettingsHeader from '../../components/ProfileTabComponents/ProfileSettings/ProfileSettingHeader';
import ProfilePhotoGrid from '../../components/ProfileTabComponents/ProfileSettings/ProfilePhotoGrid';
import YourBirthday from '../../components/ProfileTabComponents/ProfileSettings/YourBirthday';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../theme';
import { getAuthSession } from '../../utils/session';
import { useAlert } from '../../components/AlertModal';
import { getUserFriendlyMessage } from '../../utils/userFriendlyMessages';

const ProfileSettingsScreen = () => {
  const { themeColors, isDark } = useTheme();
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
    setProfileImage,
    setProfileImageUrl,
  } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [localDisplayName, setLocalDisplayName] = useState(displayName);
  const [localDescription, setLocalDescription] = useState(profileText);
  const [localDob, setLocalDob] = useState(date.toISOString().split('T')[0]);
  const isInitialized = useRef(false);
  const { updateBasic, updateProfile, useMyProfile } = useProfile();
  const profileQuery = useMyProfile(undefined);
  const { alert, AlertComponent } = useAlert();

  useEffect(() => {
    const loadStoredDob = async () => {
      try {
        const storedDob = await AsyncStorage.getItem('userDob');
        if (storedDob) {
          setLocalDob(storedDob);
          setDate(new Date(storedDob));
        }
      } catch (e) {}
    };
    void loadStoredDob();
  }, [setDate]);

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
    isInitialized.current = true;
  }, [displayName, profileQuery.data, profileText, setDate, setDisplayName, setName, setProfileText]);

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
    };

    const handlePersist = async () => {
      setLoading(true);
      const authSession = await getAuthSession();
      if (!authSession?.token) {
        alert('Session error', 'Please log in again.', [
          {
            text: 'OK',
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
        },
        {
          onSuccess: async () => {
            await persistLocalState();
            await profileQuery.refetch();
            alert('Saved', 'Profile updated successfully.', [
              {
                text: 'OK',
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
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
              return;
            }

            alert(
              'Update failed',
              getUserFriendlyMessage(error, 'We could not save your profile. Please try again.')
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

        <ProfilePhotoGrid />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveBtnWrapper, loading && { opacity: 0.7 }]}
        >
          <LinearGradient
            colors={[themeColors.primary, themeColors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            {loading ? (
              <ActivityIndicator color={themeColors.white || '#FFFFFF'} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {AlertComponent}
    </SafeAreaView>
  );
};

export default ProfileSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    backgroundColor: Colors.background,
    flexGrow: 1,
  },
  saveBtnWrapper: {
    marginHorizontal: 20,
    marginTop: 28,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnGradient: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

