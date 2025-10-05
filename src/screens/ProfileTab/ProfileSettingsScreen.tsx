import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import ProfileSettingsHeader from '../../components/ProfileTabComponents/ProfileSettings/ProfileSettingHeader'
import DisplayName from '../../components/ProfileTabComponents/ProfileSettings/DisplayName'
import Description from '../../components/ProfileTabComponents/ProfileSettings/Description'
import YourBirthday from '../../components/ProfileTabComponents/ProfileSettings/YourBirthday'

const ProfileSettingsScreen = () => {
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