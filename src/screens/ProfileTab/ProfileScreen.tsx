import { useContext, useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootParamList } from '../../utils/types/navigation.types';
import AppContext from '../../context/CreateGlobalStateContext';
import {
  ScrollView, View, Text, StyleSheet, Alert, Linking, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
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
import DeactivateMyProfile from '../../components/ProfileTabComponents/DeactivateMyProfile/DeactivateMyProfile';
import AllRightsReserved from '../../components/ProfileTabComponents/AllRightsReserved';
import { profileApi } from '../../api/profileApi';
import { onlineStatusApi } from '../../api/onlineStatusApi';
import { AuthStorage } from '../../api/authStorage';
import { ENGLISH_LEVELS } from '../../constants/profileOptions';
import { colors, radius, shadow, typography } from '../../constants/theme';
import { resolveImageUri, parseImageList } from '../../utils/imageUtils';

const ProfileScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootParamList>>();
  const {
    name, profileText, profileImage, images, verifiedSelfie,
    height, setHeight, setTempHeight,
    selectedAppearance, selectedBodyType, selectedLanguages, englishSkillLevel,
    selectedEthinicity, selectedSmoking, selectedLookingFor,
    setName, setProfileText, setImages, setProfileImage,
    setSelectedAppearance, setSelectedBodyType, setSelectedSmoking, setEnglishSkillLevel,
    setSelectedEthinicity, setSelectedLanguages, setVerifiedSelfie,
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
        const idx = ENGLISH_LEVELS.indexOf(data.englishLevel);
        if (idx >= 0) setEnglishSkillLevel(idx);
      }
      setVerifiedSelfie(!!data.verifiedSelfie);
      // /profile/me never returns lookingFor/dob (confirmed against the live
      // backend) — selectedLookingFor/date are carried via shared context,
      // populated during onboarding, not re-fetched here.

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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.summarySection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.avatarRing}
              >
                {profileImage ? (
                  <AuthImage uri={profileImage} style={styles.profilePic} />
                ) : (
                  <View style={[styles.profilePic, styles.profilePicPlaceholder]}>
                    <Text style={styles.profilePicPlaceholderText}>
                      {(name || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </LinearGradient>
              {verifiedSelfie ? (
                <View style={styles.verifiedDot}>
                  <Icon name="check" size={11} color="#fff" solid />
                </View>
              ) : null}
            </View>
            <View style={styles.profileNameSection}>
              <Text style={styles.userName}>{name || 'User'}</Text>
              {verifiedSelfie ? (
                <View style={styles.verifiedPill}>
                  <Icon name="shield-alt" size={10} color={colors.primary} solid />
                  <Text style={styles.verifiedPillText}>Verified</Text>
                </View>
              ) : null}
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
                {ENGLISH_LEVELS[englishSkillLevel]}
              </Text>
            ) : null}
            {selectedSmoking ? <Text style={styles.detailChip}>Smoke: {selectedSmoking}</Text> : null}
            {selectedLookingFor?.length > 0 ? <Text style={styles.detailChip}>Looking for: {selectedLookingFor.join(', ')}</Text> : null}
          </View>

          {(ownMobile || ownTelegram || ownEmail) ? (
            <View style={styles.contactSection}>
              <Text style={styles.contactSectionTitle}>Contact</Text>
              {ownMobile ? (
                <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${ownMobile}`)}>
                  <View style={styles.contactIconCircle}>
                    <Icon name="phone-alt" size={13} color={colors.primary} solid />
                  </View>
                  <Text style={styles.contactText}>{ownMobile}</Text>
                </TouchableOpacity>
              ) : null}
              {ownTelegram ? (
                <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`https://t.me/${ownTelegram.replace('@', '')}`)}>
                  <View style={styles.contactIconCircle}>
                    <Icon name="paper-plane" size={13} color={colors.primary} solid />
                  </View>
                  <Text style={styles.contactText}>@{ownTelegram}</Text>
                </TouchableOpacity>
              ) : null}
              {ownEmail ? (
                <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${ownEmail}`)}>
                  <View style={styles.contactIconCircle}>
                    <Icon name="envelope" size={13} color={colors.primary} solid />
                  </View>
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
        <ChatWithUs onPress={() => navigation.navigate('SupportTickets')} />
        <Privacy onPress={() => Linking.openURL('https://example.com/privacy')} />
        <TermsAndConditions onPress={() => Linking.openURL('https://example.com/terms')} />
        <TermsOfUse onPress={() => Linking.openURL('https://example.com/eula')} />
        <Logout />
        <ChangePassword />
        <DeactivateMyProfile />
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
    marginBottom: 16,
  },
  avatarWrapper: { position: 'relative', marginRight: 16 },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  profilePicPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicPlaceholderText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileNameSection: { flex: 1 },
  userName: { ...typography.title, color: colors.ink },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
    gap: 5,
  },
  verifiedPillText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  userBio: { ...typography.body, color: colors.inkMuted, marginBottom: 16, lineHeight: 21, paddingRight: 10 },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  detailChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  contactSectionTitle: { ...typography.micro, color: colors.inkMuted, marginBottom: 8, textTransform: 'uppercase' },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  contactIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactText: { ...typography.body, color: colors.ink },
});

export default ProfileScreen;
