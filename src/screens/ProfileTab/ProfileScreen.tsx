import { useContext, useCallback, useEffect, useState } from 'react';
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
import ChangeLocation from '../../components/ProfileTabComponents/ChangeLocation.tsx/ChangeLocation';
import ConnectTelegram from '../../components/ProfileTabComponents/ConnectTelegram/ConnectTelegram';
import ChatWithUs from '../../components/ProfileTabComponents/ChatWithUs/ChatWithUs';
import Privacy from '../../components/ProfileTabComponents/Privacy/Privacy';
import TermsAndConditions from '../../components/ProfileTabComponents/TermsAndConditions/TermsAndConditions';
import TermsOfUse from '../../components/ProfileTabComponents/TermsOfUse/TermsOfUse';
import Logout from '../../components/ProfileTabComponents/Logout/Logout';
import ChangePassword from '../../components/ProfileTabComponents/ChangePassword/ChangePassword';
import DeleteMyProfile from '../../components/ProfileTabComponents/DeleteMyProfile/DeleteMyProfile';
import AllRightsReserved from '../../components/ProfileTabComponents/AllRightsReserved';
import { profileApi } from '../../api/profileApi';
import { onlineStatusApi } from '../../api/onlineStatusApi';
import { AuthStorage } from '../../api/authStorage';
import { resolveImageUri, parseImageList } from '../../utils/imageUtils';

const ProfileScreen = () => {
  const {
    name, profileText, profileImage, images,
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

  useEffect(() => {
    let cancelled = false;
    const setOnline = async () => {
      const uid = await AuthStorage.getUserIdStr();
      if (uid && !cancelled) {
        try { await onlineStatusApi.setOnline(uid); } catch {}
      }
    };
    setOnline();
    return () => { cancelled = true; };
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await AuthStorage.getUser();
      const uid = userData?.userId || (await AuthStorage.getUserIdStr());
      if (!uid) { setLoading(false); return; }

      let data: any = null;
      try {
        data = await profileApi.getMyProfile(uid);
      } catch {
        data = userData?.profile || userData || {};
      }

      setName(data.displayName || data.name || '');
      setProfileText(data.bio || '');
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
        const allImages = await profileApi.getAllImages(uid);
        const imageList = parseImageList(allImages);
        if (imageList.length > 0) {
          const urls = imageList.map((img: any) => resolveImageUri(img.imageUrl || img.url || img));
          setImages(urls);
        }
      } catch {}

      setOwnMobile(userData?.mobile || '');
      setOwnTelegram(userData?.telegramUsername || '');
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
        <ChangeLocation />
        <ConnectTelegram />
        <ChatWithUs onPress={() => Linking.openURL('mailto:hi@dating.com')} />
        <Privacy onPress={() => Linking.openURL('https://example.com/privacy')} />
        <TermsAndConditions onPress={() => Linking.openURL('https://example.com/terms')} />
        <TermsOfUse onPress={() => Linking.openURL('https://example.com/eula')} />
        <Logout />
        <ChangePassword />
        <DeleteMyProfile />
        <AllRightsReserved />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  summarySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#E94057',
  },
  profilePicPlaceholder: {
    backgroundColor: '#E94057',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicPlaceholderText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileNameSection: { flex: 1 },
  userName: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  userBio: { fontSize: 14, color: '#666', marginBottom: 14, lineHeight: 20, paddingRight: 10 },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  detailChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    overflow: 'hidden',
  },
  contactSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  contactIcon: { fontSize: 18, marginRight: 12 },
  contactText: { fontSize: 15, color: '#333' },
});

export default ProfileScreen;
