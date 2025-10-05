import { useContext, useEffect } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { englishLevels } from '../../utils/types/englishLevels'; 
import Header from '../../components/ProfileTabComponents/Header';
import UploadImage from '../../components/UploadImageComponents/UploadImage';
import AdditionalUploadSection from '../../components/ProfileTabComponents/AdditionalUploadSection';
import ModalAddPhoto from '../../components/UploadImageComponents/ModalAddPhoto';
import ProfileSetting from '../../components/ProfileTabComponents/ProfileSettings/ProfileSetting';
import ViewMyProfile from '../../components/ProfileTabComponents/ViewMyProfile/ViewMyProfile';
import ChangeLocation from '../../components/ProfileTabComponents/ChangeLocation.tsx/ChangeLocation';
import ConnectTelegram from '../../components/ProfileTabComponents/ConnectTelegram/ConnectTelegram';
import ChatWithUs from '../../components/ProfileTabComponents/ChatWithUs/ChatWithUs';
import Privacy from '../../components/ProfileTabComponents/Privacy/Privacy';
import TermsAndConditions from '../../components/ProfileTabComponents/TermsAndConditions/TermsAndConditions';
import TermsOfUse from '../../components/ProfileTabComponents/TermsOfUse/TermsOfUse';
import Logout from '../../components/ProfileTabComponents/Logout/Logout';
import DeleteMyProfile from '../../components/ProfileTabComponents/DeleteMyProfile/DeleteMyProfile';
import AllRightsReserved from '../../components/ProfileTabComponents/AllRightsReserved';

const ProfileScreen = () => {
  // const { profilePreferences, englishSkillLevel, images, setImages, openImageOptions } = useContext(AppContext);

  // useEffect(() => {
  //   // Keep only profile image and reset the rest
  //   if (images[0]) {
  //     setImages([images[0], '', '', '', '', '']);
  //   } else {
  //     setImages(['', '', '', '', '', '']);
  //   }
  // }, [])

  return (
    <View style={{ flex: 1 }}>
      <Header/>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}> {/* Increased paddingBottom */}
        <AdditionalUploadSection />
        <ModalAddPhoto />
        <ProfileSetting />
        <ViewMyProfile />
        <ChangeLocation />
        <ConnectTelegram />
        <ChatWithUs />
        <Privacy /> 
        <TermsAndConditions />
        <TermsOfUse />
        <Logout />
        <DeleteMyProfile />
        <AllRightsReserved />
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;









{/* <Text>Appearance: {profilePreferences.appearance}</Text>
      <Text>Body Type: {profilePreferences.bodyType}</Text>
      <Text>Smoking: {profilePreferences.smoking}</Text>
      <Text>English Skill: {englishLevels[englishSkillLevel]}</Text>
      <Text>ethinicity: {profilePreferences.ethnicity}</Text>
      <Text>height: {profilePreferences.height}</Text>
      <Text>kidCount: {profilePreferences.kidCount}</Text>
      <Text>languages: {profilePreferences.languages}</Text>
      <Text>lookingFor: {profilePreferences.lookingFor}</Text> */}