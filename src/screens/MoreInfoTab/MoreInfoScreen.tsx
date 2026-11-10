import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BackHandler, DeviceEventEmitter, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile, useMyProfile } from '../../api/useProfile';
import AppearanceSelector from '../../components/MoreInfoTabComponents/AppearanceSelector';
import BodyTypeSelector from '../../components/MoreInfoTabComponents/BodyTypeSelector';
import DoYouSmokeSelector from '../../components/MoreInfoTabComponents/DoYouSmokeSelector';
import DrinkingSelector from '../../components/MoreInfoTabComponents/DrinkingSelector';
import EnglishSkillSelector from '../../components/MoreInfoTabComponents/EnglishSkillSelector';
import EthnicitySelector from '../../components/MoreInfoTabComponents/EthnicitySelector';
import Header from '../../components/MoreInfoTabComponents/Header';
import HeightSelector from '../../components/MoreInfoTabComponents/HeightSelector';
import KidsSelector from '../../components/MoreInfoTabComponents/KidsSelector';
import LanguagesSelector from '../../components/MoreInfoTabComponents/LanguagesSelector';
import LookingForSelector from '../../components/MoreInfoTabComponents/LookingForSelector';
import NetWorthSelector from '../../components/MoreInfoTabComponents/NetWorthSelector';
import SaveButton from '../../components/MoreInfoTabComponents/SaveButton';
import AppContext from '../../context/CreateGlobalStateContext';
import { getAuthSession } from '../../utils/session';
import { Colors, useTheme } from '../../theme';
import { useAlert } from '../../components/AlertModal';
import { getUserFriendlyMessage } from '../../utils/userFriendlyMessages';
import { t, useTranslation } from '../../i18n';

const HIDDEN_PROFILE_LANGUAGES = new Set(['telugu']);
const HIDDEN_LOOKING_FOR_VALUES = new Set(['long-term relationship']);

const MoreInfoScreen = () => {
  useTranslation();
  const { themeColors } = useTheme();
  const { alert, AlertComponent } = useAlert();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation<any>();

  const isInsideBottomTab = route.name === 'AboutMe' || Boolean((route as any).name?.toLowerCase().includes('about'));
  const bottomMargin = isInsideBottomTab
    ? (Platform.OS === 'ios' ? 70 : 66) + Math.max(insets.bottom, 0)
    : Math.max(insets.bottom, 14);

  // Handle hardware back button on Android
  useEffect(() => {
    const onHardwareBack = () => {
      if (navigation?.canGoBack?.() && !isInsideBottomTab) {
        navigation.goBack();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [navigation, isInsideBottomTab]);

  const {
    height,
    setHeight,
    tempHeight,
    setTempHeight,
    selectedAppearance,
    setSelectedAppearance,
    selectedBodyType,
    setSelectedBodyType,
    selectedLanguages,
    setSelectedLanguages,
    englishSkillLevel,
    setEnglishSkillLevel,
    selectedEthinicity,
    setSelectedEthinicity,
    selectedSmoking,
    setSelectedSmoking,
    selectedDrinking,
    setSelectedDrinking,
    selectedLookingFor,
    setSelectedLookingFor,
    selectedKids,
    setSelectedKids,
    selectedNetWorth,
    setSelectedNetWorth,
  } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const { updateDetails, updatePreferences } = useProfile();
  const profileQuery = useMyProfile(undefined);

  const isHydratedRef = useRef(false);
  const lastSyncedProfileKeyRef = useRef<string | null>(null);
  const refetchProfileRef = useRef(profileQuery.refetch);
  refetchProfileRef.current = profileQuery.refetch;

  // Hydrate once from AsyncStorage on mount
  useEffect(() => {
    if (isHydratedRef.current) return;
    isHydratedRef.current = true;

    AsyncStorage.multiGet([
      '@amara_kid_count',
      '@amara_net_worth',
      '@amara_height',
      '@amara_appearance',
      '@amara_body_type',
      '@amara_ethnicity',
      '@amara_smoking',
      '@amara_drinking',
      '@amara_looking_for',
      '@amara_languages',
      '@amara_english_level',
    ])
      .then((pairs) => {
        pairs.forEach(([key, val]) => {
          if (!val || val === 'null' || val === 'undefined') return;
          if (key === '@amara_kid_count') {
            setSelectedKids(String(val).replace(/^kids:\s*/i, '').trim());
          }
          if (key === '@amara_net_worth') {
            setSelectedNetWorth(String(val).replace(/^\$\s*/, '').trim());
          }
          if (key === '@amara_height') {
            const num = Number(val);
            if (Number.isFinite(num) && num > 0) {
              setHeight(num);
              setTempHeight?.(num);
            }
          }
          if (key === '@amara_appearance') setSelectedAppearance(val);
          if (key === '@amara_body_type') setSelectedBodyType(val);
          if (key === '@amara_ethnicity') setSelectedEthinicity(val);
          if (key === '@amara_smoking') setSelectedSmoking(val);
          if (key === '@amara_drinking') setSelectedDrinking(val);
          if (key === '@amara_english_level') {
            const lvl = Number(val);
            if (Number.isFinite(lvl) && lvl >= 0 && lvl <= 3) {
              setEnglishSkillLevel(lvl);
            }
          }
          if (key === '@amara_looking_for') {
            try {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSelectedLookingFor(parsed);
              }
            } catch {
              const split = val.split(',').map((s) => s.trim()).filter(Boolean);
              if (split.length > 0) setSelectedLookingFor(split);
            }
          }
          if (key === '@amara_languages') {
            try {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSelectedLanguages(parsed);
              }
            } catch {
              const split = val.split(',').map((s) => s.trim()).filter(Boolean);
              if (split.length > 0) setSelectedLanguages(split);
            }
          }
        });
      })
      .catch((e) => {
        console.warn('[MoreInfo] Failed to hydrate from AsyncStorage:', e);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On screen focus, refetch fresh profile data without re-triggering render loops
  useFocusEffect(
    useCallback(() => {
      refetchProfileRef.current?.();
    }, [])
  );

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) {
      return;
    }

    const currentKey = JSON.stringify({
      height: profile.height,
      appearance: profile.appearance,
      bodyType: profile.bodyType,
      language: profile.language,
      ethnicity: profile.ethnicity,
      smoke: profile.smoke,
      drink: profile.drink,
      lookingFor: profile.lookingFor,
      kidCount: profile.kidCount,
      kids: profile.kids,
      netWorth: profile.netWorth,
      englishLevel: profile.englishLevel,
    });

    if (lastSyncedProfileKeyRef.current === currentKey) {
      return;
    }
    lastSyncedProfileKeyRef.current = currentKey;

    const splitValues = (value?: string) =>
      String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    const visibleLanguages = splitValues(profile.language).filter(
      (item) => !HIDDEN_PROFILE_LANGUAGES.has(item.toLowerCase()),
    );
    const visibleLookingFor = splitValues(profile.lookingFor).filter(
      (item) => !HIDDEN_LOOKING_FOR_VALUES.has(item.toLowerCase()),
    );

    const englishLevelMap = ['basic', 'medium', 'good', 'very good'];
    const legacyEnglishMap = ['beginner', 'intermediate', 'advanced', 'native'];
    const rawLevelStr = String(profile.englishLevel || '').trim().toLowerCase();
    let englishIndex = englishLevelMap.indexOf(rawLevelStr);
    if (englishIndex === -1) {
      englishIndex = legacyEnglishMap.indexOf(rawLevelStr);
    }
    const numLevel = Number(profile.englishLevel);
    if (
      englishIndex === -1 &&
      Number.isFinite(numLevel) &&
      numLevel >= 0 &&
      numLevel <= 3 &&
      String(profile.englishLevel).trim() !== ''
    ) {
      englishIndex = numLevel;
    }

    if (profile.height) {
      const h = Number(profile.height);
      if (Number.isFinite(h) && h > 0) {
        setHeight(h);
        setTempHeight?.(h);
      }
    }
    if (profile.appearance) {
      setSelectedAppearance(profile.appearance);
    }
    if (profile.bodyType) {
      setSelectedBodyType(profile.bodyType);
    }
    if (visibleLanguages.length > 0) {
      setSelectedLanguages(visibleLanguages);
    }
    if (profile.ethnicity) {
      setSelectedEthinicity(profile.ethnicity);
    }
    if (profile.smoke) {
      setSelectedSmoking(profile.smoke);
    }
    if (profile.drink) {
      setSelectedDrinking(profile.drink);
    }
    if (visibleLookingFor.length > 0) {
      setSelectedLookingFor(visibleLookingFor);
    }
    const rawKids =
      profile.kidCount !== undefined &&
      profile.kidCount !== null &&
      String(profile.kidCount).trim() !== ''
        ? profile.kidCount
        : profile.kids !== undefined &&
          profile.kids !== null &&
          String(profile.kids).trim() !== ''
        ? profile.kids
        : null;
    if (rawKids !== null) {
      setSelectedKids(String(rawKids).replace(/^kids:\s*/i, '').trim());
    }
    if (profile.netWorth) {
      setSelectedNetWorth(String(profile.netWorth).replace(/^\$\s*/, '').trim());
    }
    if (englishIndex >= 0) {
      setEnglishSkillLevel(englishIndex);
    }

    // Persist to AsyncStorage for offline and immediate next load - ONLY non-empty values so we never wipe saved state
    const storageUpdates: [string, string][] = [];
    if (profile.height) storageUpdates.push(['@amara_height', String(profile.height)]);
    if (profile.appearance) storageUpdates.push(['@amara_appearance', profile.appearance]);
    if (profile.bodyType) storageUpdates.push(['@amara_body_type', profile.bodyType]);
    if (profile.ethnicity) storageUpdates.push(['@amara_ethnicity', profile.ethnicity]);
    if (profile.smoke) storageUpdates.push(['@amara_smoking', profile.smoke]);
    if (profile.drink) storageUpdates.push(['@amara_drinking', profile.drink]);
    if (visibleLookingFor.length > 0) storageUpdates.push(['@amara_looking_for', JSON.stringify(visibleLookingFor)]);
    if (visibleLanguages.length > 0) storageUpdates.push(['@amara_languages', JSON.stringify(visibleLanguages)]);
    if (englishIndex >= 0) storageUpdates.push(['@amara_english_level', String(englishIndex)]);
    if (rawKids !== null && String(rawKids).trim()) storageUpdates.push(['@amara_kid_count', String(rawKids).replace(/^kids:\s*/i, '').trim()]);
    if (profile.netWorth) storageUpdates.push(['@amara_net_worth', String(profile.netWorth).replace(/^\$\s*/, '').trim()]);

    if (storageUpdates.length > 0) {
      AsyncStorage.multiSet(storageUpdates).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data]);

  const handleSave = async () => {
    const authSession = await getAuthSession();
    const hasUsableSessionToken = Boolean(authSession?.token);

    if (!hasUsableSessionToken) {
      alert(t('more_info.moreinfoscreen.session_error'), t('more_info.moreinfoscreen.please_log_in_again_to_continue'));
      return;
    }

    try {
      setLoading(true);

      const englishLevels = ['Basic', 'Medium', 'Good', 'Very Good'];
      const englishLevelStr = englishLevels[Number(englishSkillLevel)] || 'Basic';
      const languageStr = Array.isArray(selectedLanguages) ? selectedLanguages.join(', ') : '';
      const lookingForStr = Array.isArray(selectedLookingFor) ? selectedLookingFor.join(', ') : '';

      const detailsPayload = {
        language: languageStr,
        appearance: selectedAppearance || '',
        bodyType: selectedBodyType || '',
        height: Number(height) || 0,
        englishLevel: englishLevelStr,
        ethnicity: selectedEthinicity || '',
        kidCount: selectedKids || '',
        netWorth: selectedNetWorth || '',
      };

      const prefsPayload = {
        lookingFor: lookingForStr,
        smoke: selectedSmoking || '',
        drink: selectedDrinking || '',
        ethnicity: selectedEthinicity || '',
      };

      // 1. Immediately save to AsyncStorage so local state is guaranteed persistent
      await AsyncStorage.multiSet([
        ['@amara_height', String(height || '')],
        ['@amara_appearance', selectedAppearance || ''],
        ['@amara_body_type', selectedBodyType || ''],
        ['@amara_ethnicity', selectedEthinicity || ''],
        ['@amara_smoking', selectedSmoking || ''],
        ['@amara_drinking', selectedDrinking || ''],
        ['@amara_looking_for', JSON.stringify(selectedLookingFor || [])],
        ['@amara_languages', JSON.stringify(selectedLanguages || [])],
        ['@amara_english_level', String(englishSkillLevel ?? 0)],
        ['@amara_kid_count', selectedKids || ''],
        ['@amara_net_worth', selectedNetWorth || ''],
      ]);

      // 2. Sync to backend API
      await Promise.allSettled([
        updateDetails.mutateAsync(detailsPayload),
        updatePreferences.mutateAsync(prefsPayload),
      ]);

      DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED');
      void profileQuery.refetch();

      // Take user directly to Discover page after saving
      if (isInsideBottomTab) {
        try {
          navigation?.navigate?.('Home');
        } catch {
          navigation?.navigate?.('Invitations');
        }
      } else {
        try {
          navigation?.navigate?.('BottomTabs', { screen: 'Home' });
        } catch {
          try {
            navigation?.navigate?.('Home');
          } catch {
            if (navigation?.canGoBack?.()) {
              navigation.goBack();
            }
          }
        }
      }
    } catch (error: any) {
      console.warn('[MoreInfo] SAVE FAILED:', error?.message, error?.response?.data);
      // Fallback navigation to Discover page even if network error
      if (isInsideBottomTab) {
        try {
          navigation?.navigate?.('Home');
        } catch {}
      } else if (navigation?.canGoBack?.()) {
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <Header
        showBackButton={!isInsideBottomTab && navigation?.canGoBack?.()}
        onBackPress={() => navigation?.goBack?.()}
      />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: themeColors.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: themeColors.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { backgroundColor: themeColors.background }]}>
          <HeightSelector />
          <BodyTypeSelector />
          <AppearanceSelector />
          <LanguagesSelector />
          <EnglishSkillSelector />
          <EthnicitySelector />
          <DoYouSmokeSelector />
          <DrinkingSelector />
          <KidsSelector />
          <LookingForSelector />
          <NetWorthSelector />
        </View>
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            backgroundColor: themeColors.background,
            borderTopColor: themeColors.divider,
            marginBottom: bottomMargin,
          },
        ]}
      >
        <SaveButton onPress={handleSave} loading={loading} />
      </View>
      {AlertComponent}
    </SafeAreaView>
  );
};

export default MoreInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    paddingBottom: 10,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 10,
  },
});


