import { StyleSheet, View, ActivityIndicator } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import ProfileSettingsHeader from '../../components/ProfileTabComponents/ProfileSettings/ProfileSettingHeader'
import DisplayName from '../../components/ProfileTabComponents/ProfileSettings/DisplayName'
import Description from '../../components/ProfileTabComponents/ProfileSettings/Description'
import YourBirthday from '../../components/ProfileTabComponents/ProfileSettings/YourBirthday'
import { profileApi } from '../../api/profileApi'
import { AuthStorage } from '../../api/authStorage'
import AppContext from '../../context/CreateGlobalStateContext'

const ProfileSettingsScreen = () => {
  const { setName, setProfileText, setDate, setSelectedLookingFor } = useContext(AppContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userIdStr = await AuthStorage.getUserIdStr();
        if (!userIdStr) return;
        const userData = await profileApi.getMyUser(userIdStr);
        const data = userData?.profile || {};
        if (data.displayName) setName(data.displayName);
        if (data.name) setName(data.name);
        if (data.bio) setProfileText(data.bio);
        if (data.lookingFor) {
          setSelectedLookingFor(data.lookingFor.split(',').map((s: string) => s.trim()).filter(Boolean));
        }
        if (data.dob) {
          const parsed = new Date(data.dob);
          if (!isNaN(parsed.getTime())) setDate(parsed);
        }
      } catch {}
      setLoading(false);
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D9534F" />
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