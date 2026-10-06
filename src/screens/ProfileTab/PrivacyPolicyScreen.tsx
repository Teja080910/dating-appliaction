import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, useTheme } from '../../theme';

const PrivacyPolicyScreen = () => {
  const { themeColors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = (route.params as any) || { type: 'privacy' };

  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';
  const url = isPrivacy ? 'amara.app/privacy' : 'amara.app/terms';

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
        <Text style={styles.logoTitle}>AMARA</Text>
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.lastUpdated}>Last Updated: October 2023</Text>

        {isPrivacy ? (
          <>
            <Section title="1. Introduction" styles={styles}>
              Welcome to AMARA. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our application and tell you about your privacy rights and how the law protects you.
            </Section>

            <Section title="2. The Data We Collect About You" styles={styles}>
              Personal data means any information about an individual from which that person can be identified.
              {"\n\n"}• <Bold styles={styles}>Identity Data:</Bold> includes username, marital status, title, date of birth and gender.
              {"\n"}• <Bold styles={styles}>Contact Data:</Bold> includes email address and telephone numbers.
              {"\n"}• <Bold styles={styles}>Technical Data:</Bold> includes IP address, login data, device info.
              {"\n"}• <Bold styles={styles}>Profile Data:</Bold> includes interests, preferences, and photos.
            </Section>

            <Section title="3. How We Use Your Data" styles={styles}>
              We use your data mainly to provide you with matching partner recommendations and to register you as a new user.
            </Section>

            <Section title="4. Data Retention" styles={styles}>
              We retain your personal data only as long as necessary to fulfil the purposes we collected it for.
            </Section>
          </>
        ) : (
          <>
            <Section title="1. Acceptance of Terms" styles={styles}>
              By accessing the AMARA application, you are agreeing to be bound by these terms of service and all applicable laws.
            </Section>

            <Section title="2. Use License" styles={styles}>
              Permission is granted to use materials on AMARA's app for personal, non-commercial transitory viewing only.
            </Section>

            <Section title="3. Safety" styles={styles}>
              Always exercise caution when meeting new people. Follow our safety guidelines off-app.
            </Section>
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
