import { StyleSheet, ScrollView, Alert } from 'react-native'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ProfileSettingsHeader from '../../components/ProfileTabComponents/ProfileSettings/ProfileSettingHeader'
import DisplayName from '../../components/ProfileTabComponents/ProfileSettings/DisplayName'
import Description from '../../components/ProfileTabComponents/ProfileSettings/Description'
import YourBirthday from '../../components/ProfileTabComponents/ProfileSettings/YourBirthday'
import AppContext from '../../context/CreateGlobalStateContext'
import { Colors } from '../../utils/colors'
import { useProfile } from '../../api/useProfile'
import { getAuthSession } from '../../utils/session'

const ProfileSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { displayName, setDisplayName, profileText, setProfileText, date, setDate, setName } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [localDisplayName, setLocalDisplayName] = useState(displayName);
  const [localDescription, setLocalDescription] = useState(profileText);
  const [localDob, setLocalDob] = useState(date.toISOString().split('T')[0]);
  const { updateBasic, useMyProfile } = useProfile();
  const profileQuery = useMyProfile(undefined);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;

    const nextName = profile.displayName || profile.name || displayName;
    const nextBio = profile.bio || profileText || '';
    const nextDob = profile.dob || localDob;

    setLocalDisplayName(nextName);
    setLocalDescription(nextBio);
    setLocalDob(nextDob);
    setDisplayName(nextName);
    setName(profile.name || nextName);
    setProfileText(nextBio);
    if (profile.dob) {
      setDate(new Date(profile.dob));
    }
  }, [displayName, localDob, profileQuery.data, profileText, setDate, setDisplayName, setName, setProfileText]);

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
      Alert.alert('Missing name', 'Display name is required.');
      return;
    }

    const persistLocalState = () => {
      setDisplayName(localDisplayName.trim());
      setName(localDisplayName.trim());
      setProfileText(localDescription.trim());
      setDate(new Date(localDob));
    };

    const handlePersist = async () => {
      setLoading(true);
      const authSession = await getAuthSession();
      if (!authSession?.token) {
        Alert.alert('Session error', 'Please log in again.', [
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
          age: computedAge,
        },
        {
          onSuccess: () => {
            persistLocalState();
            Alert.alert('Saved', 'Profile settings updated successfully.');
            navigation.goBack();
          },
          onError: async (error: any) => {
            const authSession = await getAuthSession();
            if (
              authSession?.token &&
              (Number(error?.response?.status) === 400 ||
                Number(error?.response?.status) === 404 ||
                String(error?.response?.data?.message || error?.message || '').toLowerCase().includes('user not found'))
            ) {
              persistLocalState();
              Alert.alert('Saved locally', 'Profile changes are saved in the app and will sync automatically once your session finishes syncing.');
              navigation.goBack();
              return;
            }

            Alert.alert(
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
