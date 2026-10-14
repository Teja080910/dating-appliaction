import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from '../../utils/types/navigation.types';
import { Colors, Spacing, useTheme, ThemeColors } from '../../theme';
import { t, useTranslation } from '../../i18n';

interface StepItem {
  number: string;
  icon: string;
  title: string;
  description: string;
  tag?: string;
}

const getMenSteps = (): StepItem[] => [
  {
    number: '01',
    icon: 'shield-lock-outline',
    title: t('profile.howtousescreen.100_private_profile'),
    description:
      t('profile.howtousescreen.your_profile_is_completely_hidden_from_the_public_feed_women_cannot_se'),
    tag: t('profile.howtousescreen.privacy_first'),
  },
  {
    number: '02',
    icon: 'email-send-outline',
    title: t('profile.howtousescreen.send_date_invitations'),
    description:
      t('profile.howtousescreen.browse_verified_female_profiles_nearby_or_worldwide_find_someone_you_l'),
    tag: t('profile.howtousescreen.invitation_only'),
  },
  {
    number: '03',
    icon: 'check-decagram-outline',
    title: t('profile.howtousescreen.review_acceptance'),
    description:
      t('profile.howtousescreen.when_the_woman_receives_your_invitation_she_reviews_your_profile_photo'),
    tag: t('profile.howtousescreen.mutual_interest'),
  },
  {
    number: '04',
    icon: 'send-circle-outline',
    title: t('profile.howtousescreen.connect_on_telegram'),
    description:
      t('profile.howtousescreen.no_endless_in_app_small_talk_once_she_accepts_both_of_your_telegram_ha'),
    tag: t('profile.howtousescreen.direct_contact'),
  },
];

const getWomenSteps = (): StepItem[] => [
  {
    number: '01',
    icon: 'crown-outline',
    title: t('profile.howtousescreen.100_free_for_women'),
    description:
      t('profile.howtousescreen.amara_is_completely_free_for_all_female_members_you_will_never_be_aske'),
    tag: t('profile.howtousescreen.always_free'),
  },
  {
    number: '02',
    icon: 'shield-check-outline',
    title: t('profile.howtousescreen.zero_spam_or_creepy_dms'),
    description:
      t('profile.howtousescreen.say_goodbye_to_hundreds_of_unwanted_messages_men_cannot_message_you_di'),
    tag: t('profile.howtousescreen.spam_free_inbox'),
  },
  {
    number: '03',
    icon: 'hand-heart-outline',
    title: t('profile.howtousescreen.you_are_always_in_control'),
    description:
      t('profile.howtousescreen.invitations_arrive_in_your_requests_inbox_review_their_verified_profil'),
    tag: t('profile.howtousescreen.your_choice'),
  },
  {
    number: '04',
    icon: 'send-circle-outline',
    title: t('profile.howtousescreen.chat_directly_on_telegram'),
    description:
      t('profile.howtousescreen.when_you_accept_an_invite_your_telegram_handle_is_shared_with_your_mat'),
    tag: t('profile.howtousescreen.fast_safe'),
  },
];

const getFaqs = () => [
  {
    question: t('profile.howtousescreen.why_are_mens_profiles_hidden_by_default'),
    answer:
      t('profile.howtousescreen.amara_follows_a_private_luxury_model_many_successful_ambitious_men_val'),
  },
  {
    question: t('profile.howtousescreen.why_do_matches_move_to_telegram'),
    answer:
      t('profile.howtousescreen.we_believe_dating_should_lead_to_real_life_meetings_not_endless_in_app'),
  },
  {
    question: t('profile.howtousescreen.how_does_selfie_verification_work'),
    answer:
      t('profile.howtousescreen.every_member_must_complete_a_real_time_selfie_verification_during_onbo'),
  },
  {
    question: t('profile.howtousescreen.what_is_our_policy_on_sugar_dating_escorting'),
    answer:
      t('profile.howtousescreen.amara_strictly_prohibits_compensated_dating_sugar_arrangements_prostit'),
  },
];

const HowToUseScreen = () => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const [activeTab, setActiveTab] = useState<'men' | 'women'>('men');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const steps = activeTab === 'men' ? getMenSteps() : getWomenSteps();

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="arrow-left" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.howtousescreen.how_amara_works')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadge}>
            <Icon name="diamond-stone" size={16} color={Colors.primary} />
            <Text style={styles.heroBadgeText}>{t('profile.howtousescreen.exclusive_dating_experience')}</Text>
          </View>
          <Text style={styles.heroTitle}>{t('profile.howtousescreen.dating_built_for_real_life')}</Text>
          <Text style={styles.heroSubtitle}>{t('profile.howtousescreen.no_endless_swiping_no_spam_just_verified_singles_connecting_for_real_d')}</Text>
        </View>

        {/* Gender / Role Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'men' && styles.tabButtonActive]}
            onPress={() => setActiveTab('men')}
            activeOpacity={0.8}
          >
            <Icon
              name="gender-male"
              size={18}
              color={activeTab === 'men' ? Colors.white : themeColors.textMuted}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'men' && styles.tabButtonTextActive,
              ]}
            >{t('profile.howtousescreen.for_men')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'women' && styles.tabButtonActive]}
            onPress={() => setActiveTab('women')}
            activeOpacity={0.8}
          >
            <Icon
              name="gender-female"
              size={18}
              color={activeTab === 'women' ? Colors.white : themeColors.textMuted}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'women' && styles.tabButtonTextActive,
              ]}
            >{t('profile.howtousescreen.for_women')}</Text>
          </TouchableOpacity>
        </View>

        {/* Step-by-Step Flow Cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'men' ? t('profile.howtousescreen.how_it_works_for_men') : t('profile.howtousescreen.how_it_works_for_women')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {activeTab === 'men'
              ? t('profile.howtousescreen.private_discreet_and_direct_invitation_process')
              : t('profile.howtousescreen.safe_spam_free_and_100_free_forever')}
          </Text>
        </View>

        <View style={styles.stepsList}>
          {steps.map((step) => (
            <View key={step.number} style={styles.stepCard}>
              <View style={styles.stepCardHeader}>
                <View style={styles.stepIconWrap}>
                  <Icon name={step.icon} size={22} color={Colors.primary} />
                </View>
                {step.tag ? (
                  <View style={styles.stepTag}>
                    <Text style={styles.stepTagText}>{step.tag}</Text>
                  </View>
                ) : null}
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>

              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          ))}
        </View>

        {/* Safety & Quality Pledge */}
        <View style={styles.pledgeCard}>
          <View style={styles.pledgeIconWrap}>
            <Icon name="shield-check" size={26} color={Colors.success} />
          </View>
          <Text style={styles.pledgeTitle}>{t('profile.howtousescreen.our_community_standards')}</Text>
          <View style={styles.pledgePoints}>
            <View style={styles.pledgeRow}>
              <Icon name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.pledgeText}>
                <Text style={styles.boldText}>{t('profile.howtousescreen.photo_verified')}</Text>{t('profile.howtousescreen.every_profile_completes_a_live_gesture_selfie')}</Text>
            </View>
            <View style={styles.pledgeRow}>
              <Icon name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.pledgeText}>
                <Text style={styles.boldText}>{t('profile.howtousescreen.no_commercial_dating')}</Text>{t('profile.howtousescreen.escorts_prostitution_and_sugar_dating_are_strictly_prohibited')}</Text>
            </View>
            <View style={styles.pledgeRow}>
              <Icon name="check-circle" size={16} color={Colors.success} />
              <Text style={styles.pledgeText}>
                <Text style={styles.boldText}>{t('profile.howtousescreen.high_quality')}</Text>{t('profile.howtousescreen.profiles_with_low_photo_quality_or_abusive_behavior_are_removed')}</Text>
            </View>
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.howtousescreen.frequently_asked_questions')}</Text>
          <Text style={styles.sectionSubtitle}>{t('profile.howtousescreen.common_questions_about_using_the_amara_dating_platform')}</Text>
        </View>

        <View style={styles.faqList}>
          {getFaqs().map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <TouchableOpacity
                key={faq.question}
                style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
                onPress={() => toggleFaq(index)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Icon
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </View>
                {isExpanded && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HowToUseScreen;

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.text,
      letterSpacing: 0.3,
    },
    placeholder: {
      width: 40,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl + 20,
    },
    heroBanner: {
      marginTop: Spacing.lg,
      padding: Spacing.xl,
      borderRadius: Spacing.radiusXl,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      alignItems: 'center',
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: Spacing.radiusFull,
      backgroundColor: 'rgba(255, 75, 114, 0.12)',
      marginBottom: Spacing.sm,
    },
    heroBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: Colors.primary,
      letterSpacing: 0.8,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: themeColors.text,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    heroSubtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: themeColors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: themeColors.surfaceLighter,
      borderRadius: Spacing.radiusLg,
      padding: 4,
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: Spacing.radiusMd,
    },
    tabButtonActive: {
      backgroundColor: Colors.primary,
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textMuted,
    },
    tabButtonTextActive: {
      color: Colors.white,
      fontWeight: '700',
    },
    sectionHeader: {
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 2,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    stepsList: {
      gap: Spacing.md,
    },
    stepCard: {
      backgroundColor: themeColors.surface,
      borderRadius: Spacing.radiusLg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    stepCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    stepIconWrap: {
      width: 40,
      height: 40,
      borderRadius: Spacing.radiusMd,
      backgroundColor: 'rgba(255, 75, 114, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepTag: {
      backgroundColor: themeColors.surfaceLighter,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Spacing.radiusSm,
    },
    stepTagText: {
      fontSize: 9,
      fontWeight: '800',
      color: themeColors.textSecondary,
      letterSpacing: 0.5,
    },
    stepNumberText: {
      fontSize: 16,
      fontWeight: '800',
      color: themeColors.textMuted,
    },
    stepTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 6,
    },
    stepDescription: {
      fontSize: 13,
      lineHeight: 19,
      color: themeColors.textSecondary,
    },
    pledgeCard: {
      marginTop: Spacing.xl,
      backgroundColor: themeColors.surface,
      borderRadius: Spacing.radiusXl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(74, 222, 128, 0.2)',
    },
    pledgeIconWrap: {
      width: 44,
      height: 44,
      borderRadius: Spacing.radiusFull,
      backgroundColor: 'rgba(74, 222, 128, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    pledgeTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: Spacing.md,
    },
    pledgePoints: {
      gap: Spacing.sm + 2,
    },
    pledgeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    pledgeText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: themeColors.textSecondary,
    },
    boldText: {
      color: themeColors.text,
      fontWeight: '600',
    },
    faqList: {
      gap: Spacing.sm,
    },
    faqCard: {
      backgroundColor: themeColors.surface,
      borderRadius: Spacing.radiusMd,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    faqCardExpanded: {
      borderColor: 'rgba(255, 75, 114, 0.3)',
    },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    faqQuestion: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.text,
    },
    faqAnswer: {
      fontSize: 13,
      lineHeight: 19,
      color: themeColors.textSecondary,
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
  });

