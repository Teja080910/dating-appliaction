import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = (route.params as any) || { type: 'privacy' };

  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';
  const url = isPrivacy ? 'amara.app/privacy' : 'amara.app/terms';

  return (
    <SafeAreaView style={styles.container}>
      {/* Search/Browser Bar Style */}
      <View style={styles.browserBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="x" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.urlBar}>
          <Icon name="lock" size={14} color="#2ECC71" />
          <Text style={styles.urlText}>{url}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="more-horizontal" size={24} color="#000" />
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
              Personal data means any information about an individual from which that person can be identified. It does not include data where the identity has been removed (anonymous data).
              {"\n\n"}• <Bold>Identity Data:</Bold> includes first name, last name, username or similar identifier, marital status, title, date of birth and gender.
              {"\n"}• <Bold>Contact Data:</Bold> includes email address and telephone numbers.
              {"\n"}• <Bold>Technical Data:</Bold> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this application.
              {"\n"}• <Bold>Profile Data:</Bold> includes your username and password, purchases or orders made by you, your interests, preferences, profile photos and description.
            </Section>

            <Section title="3. How We Use Your Personal Data">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              {"\n\n"}• To register you as a new user.
              {"\n"}• To provide you with matching partner recommendations.
              {"\n"}• To manage our relationship with you.
              {"\n"}• To enable you to participate in community features.
            </Section>

            <Section title="4. Data Security">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </Section>

            <Section title="5. Data Retention">
              We will only retain your personal data for as long as necessary to fulfil the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
            </Section>

            <Section title="6. Your Legal Rights">
              Under certain circumstances, you have rights under data protection laws in relation to your personal data:
              {"\n\n"}• Request access to your personal data.
              {"\n"}• Request correction of your personal data.
              {"\n"}• Request erasure of your personal data.
              {"\n"}• Object to processing of your personal data.
              {"\n"}• Request restriction of processing your personal data.
              {"\n"}• Request transfer of your personal data.
              {"\n"}• Right to withdraw consent.
            </Section>
          </>
        ) : (
          <>
            <Section title="1. Acceptance of Terms">
              By accessing the AMARA application, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this app.
            </Section>

            <Section title="2. Use License">
              Permission is granted to temporarily download one copy of the materials (information or software) on AMARA's application for personal, non-commercial transitory viewing only. 
              {"\n\n"}This is the grant of a license, not a transfer of title, and under this license you may not:
              {"\n"}• modify or copy the materials;
              {"\n"}• use the materials for any commercial purpose, or for any public display;
              {"\n"}• attempt to decompile or reverse engineer any software contained on AMARA's app;
              {"\n"}• remove any copyright or other proprietary notations from the materials; or
              {"\n"}• transfer the materials to another person or "mirror" the materials on any other server.
            </Section>

            <Section title="3. User Account Safety">
              AMARA is not responsible for any conduct off-app. Always exercise caution when meeting new people. Follow our safety guidelines.
            </Section>

            <Section title="4. Prohibited Content">
              You may not post content that:
              {"\n\n"}• is sexually explicit or pornographic;
              {"\n"}• contains hate speech, threats, or incitement of violence;
              {"\n"}• promotes illegal activities;
              {"\n"}• infringes on intellectual property rights.
            </Section>

            <Section title="5. Disclaimer">
              The materials on AMARA's app are provided on an 'as is' basis. AMARA makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </Section>

            <Section title="6. Governing Law">
              These terms and conditions are governed by and construed in accordance with the laws of your jurisdiction and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
            </Section>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Browser Footer Simulation */}
      <View style={styles.browserFooter}>
        <Icon name="chevron-left" size={24} color="#CCC" />
        <Icon name="chevron-right" size={24} color="#CCC" />
        <Icon name="share" size={24} color="#333" />
        <Icon name="refresh-cw" size={22} color="#333" />
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
  <Text style={{ fontWeight: 'bold', color: '#000' }}>{children}</Text>
);

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  browserBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  urlBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAEAEA',
    height: 36,
    borderRadius: 18,
    marginHorizontal: 15,
  },
  urlText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
    fontWeight: '500',
  },
  backButton: {
    width: 30,
  },
  moreButton: {
    width: 30,
  },
  content: {
    padding: 25,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF5A79',
    letterSpacing: 3,
    marginBottom: 5,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#999',
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  browserFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#F8F8F8',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
