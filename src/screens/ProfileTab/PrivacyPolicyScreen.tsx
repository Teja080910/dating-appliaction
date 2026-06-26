import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../theme';

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = (route.params as any) || { type: 'privacy' };

  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';
  const url = isPrivacy ? 'amara.app/privacy' : 'amara.app/terms';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      <View style={styles.browserBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="x" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <View style={styles.urlBar}>
          <Icon name="lock" size={14} color={Colors.success} />
          <Text style={styles.urlText}>{url}</Text>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="more-horizontal" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.logoTitle}>AMARA</Text>
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.lastUpdated}>Last Updated: October 2023</Text>

        {isPrivacy ? (
          <>
            <Section title="1. Introduction">
              Welcome to AMARA. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our application and tell you about your privacy rights and how the law protects you.
            </Section>

            <Section title="2. The Data We Collect About You">
              Personal data means any information about an individual from which that person can be identified.
              {"\n\n"}• <Bold>Identity Data:</Bold> includes username, marital status, title, date of birth and gender.
              {"\n"}• <Bold>Contact Data:</Bold> includes email address and telephone numbers.
              {"\n"}• <Bold>Technical Data:</Bold> includes IP address, login data, device info.
              {"\n"}• <Bold>Profile Data:</Bold> includes interests, preferences, and photos.
            </Section>

            <Section title="3. How We Use Your Data">
              We use your data mainly to provide you with matching partner recommendations and to register you as a new user.
            </Section>

            <Section title="4. Data Retention">
              We retain your personal data only as long as necessary to fulfil the purposes we collected it for.
            </Section>
          </>
        ) : (
          <>
            <Section title="1. Acceptance of Terms">
              By accessing the AMARA application, you are agreeing to be bound by these terms of service and all applicable laws.
            </Section>

            <Section title="2. Use License">
              Permission is granted to use materials on AMARA's app for personal, non-commercial transitory viewing only.
            </Section>

            <Section title="3. Safety">
              Always exercise caution when meeting new people. Follow our safety guidelines off-app.
            </Section>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.browserFooter}>
        <Icon name="chevron-left" size={24} color={Colors.textMuted} />
        <Icon name="chevron-right" size={24} color={Colors.textMuted} />
        <Icon name="share" size={24} color={Colors.textSecondary} />
        <Icon name="refresh-cw" size={22} color={Colors.textSecondary} />
      </View>
    </SafeAreaView>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionHeader}>{title}</Text>
    <Text style={styles.bodyText}>{children}</Text>
  </View>
);

const Bold = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ fontWeight: 'bold', color: Colors.text }}>{children}</Text>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  browserBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  urlBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBackground,
    height: 36,
    borderRadius: 18,
    marginHorizontal: Spacing.lg,
  },
  urlText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  backButton: { width: 30 },
  moreButton: { width: 30 },
  content: { padding: Spacing.xl },
  logoTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 3,
    marginBottom: 5,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  lastUpdated: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 30,
  },
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  browserFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    backgroundColor: Colors.surface,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
});

export default PrivacyPolicyScreen;
