import { StyleSheet, View, ActivityIndicator } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import ProfileSettingsHeader from '../../components/ProfileTabComponents/ProfileSettings/ProfileSettingHeader'
import DisplayName from '../../components/ProfileTabComponents/ProfileSettings/DisplayName'
import Description from '../../components/ProfileTabComponents/ProfileSettings/Description'
import YourBirthday from '../../components/ProfileTabComponents/ProfileSettings/YourBirthday'
import { profileApi } from '../../api/profileApi'
import { AuthStorage } from '../../api/authStorage'
import AppContext from '../../context/CreateGlobalStateContext'
import { colors } from '../../constants/theme'

const ProfileSettingsScreen = () => {
  const { setName, setProfileText } = useContext(AppContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // /profile/me (not /users/{userId}, which doesn't exist on this backend)
    // returns a flat ProfileResponse with name/bio only — lookingFor/date
    // are carried via shared context, not re-fetched here.
    const fetchSettings = async () => {
      try {
        const userData = await AuthStorage.getUser();
        const uid = userData?.userId;
        if (!uid) return;
        const data = await profileApi.getMyProfile(uid);
        if (data.displayName) setName(data.displayName);
        else if (data.name) setName(data.name);
        if (data.bio) setProfileText(data.bio);
      } catch {}
      setLoading(false);
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View>
      <ProfileSettingsHeader />
      <DisplayName />
      <Description />
      <YourBirthday />
    </View>
  )
}

export default ProfileSettingsScreen

const styles = StyleSheet.create({})