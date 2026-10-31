import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, useTheme } from '../../theme';
import { t, useTranslation } from '../../i18n';

const PrivacyPolicyScreen = () => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = (route.params as any) || { type: 'privacy' };

  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? t('auth.forgotpasswordscreen.privacy_policy') : t('profile.privacypolicyscreen.terms_conditions');
  const url = isPrivacy ? t('profile.privacypolicyscreen.amara_app_privacy') : t('profile.privacypolicyscreen.amara_app_terms');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.background} />
      
      <View style={styles.browserBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="x" size={24} color={themeColors.text} />
        </TouchableOpacity>
        
        <View style={styles.urlBar}>
          <Icon name="lock" size={14} color={themeColors.success} />
          <Text style={styles.urlText}>{url}</Text>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="more-horizontal" size={24} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.logoTitle}>{t('home.homeheader.amara')}</Text>
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.lastUpdated}>{t('profile.privacypolicyscreen.last_updated_october_2023')}</Text>

        {isPrivacy ? (
          <>
            <Section title={t('profile.privacypolicyscreen.1_introduction')} styles={styles}>{t('profile.privacypolicyscreen.welcome_to_amara_we_respect_your_privacy_and_are_committed_to_protecti')}</Section>

            <Section title={t('profile.privacypolicyscreen.2_the_data_we_collect_about_you')} styles={styles}>
              Personal data means any information about an individual from which that person can be identified.
              {"\n\n"}• <Bold styles={styles}>{t('profile.privacypolicyscreen.identity_data')}</Bold> includes username, marital status, title, date of birth and gender.
              {"\n"}• <Bold styles={styles}>{t('profile.privacypolicyscreen.contact_data')}</Bold> includes email address and telephone numbers.
              {"\n"}• <Bold styles={styles}>{t('profile.privacypolicyscreen.technical_data')}</Bold> includes IP address, login data, device info.
              {"\n"}• <Bold styles={styles}>{t('profile.privacypolicyscreen.profile_data')}</Bold>{t('profile.privacypolicyscreen.includes_interests_preferences_and_photos')}</Section>

            <Section title={t('profile.privacypolicyscreen.3_how_we_use_your_data')} styles={styles}>{t('profile.privacypolicyscreen.we_use_your_data_mainly_to_provide_you_with_matching_partner_recommend')}</Section>

            <Section title={t('profile.privacypolicyscreen.4_data_retention')} styles={styles}>{t('profile.privacypolicyscreen.we_retain_your_personal_data_only_as_long_as_necessary_to_fulfil_the_p')}</Section>
          </>
        ) : (
          <>
            <Section title={t('profile.privacypolicyscreen.1_acceptance_of_terms')} styles={styles}>{t('profile.privacypolicyscreen.by_accessing_the_amara_application_you_are_agreeing_to_be_bound_by_the')}</Section>

            <Section title={t('profile.privacypolicyscreen.2_use_license')} styles={styles}>{t('profile.privacypolicyscreen.permission_is_granted_to_use_materials_on_amaras_app_for_personal_non')}</Section>

            <Section title={t('profile.privacypolicyscreen.3_safety')} styles={styles}>{t('profile.privacypolicyscreen.always_exercise_caution_when_meeting_new_people_follow_our_safety_guid')}</Section>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.browserFooter}>
        <Icon name="chevron-left" size={24} color={themeColors.textMuted} />
        <Icon name="chevron-right" size={24} color={themeColors.textMuted} />
        <Icon name="share" size={24} color={themeColors.textSecondary} />
        <Icon name="refresh-cw" size={22} color={themeColors.textSecondary} />
      </View>
    </SafeAreaView>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
  styles: any;
}

const Section = ({ title, children, styles }: SectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionHeader}>{title}</Text>
    <Text style={styles.bodyText}>{children}</Text>
  </View>
);

const Bold = ({ children, styles }: { children: React.ReactNode; styles: any }) => (
  <Text style={{ fontWeight: 'bold', color: styles.boldText?.color }}>{children}</Text>
);

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    browserBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderLight,
    },
    urlBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.inputBackground,
      height: 36,
      borderRadius: 18,
      marginHorizontal: Spacing.lg,
    },
    urlText: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginLeft: 6,
      fontWeight: '500',
    },
    backButton: { width: 30 },
    moreButton: { width: 30 },
    content: { padding: Spacing.xl },
    logoTitle: {
      fontSize: 32,
      fontWeight: '900',
      color: themeColors.primary,
      letterSpacing: 3,
      marginBottom: 5,
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 10,
    },
    lastUpdated: {
      fontSize: 14,
      color: themeColors.textMuted,
      marginBottom: 30,
    },
    section: { marginBottom: Spacing.xl },
    sectionHeader: {
      fontSize: 18,
      fontWeight: '800',
      color: themeColors.text,
      marginBottom: 12,
    },
    bodyText: {
      fontSize: 16,
      color: themeColors.textSecondary,
      lineHeight: 24,
    },
    boldText: {
      color: themeColors.text,
    },
    browserFooter: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: 60,
      borderTopWidth: 1,
      borderTopColor: themeColors.borderLight,
      backgroundColor: themeColors.surface,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
  });

export default PrivacyPolicyScreen;
