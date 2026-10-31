import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors } from '../../theme';
import { APP_LANGUAGES, LanguageOption, getLanguageFlag } from '../../utils/languageHelper';
import { t, useTranslation, setLanguage } from '../../i18n';
import apiClient from '../../api/apiClient';
import { getUserId } from '../../utils/sessionHelper';
import { getAuthSession } from '../../utils/session';

export { APP_LANGUAGES, getLanguageFlag };
export type { LanguageOption };

const PreferencesScreen = () => {
  useTranslation();
  const navigation = useNavigation<any>();
  const { themeMode, setThemeMode, themeColors } = useContext(AppContext);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(t('profile.userdetails.english'));
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const colors = themeColors || Colors;
  const isDark = colors.background !== '#F8F9FA' && colors.background !== '#FFFFFF';

  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        const savedCode = await AsyncStorage.getItem('@app_language_code');
        if (savedCode) {
          const match = APP_LANGUAGES.find((lang) => lang.code === savedCode);
          if (match) {
            setSelectedLanguage(match.name);
          }
        } else {
          const savedLang = await AsyncStorage.getItem('@app_language_name');
          if (savedLang) {
            setSelectedLanguage(savedLang);
          }
        }

        const savedEmail = await AsyncStorage.getItem('@app_email_notifications');
        if (savedEmail !== null) {
          setEmailNotifications(savedEmail === 'true');
        }

        let uid = await getUserId().catch(() => null);
        if (!uid) {
          const sess = await getAuthSession();
          uid = sess?.userId || null;
        }

        apiClient
          .get('/notification/preferences', {
            params: uid ? { userId: uid } : undefined,
          })
          .then((res) => {
            if (res?.data && typeof res.data.emailNotifications === 'boolean') {
              setEmailNotifications(res.data.emailNotifications);
            }
          })
          .catch(() => {});
      } catch (e) {
        console.warn('Error reading preferences:', e);
      }
    };
    loadSavedPreferences();
  }, []);

  const selectedLanguageFlag = useMemo(() => {
    return getLanguageFlag(selectedLanguage);
  }, [selectedLanguage]);

  const handleSelectLanguage = async (lang: LanguageOption) => {
    setSelectedLanguage(lang.name);
    setIsLanguageModalVisible(false);
    setSearchQuery('');
    try {
      await setLanguage(lang.code);
      await AsyncStorage.setItem('@app_language_name', lang.name);
    } catch (e) {
      console.warn('Error saving language preference:', e);
    }
  };

  const handleToggleEmailNotifications = async (val: boolean) => {
    setEmailNotifications(val);
    try {
      await AsyncStorage.setItem('@app_email_notifications', String(val));
      let uid = await getUserId().catch(() => null);
      if (!uid) {
        const sess = await getAuthSession();
        uid = sess?.userId || null;
      }

      await apiClient
        .put(
          '/notification/preferences',
          {
            emailNotifications: val,
            ...(uid ? { userId: uid } : {}),
          },
          {
            params: uid ? { userId: uid } : undefined,
          },
        )
        .catch(() => {});
    } catch (e) {
      console.warn('Error saving email notification preference:', e);
    }
  };

  const handleChangeAppearance = async (theme: 'light' | 'system' | 'dark') => {
    setThemeMode(theme);
    try {
      await AsyncStorage.setItem('@app_appearance_theme', theme);
    } catch (e) {
      console.warn('Error saving appearance theme preference:', e);
    }
  };

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return APP_LANGUAGES;
    return APP_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.englishName.toLowerCase().includes(q) ||
        (lang.nativeName && lang.nativeName.toLowerCase().includes(q)) ||
        lang.code.toLowerCase().includes(q) ||
        lang.flag.includes(q)
    );
  }, [searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight || 'rgba(255, 255, 255, 0.08)' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.preferencesscreen.preferences')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section: DISPLAY */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('profile.preferencesscreen.display')}</Text>

        <View
          style={[
            styles.cardGroup,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Language Row */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => setIsLanguageModalVisible(true)}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.1)' }]}>
                <Icon
                  name="translate"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.preferencesscreen.language')}</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValueFlag}>{selectedLanguageFlag}</Text>
              <Text style={[styles.menuValue, { color: colors.textSecondary }]} numberOfLines={1}>
                {selectedLanguage}
              </Text>
              <Feather name="chevron-right" size={18} color={colors.textMuted} style={styles.chevron} />
            </View>
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />

          {/* Email Notifications Row */}
          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.1)' }]}>
                <Icon
                  name="email-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{t('profile.preferencesscreen.email_notifications')}</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={handleToggleEmailNotifications}
              trackColor={{ false: colors.surfaceLighter, true: '#10B981' }}
              thumbColor={Colors.white}
              ios_backgroundColor={colors.surfaceLighter}
            />
          </View>
        </View>

        {/* Section: Appearance */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('search.appearance.appearance')}</Text>

        <View style={styles.appearanceRow}>
          {/* Light Theme Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.appearanceCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              themeMode === 'light' && [
                styles.appearanceCardActive,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ],
            ]}
            onPress={() => handleChangeAppearance('light')}
          >
            <Feather
              name="sun"
              size={22}
              color={themeMode === 'light' ? Colors.white : colors.textSecondary}
              style={styles.appearanceIcon}
            />
            <Text
              style={[
                styles.appearanceText,
                { color: themeMode === 'light' ? Colors.white : colors.textSecondary },
                themeMode === 'light' && styles.appearanceTextActive,
              ]}
            >{t('profile.preferencesscreen.light')}</Text>
          </TouchableOpacity>

          {/* System Theme Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.appearanceCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              themeMode === 'system' && [
                styles.appearanceCardActive,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ],
            ]}
            onPress={() => handleChangeAppearance('system')}
          >
            <Icon
              name="laptop"
              size={23}
              color={themeMode === 'system' ? Colors.white : colors.textSecondary}
              style={styles.appearanceIcon}
            />
            <Text
              style={[
                styles.appearanceText,
                { color: themeMode === 'system' ? Colors.white : colors.textSecondary },
                themeMode === 'system' && styles.appearanceTextActive,
              ]}
            >{t('profile.preferencesscreen.system')}</Text>
          </TouchableOpacity>

          {/* Dark Theme Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.appearanceCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              themeMode === 'dark' && [
                styles.appearanceCardActive,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ],
            ]}
            onPress={() => handleChangeAppearance('dark')}
          >
            <Feather
              name="moon"
              size={22}
              color={themeMode === 'dark' ? Colors.white : colors.textSecondary}
              style={styles.appearanceIcon}
            />
            <Text
              style={[
                styles.appearanceText,
                { color: themeMode === 'dark' ? Colors.white : colors.textSecondary },
                themeMode === 'dark' && styles.appearanceTextActive,
              ]}
            >{t('profile.preferencesscreen.dark')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selection Bottom Sheet Modal */}
      <Modal
        visible={isLanguageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsLanguageModalVisible(false);
          setSearchQuery('');
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setIsLanguageModalVisible(false);
            setSearchQuery('');
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.modalSheetContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Search Bar Header */}
                <View style={[styles.modalSearchRow, { borderBottomColor: colors.divider }]}>
                  <View
                    style={[
                      styles.searchInputContainer,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Feather name="search" size={18} color={colors.placeholder} style={styles.searchIcon} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text }]}
                      placeholder={t('profile.preferencesscreen.search_language')}
                      placeholderTextColor={colors.placeholder}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setIsLanguageModalVisible(false);
                      setSearchQuery('');
                    }}
                    style={styles.cancelBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelBtnText, { color: isDark ? Colors.primaryLight : '#E11D48' }]}>{t('profile.additionaluploadsection.cancel')}</Text>
                  </TouchableOpacity>
                </View>

                {/* Languages List */}
                <FlatList
                  data={filteredLanguages}
                  keyExtractor={(item) => item.code}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.languageListContent}
                  renderItem={({ item }) => {
                    const isSelected =
                      selectedLanguage.toLowerCase() === item.name.toLowerCase() ||
                      selectedLanguage.toLowerCase() === item.englishName.toLowerCase();
                    return (
                      <TouchableOpacity
                        style={[styles.languageItemRow, { borderBottomColor: colors.divider }]}
                        activeOpacity={0.7}
                        onPress={() => handleSelectLanguage(item)}
                      >
                        <View style={styles.languageItemLeft}>
                          <Text style={styles.languageFlagEmoji}>{item.flag}</Text>
                          <Text style={[styles.languageItemName, { color: colors.text }]}>{item.name}</Text>
                        </View>
                        <View
                          style={[
                            styles.checkboxBox,
                            { borderColor: colors.textMuted },
                            isSelected && (isDark ? styles.checkboxBoxSelectedDark : styles.checkboxBoxSelectedLight),
                          ]}
                        >
                          {isSelected && (
                            <Feather name="check" size={14} color={Colors.white} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptySearchContainer}>
                      <Text style={[styles.emptySearchText, { color: colors.textMuted }]}>{t('profile.preferencesscreen.no_languages_found')}</Text>
                    </View>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default PreferencesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  cardGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 28,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  menuTextGroup: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10,
  },
  menuSubLabel: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValueFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  menuValue: {
    fontSize: 14.5,
    fontWeight: '500',
    marginRight: 4,
    maxWidth: 140,
  },
  chevron: {
    marginLeft: 2,
  },
  rowDivider: {
    height: 1,
    marginLeft: 64,
  },
  appearanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  appearanceCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceCardActive: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  appearanceIcon: {
    marginBottom: 10,
  },
  appearanceText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  appearanceTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    minHeight: '55%',
    borderWidth: 1,
    paddingTop: 16,
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 0,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  languageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 30,
  },
  languageItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  languageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlagEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  languageItemName: {
    fontSize: 15.5,
    fontWeight: '500',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxSelectedDark: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxBoxSelectedLight: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  emptySearchContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
  },
});
