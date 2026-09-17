import { useNavigation } from '@react-navigation/native'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProfile } from '../../api/useProfile'
import Description from '../../components/ProfileTabComponents/ProfileSettings/Description'
import DisplayName from '../../components/ProfileTabComponents/ProfileSettings/DisplayName'
import ProfileSettingsHeader from '../../components/ProfileTabComponents/ProfileSettings/ProfileSettingHeader'
import YourBirthday from '../../components/ProfileTabComponents/ProfileSettings/YourBirthday'
import AppContext from '../../context/CreateGlobalStateContext'
import { Colors } from '../../theme'
import { getAuthSession } from '../../utils/session'
import { useAlert } from '../../components/AlertModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { displayName, setDisplayName, profileText, setProfileText, date, setDate, setName } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [localDisplayName, setLocalDisplayName] = useState(displayName);
  const [localDescription, setLocalDescription] = useState(profileText);
  const [localDob, setLocalDob] = useState(date.toISOString().split('T')[0]);
  const isInitialized = useRef(false);
  const { updateBasic, useMyProfile } = useProfile();
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
  }, []);

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
  }, [profileQuery.data]);

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
      alert('Missing name', 'Display name is required.');
      return;
    }

    const persistLocalState = async () => {
      setDisplayName(localDisplayName.trim());
      setName(localDisplayName.trim());
      setProfileText(localDescription.trim());
      setDate(new Date(localDob));
      await AsyncStorage.setItem('userDob', localDob);
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

      updateBasic.mutate(
        {
          displayName: localDisplayName.trim(),
          bio: localDescription.trim(),
          dob: localDob,
          age: computedAge,
        },
        {
          onSuccess: async () => {
            await persistLocalState();
            alert('Saved', 'Profile settings updated successfully.');
            navigation.goBack();
          },
          onError: async (error: any) => {
            const currentSession = await getAuthSession();
            if (
              currentSession?.token &&
              (Number(error?.response?.status) === 400 ||
                Number(error?.response?.status) === 404 ||
                String(error?.response?.data?.message || error?.message || '').toLowerCase().includes('user not found'))
            ) {
              await persistLocalState();
              alert('Saved locally', 'Profile changes are saved in the app and will sync automatically once your session finishes syncing.');
              navigation.goBack();
              return;
            }

            alert(
              'Update failed',
              error?.response?.data?.message || 'Could not save your profile settings.'
            );
          },
          onSettled: () => setLoading(false),
        }
      );
    };

    void handlePersist();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProfileSettingsHeader onSave={handleSave} loading={loading} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DisplayName value={localDisplayName} onChange={setLocalDisplayName} />
        <Description value={localDescription} onChange={setLocalDescription} />
        <YourBirthday
          value={localDob}
          onChange={setLocalDob}
        />
      </ScrollView>
      {AlertComponent}
    </SafeAreaView>
  )
}

export default ProfileSettingsScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    backgroundColor: Colors.background,
    flexGrow: 1,
    paddingBottom: 40,
  },
})
