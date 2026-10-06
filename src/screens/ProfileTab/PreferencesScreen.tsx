import React, { useContext, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors } from '../../theme';

export interface LanguageOption {
  code: string;
  name: string;
  englishName: string;
}

export const APP_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', englishName: 'English' },
  { code: 'mr', name: 'मराठी', englishName: 'Marathi' },
  { code: 'hi', name: 'हिंदी', englishName: 'Hindi' },
  { code: 'de', name: 'Deutsch', englishName: 'German' },
  { code: 'es', name: 'español', englishName: 'Spanish' },
  { code: 'fr', name: 'français', englishName: 'French' },
  { code: 'pt-BR', name: 'português do Brasil', englishName: 'Portuguese (Brazil)' },
  { code: 'ro', name: 'română', englishName: 'Romanian' },
  { code: 'ru', name: 'русский', englishName: 'Russian' },
  { code: 'tr', name: 'Türkçe', englishName: 'Turkish' },
  { code: 'uk', name: 'українська', englishName: 'Ukrainian' },
];

const PreferencesScreen = () => {
  const navigation = useNavigation<any>();
  const { themeMode, setThemeMode, themeColors } = useContext(AppContext);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const colors = themeColors || Colors;
  const isDark = colors.background !== '#F8F9FA';

  const handleSelectLanguage = async (lang: LanguageOption) => {
    setSelectedLanguage(lang.name);
    setIsLanguageModalVisible(false);
    setSearchQuery('');
    try {
      await AsyncStorage.setItem('@app_language_code', lang.code);
      await AsyncStorage.setItem('@app_language_name', lang.name);
    } catch (e) {
      console.warn('Error saving language preference:', e);
    }
  };

  const handleToggleEmailNotifications = async (val: boolean) => {
    setEmailNotifications(val);
    try {
      await AsyncStorage.setItem('@app_email_notifications', String(val));
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
        lang.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Preferences</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Section: DISPLAY */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>DISPLAY</Text>

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
              <Icon
                name="translate"
                size={22}
                color={isDark ? Colors.primaryLight : '#4B5563'}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuLabel, { color: colors.text }]}>Language</Text>
            </View>
            <View style={styles.menuRight}>
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
              <Icon
                name="email-outline"
                size={22}
                color={isDark ? Colors.primaryLight : '#4B5563'}
                style={styles.menuIcon}
              />
              <Text style={[styles.menuLabel, { color: colors.text }]}>Email notifications</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={handleToggleEmailNotifications}
              trackColor={{ false: colors.surfaceLighter, true: Colors.success }}
              thumbColor={Colors.white}
              ios_backgroundColor={colors.surfaceLighter}
            />
          </View>
        </View>

        {/* Section: Appearance */}
        <Text style={[styles.appearanceSectionHeader, { color: colors.text }]}>Appearance</Text>

        <View style={styles.appearanceRow}>
          {/* Light Theme Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.appearanceCard,
              {
                backgroundColor: isDark ? colors.surface : '#F3F4F6',
                borderColor: isDark ? colors.border : '#E5E7EB',
              },
              themeMode === 'light' && (isDark ? styles.appearanceCardActiveDark : styles.appearanceCardActiveLight),
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
                { color: colors.textSecondary },
                themeMode === 'light' && styles.appearanceTextActive,
              ]}
            >
              Light
            </Text>
          </TouchableOpacity>

          {/* System Theme Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.appearanceCard,
              {
                backgroundColor: isDark ? colors.surface : '#F3F4F6',
                borderColor: isDark ? colors.border : '#E5E7EB',
              },
              themeMode === 'system' && (isDark ? styles.appearanceCardActiveDark : styles.appearanceCardActiveLight),
            ]}
            onPress={() => handleChangeAppearance('system')}
          >
            <Icon
              name="laptop"
              size={24}
              color={themeMode === 'system' ? Colors.white : colors.textSecondary}
              style={styles.appearanceIcon}
            />
            <Text
              style={[
                styles.appearanceText,
                { color: colors.textSecondary },
                themeMode === 'system' && styles.appearanceTextActive,
              ]}
            >
              System
            </Text>
          </TouchableOpacity>

          {/* Dark Theme Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.appearanceCard,
              {
                backgroundColor: isDark ? colors.surface : '#F3F4F6',
                borderColor: isDark ? colors.border : '#E5E7EB',
              },
              themeMode === 'dark' && (isDark ? styles.appearanceCardActiveDark : styles.appearanceCardActiveLight),
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
                { color: colors.textSecondary },
                themeMode === 'dark' && styles.appearanceTextActive,
              ]}
            >
              Dark
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
                      placeholder="Search language"
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
                    <Text style={[styles.cancelBtnText, { color: isDark ? Colors.primaryLight : '#E11D48' }]}>
                      Cancel
                    </Text>
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
                        <Text style={[styles.languageItemName, { color: colors.text }]}>{item.name}</Text>
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
                      <Text style={[styles.emptySearchText, { color: colors.textMuted }]}>
                        No languages found
                      </Text>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  cardGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 15.5,
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: 15,
    marginRight: 6,
    maxWidth: 140,
  },
  chevron: {
    marginLeft: 2,
  },
  rowDivider: {
    height: 1,
    marginLeft: 50,
  },
  appearanceSectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  appearanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  appearanceCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceCardActiveDark: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  appearanceCardActiveLight: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  appearanceIcon: {
    marginBottom: 8,
  },
  appearanceText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  appearanceTextActive: {
    color: Colors.white,
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
