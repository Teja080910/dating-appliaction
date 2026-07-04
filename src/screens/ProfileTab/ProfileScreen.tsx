import { useContext, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AppContext from '../../context/CreateGlobalStateContext';
import {
  ScrollView, View, Text, StyleSheet, Alert, Linking, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import AuthImage from '../../components/AuthImage';
import Header from '../../components/ProfileTabComponents/Header';
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
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';
import { APIURL } from '../../environment/ApiConfig';
import { resolveImageUri, parseImageList } from '../../utils/imageUtils';

const ProfileScreen = () => {
  const {
    name, email, profileText, profileImage, images,
    height, setHeight, setTempHeight,
    selectedAppearance, selectedBodyType, selectedLanguages, englishSkillLevel,
    selectedEthinicity, selectedSmoking, selectedLookingFor,
    setName, setProfileText, setImages, setProfileImage, setDate,
    setSelectedAppearance, setSelectedBodyType, setSelectedSmoking, setEnglishSkillLevel,
    setSelectedEthinicity, setSelectedLanguages, setSelectedLookingFor,
  } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [ownMobile, setOwnMobile] = useState('');
  const [ownTelegram, setOwnTelegram] = useState('');
  const [ownEmail, setOwnEmail] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (!userIdStr) { setLoading(false); return; }

      let data: any = null;
      try {
        data = await profileApi.getMyProfile(userIdStr);
      } catch {
        const userCached = await AuthStorage.getUser();
        data = userCached || {};
      }

      if (data.displayName || data.name) setName(data.displayName || data.name || '');
      if (data.bio) setProfileText(data.bio);
      if (data.profileImageUrl) setProfileImage(resolveImageUri(data.profileImageUrl));
      if (data.height) { setHeight(data.height); setTempHeight(data.height); }
      if (data.appearance) setSelectedAppearance(data.appearance);
      if (data.bodyType) setSelectedBodyType(data.bodyType);
      if (data.language) setSelectedLanguages(data.language.split(',').map((s: string) => s.trim()).filter(Boolean));
      if (data.ethnicity) setSelectedEthinicity(data.ethnicity);
      if (data.smoke) setSelectedSmoking(data.smoke);
      if (data.englishLevel) {
        const levels = ['Bad', 'Medium', 'Good', 'Very Good'];
        const idx = levels.indexOf(data.englishLevel);
        if (idx >= 0) setEnglishSkillLevel(idx);
      }
      if (data.lookingFor) {
        setSelectedLookingFor(data.lookingFor.split(',').map((s: string) => s.trim()).filter(Boolean));
      }
      if (data.dob) {
        const parsed = new Date(data.dob);
        if (!isNaN(parsed.getTime())) setDate(parsed);
      }

      try {
        const allImages = await profileApi.getAllImages(userIdStr);
        const imageList = parseImageList(allImages);
        if (imageList.length > 0) {
          const urls = imageList.map((img: any) => resolveImageUri(img.imageUrl || img.url || img));
          setImages(urls);
        }
      } catch {}

      const userCached = await AuthStorage.getUser();
      setOwnMobile(userCached?.mobile || '');
      setOwnTelegram(userCached?.telegramUsername || '');
      setOwnEmail(data?.email || '');
    } catch (e: any) {
      console.warn('fetchProfile failed:', e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D9534F" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.summarySection}>
          <View style={styles.profileHeader}>
            {profileImage ? (
              <AuthImage uri={profileImage} style={styles.profilePic} />
            ) : (
              <View style={[styles.profilePic, styles.profilePicPlaceholder]}>
                <Text style={styles.profilePicPlaceholderText}>
                  {(name || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileNameSection}>
              <Text style={styles.userName}>{name || 'User'}</Text>
            </View>
          </View>

          {profileText ? <Text style={styles.userBio}>{profileText}</Text> : null}

          <View style={styles.detailsRow}>
            {height ? <Text style={styles.detailChip}>{height} cm</Text> : null}
            {selectedAppearance ? <Text style={styles.detailChip}>{selectedAppearance}</Text> : null}
            {selectedBodyType ? <Text style={styles.detailChip}>{selectedBodyType}</Text> : null}
            {selectedLanguages?.length > 0 ? <Text style={styles.detailChip}>{selectedLanguages.join(', ')}</Text> : null}
            {selectedEthinicity ? <Text style={styles.detailChip}>{selectedEthinicity}</Text> : null}
            {englishSkillLevel > 0 ? (
              <Text style={styles.detailChip}>
                {['Bad', 'Medium', 'Good', 'Very Good'][englishSkillLevel]}
              </Text>
            ) : null}
            {selectedSmoking ? <Text style={styles.detailChip}>Smoke: {selectedSmoking}</Text> : null}
            {selectedLookingFor?.length > 0 ? <Text style={styles.detailChip}>Looking for: {selectedLookingFor.join(', ')}</Text> : null}
          </View>

          {(ownMobile || ownTelegram || ownEmail) ? (
            <View style={styles.contactSection}>
              {ownMobile ? (
                <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${ownMobile}`)}>
                  <Text style={styles.contactIcon}>📞</Text>
                  <Text style={styles.contactText}>{ownMobile}</Text>
                </TouchableOpacity>
              ) : null}
              {ownTelegram ? (
                <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`https://t.me/${ownTelegram.replace('@', '')}`)}>
                  <Text style={styles.contactIcon}>✈️</Text>
                  <Text style={styles.contactText}>@{ownTelegram}</Text>
                </TouchableOpacity>
              ) : null}
              {ownEmail ? (
                <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${ownEmail}`)}>
                  <Text style={styles.contactIcon}>📧</Text>
                  <Text style={styles.contactText}>{ownEmail}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
        <AdditionalUploadSection />
        <ModalAddPhoto />
        <ProfileSetting />
        {/* <ViewMyProfile /> */}
        <ChangeLocation onPress={() => Linking.openSettings()} />
        <ConnectTelegram onPress={() => Linking.openURL('https://t.me/DatingAppBot')} />
        <ChatWithUs onPress={() => Linking.openURL('mailto:hi@dating.com')} />
        <Privacy onPress={() => Linking.openURL('https://example.com/privacy')} />
        <TermsAndConditions onPress={() => Linking.openURL('https://example.com/terms')} />
        <TermsOfUse onPress={() => Linking.openURL('https://example.com/eula')} />
        <Logout />
        <DeleteMyProfile />
        <AllRightsReserved />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  summarySection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
  },
  profilePicPlaceholder: {
    backgroundColor: '#d9534f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicPlaceholderText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileNameSection: { flex: 1 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  userBio: { fontSize: 14, color: '#555', marginBottom: 10, lineHeight: 20 },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  detailChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    color: '#333',
    overflow: 'hidden',
  },
  contactSection: {
    backgroundColor: '#f9f2f4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  contactIcon: { fontSize: 16, marginRight: 8 },
  contactText: { fontSize: 14, color: '#333' },
});

export default ProfileScreen;
