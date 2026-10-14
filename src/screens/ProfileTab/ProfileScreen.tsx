import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, StatusBar, Modal, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { RootParamList } from '../../utils/types/navigation.types';
import { useAuth } from '../../api/useAuth';
import { clearFullSession } from '../../utils/session';
import { useAlert } from '../../components/AlertModal';
import { getUserId } from '../../utils/sessionHelper';
import { Colors, Spacing, useTheme } from '../../theme';
import AppContext from '../../context/CreateGlobalStateContext';
import { useMyProfile } from '../../api/useProfile';
import AttractiveLogo from '../../components/AttractiveLogo';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import { t, useTranslation } from '../../i18n';

interface SettingsRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
  iconSize?: number;
  themeColors: any;
  styles: any;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  onPress,
  isDestructive = false,
  iconSize = 22,
  themeColors,
  styles,
}) => (
  <TouchableOpacity
    style={styles.menuRow}
    onPress={onPress}
    activeOpacity={0.65}
  >
    <View style={styles.iconContainer}>
      <Icon
        name={icon}
        size={iconSize}
        color={isDestructive ? themeColors.error : themeColors.text}
      />
    </View>
    <Text style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}>
      {label}
    </Text>
  </TouchableOpacity>
);


const ProfileScreen = () => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const { setViewMyProfile, setPaywallVisible, email: contextEmail, setLogin, setAuthUserId } =
    useContext(AppContext);
  const { logout, deleteAccount } = useAuth();
  const { alert, AlertComponent } = useAlert();
  const { data: myProfile } = useMyProfile();
  const [userEmail, setUserEmail] = useState<string>('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleChatWithUs = () => {
    setIsCopied(false);
    Linking.openURL('mailto:hi@amara.com').catch(() => {});
    setChatModalVisible(true);
  };

  useEffect(() => {
    let isMounted = true;
    const loadEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        const u = await AsyncStorage.getItem('user');
        const userData = await AsyncStorage.getItem('userData');
        let emailFound = storedEmail || contextEmail || '';
        if (!emailFound && u) {
          try {
            const parsed = JSON.parse(u);
            emailFound = parsed?.email || parsed?.user?.email || '';
          } catch {}
        }
        if (!emailFound && userData) {
          try {
            const parsed = JSON.parse(userData);
            emailFound = parsed?.email || parsed?.user?.email || '';
          } catch {}
        }
        if (!emailFound && myProfile?.email) {
          emailFound = myProfile.email;
        }
        if (isMounted && emailFound) {
          setUserEmail(emailFound);
        }
      } catch {}
    };
    void loadEmail();
    return () => {
      isMounted = false;
    };
  }, [myProfile, contextEmail]);

  const handleLogout = async () => {
    try {
      await logout();
      setLogin?.(false);
      setAuthUserId?.(null);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const confirmDeleteProfile = async () => {
    try {
      setIsDeleting(true);
      const resolvedUserId = (await getUserId()) || myProfile?.userId || myProfile?.id;
      deleteAccount.mutate(resolvedUserId, {
        onSuccess: async () => {
          setDeleteModalVisible(false);
          await clearFullSession();
          setLogin?.(false);
          setAuthUserId?.(null);
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        },
        onError: async (error: any) => {
          console.error('Delete error:', error);
          setDeleteModalVisible(false);
          await clearFullSession();
          setLogin?.(false);
          setAuthUserId?.(null);
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        },
      });
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteModalVisible(false);
      await clearFullSession();
      setLogin?.(false);
      setAuthUserId?.(null);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />

      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.logoRow}>
          <AttractiveLogo size={28} />
          <Text style={styles.logoText}>{t('home.homeheader.amara')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeader}>{t('profile.profilescreen.settings')}</Text>

        {/* Group 1: Profile & Features */}
        <View style={styles.groupContainer}>
          <SettingsRow
            icon="account-outline"
            label={t('profile.profilescreen.my_profile')}
            themeColors={themeColors}
            styles={styles}
            onPress={() => {
              setViewMyProfile(true);
              navigation.navigate('ViewMyProfileScreen', { userId: undefined });
            }}
          />
          <SettingsRow
            icon="cog-outline"
            label={t('profile.profilesettingheader.edit_profile')}
            themeColors={themeColors}
            styles={styles}
            onPress={() => navigation.navigate('ProfileSettingsScreen')}
          />
          <SettingsRow
            icon="information-outline"
            label={t('more_info.header.about_me')}
            themeColors={themeColors}
            styles={styles}
            onPress={() => navigation.navigate('MoreInfoScreen')}
          />
          <SettingsRow
            icon="tune-variant"
            label={t('search.searchsettingheader.search_settings')}
            themeColors={themeColors}
            styles={styles}
            onPress={() => navigation.navigate('SearchSettings')}
          />
          <SettingsRow
            icon="crown-outline"
            label={t('common.subscriptionmodal.get_premium')}
            themeColors={themeColors}
            styles={styles}
            onPress={() => setPaywallVisible?.(true)}
          />
          <SettingsRow
            icon="send-outline"
            label={t('nav.bottomtabs.telegram')}
            themeColors={themeColors}
            styles={styles}
            onPress={() => navigation.navigate('ConnectTelegram', { fromProfile: true } as any)}
          />
          <SettingsRow
            icon="palette-outline"
            label={t('profile.preferencesscreen.preferences')}
            themeColors={themeColors}
            styles={styles}
            onPress={() => navigation.navigate('PreferencesScreen')}
          />
          <SettingsRow
            icon="map-marker-outline"
            label="Reset Location"
            themeColors={themeColors}
            styles={styles}
            onPress={() => navigation.navigate('ResetLocationScreen')}
          />
        </View>

        <View style={styles.divider} />

        {/* Group 2: Support & Legal */}
        <View style={styles.groupContainer}>
          <SettingsRow
            icon="help-circle-outline"
            label={t('profile.profilescreen.how_to_use_amara')}
            themeColors={themeColors}
            styles={styles}
            onPress={() => navigation.navigate('HowToUseScreen')}
          />
          <SettingsRow
            icon="shield-outline"
            label={t('auth.forgotpasswordscreen.privacy_policy')}
            themeColors={themeColors}
            styles={styles}
            onPress={() => navigation.navigate('PrivacyPolicy', { type: 'privacy' })}
          />
          <SettingsRow
            icon="file-document-outline"
            label={t('profile.termsandconditions.terms_and_conditions')}
            themeColors={themeColors}
            styles={styles}
            onPress={() => navigation.navigate('PrivacyPolicy', { type: 'terms' })}
          />
          <SettingsRow
            icon="chat-outline"
            label="Chat With Us"
            themeColors={themeColors}
            styles={styles}
            onPress={handleChatWithUs}
          />
        </View>

        <View style={styles.divider} />

        {/* Group 3: Account Actions */}
        <View style={styles.groupContainer}>
          <SettingsRow
            icon="logout"
            label="Log Out"
            themeColors={themeColors}
            styles={styles}
            onPress={handleLogout}
          />
          <SettingsRow
            icon="trash-can-outline"
            label="Delete My Profile"
            isDestructive={true}
            themeColors={themeColors}
            styles={styles}
            onPress={() => setDeleteModalVisible(true)}
          />
        </View>

        {/* Footer info */}
        <View style={styles.footerContainer}>
          {userEmail ? (
            <Text style={styles.userEmailText}>{userEmail}</Text>
          ) : null}
          <Text style={styles.versionText}>{t('profile.profilescreen.amara_v5_1_10')}</Text>
        </View>
      </ScrollView>

      {/* Custom Delete Profile Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeleting) setDeleteModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setDeleteModalVisible(false)}
              disabled={isDeleting}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Delete My Profile</Text>

            <Text style={styles.modalBodyText}>{t('profile.profilescreen.your_profile_will_be_hidden_immediately_and_permanently_deleted_after')}</Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>{t('profile.additionaluploadsection.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={confirmDeleteProfile}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteBtnText}>{t('profile.uploadimage.delete')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat With Us Modal matching screenshot */}
      <Modal
        visible={chatModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.chatModalCard,
              { backgroundColor: isDark ? '#1A1730' : '#FFFFFF' },
            ]}
          >
            <Text
              style={[
                styles.chatModalTitle,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              Chat With Us
            </Text>

            <Text
              style={[
                styles.chatModalSubtitle,
                { color: isDark ? '#A5A3B5' : '#333333' },
              ]}
            >{t('profile.profilescreen.send_us_an_email_and_well_get_back_to_you_as_soon_as_possible')}</Text>

            <TouchableOpacity
              style={[
                styles.chatEmailPill,
                { backgroundColor: isDark ? '#262244' : '#F1F5F9' },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                Linking.openURL('mailto:hi@amara.com').catch(() => {});
              }}
            >
              <Text
                selectable={true}
                style={[
                  styles.chatEmailText,
                  { color: isDark ? '#FFFFFF' : '#000000', flex: 1 },
                ]}
              >{t('profile.profilescreen.hi_amara_com')}</Text>
              <TouchableOpacity
                onPress={() => {
                  Clipboard.setString(t('profile.profilescreen.hi_amara_com'));
                  setIsCopied(true);
                  Toast.show({
                    type: 'success',
                    text1: t('profile.profilescreen.copied_to_clipboard'),
                    text2: t('profile.profilescreen.hi_amara_com'),
                  });
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ padding: 4 }}
              >
                <Icon
                  name={isCopied ? 'check' : 'content-copy'}
                  size={18}
                  color={isCopied ? (themeColors.primary || '#7C3AED') : (isDark ? '#FFFFFF' : '#000000')}
                />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chatCloseBtn,
                { backgroundColor: isDark ? '#262244' : '#F1F5F9' },
              ]}
              activeOpacity={0.8}
              onPress={() => setChatModalVisible(false)}
            >
              <Text
                style={[
                  styles.chatCloseBtnText,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >{t('more_info.moreinfoscreen.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {AlertComponent}
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    brandHeader: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      backgroundColor: colors.background,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoText: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.5,
      marginLeft: 8,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 120,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      paddingHorizontal: 20,
      marginTop: 18,
      marginBottom: 8,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    groupContainer: {
      paddingHorizontal: 0,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    iconContainer: {
      width: 28,
      alignItems: 'flex-start',
      justifyContent: 'center',
      marginRight: 16,
    },
    menuLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '400',
    },
    destructiveLabel: {
      color: colors.error,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginHorizontal: 20,
      marginVertical: 6,
    },
    footerContainer: {
      alignItems: 'center',
      marginTop: 28,
      marginBottom: 20,
    },
    userEmailText: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    versionText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    modalCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 22,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 10,
      position: 'relative',
    },
    modalCloseBtn: {
      position: 'absolute',
      top: 18,
      right: 18,
      padding: 4,
      zIndex: 10,
    },
    modalTitle: {
      fontSize: 21,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
      paddingRight: 28,
      letterSpacing: -0.2,
    },
    modalBodyText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    modalButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 12,
    },
    cancelBtn: {
      paddingVertical: 10,
      paddingHorizontal: 22,
      borderRadius: 22,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    deleteBtn: {
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 22,
      backgroundColor: '#F87171',
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 84,
    },
    deleteBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    chatModalCard: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 24,
      padding: 24,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    chatModalTitle: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 10,
      letterSpacing: -0.3,
    },
    chatModalSubtitle: {
      fontSize: 14.5,
      lineHeight: 21,
      marginBottom: 20,
    },
    chatEmailPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 16,
    },
    chatEmailText: {
      fontSize: 15,
      fontWeight: '700',
    },
    chatCloseBtn: {
      alignSelf: 'flex-end',
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 22,
      marginTop: 22,
    },
    chatCloseBtnText: {
      fontSize: 14.5,
      fontWeight: '700',
    },
  });

export default ProfileScreen;

