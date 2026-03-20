import { StyleSheet, ScrollView, View } from 'react-native'
import React from 'react'
import ProfileSettingsHeader from '../../components/ProfileTabComponents/ProfileSettings/ProfileSettingHeader'
import DisplayName from '../../components/ProfileTabComponents/ProfileSettings/DisplayName'
import Description from '../../components/ProfileTabComponents/ProfileSettings/Description'
import YourBirthday from '../../components/ProfileTabComponents/ProfileSettings/YourBirthday'

const ProfileSettingsScreen = () => {
  return (
    <View style={styles.container}>
      <ProfileSettingsHeader />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DisplayName />
        <Description />
        <YourBirthday />
      </ScrollView>
    </View>
  )
}

export default ProfileSettingsScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
})