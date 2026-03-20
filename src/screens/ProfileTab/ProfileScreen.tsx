import { useContext, useEffect } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import { ScrollView, StyleSheet, Text, View, Alert, Linking } from 'react-native';
import Header from '../../components/ProfileTabComponents/Header';
import AdditionalUploadSection from '../../components/ProfileTabComponents/AdditionalUploadSection';
import ModalAddPhoto from '../../components/UploadImageComponents/ModalAddPhoto';
import ProfileRow from '../../components/ProfileTabComponents/ProfileRow';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootParamList } from '../../utils/types/navigation.types';
import { StackNavigationProp } from '@react-navigation/stack';

const ProfileScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootParamList>>();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['isLoggedIn', 'entryHomeScreen', 'isRegistered', 'acceptedTerms', 'GenderOrientation']);
              navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Register' }] }));
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleDeleteProfile = async () => {
    Alert.alert(
      "Delete Profile",
      "Are you sure you want to permanently delete your profile? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Profile",
          onPress: async () => {
             Alert.alert(
               "Final Warning",
               "All your matches, photos, and messages will be lost forever. Still proceed?",
               [
                 { text: "No", style: "cancel" },
                 {
                   text: "Yes, Delete Everything",
                   onPress: async () => {
                     try {
                       await AsyncStorage.clear();
                       Alert.alert("Profile Deleted", "Your account and data have been successfully removed.");
                       navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Register' }] }));
                     } catch (error) {
                       console.error('Delete error:', error);
                     }
                   },
                   style: "destructive"
                 }
               ]
             );
          },
          style: "destructive"
        }
      ]
    );
  };

  const openTelegram = async () => {
    const telegramUrl = 'https://t.me/telegram'; // Replace with actual support bot or channel
    Linking.openURL(telegramUrl).catch(() => {
        Alert.alert("Error", "Telegram is not installed or the link is invalid.");
    });
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PHOTOS SECTION */}
        <AdditionalUploadSection />
        <ModalAddPhoto />

        {/* ACCOUNT SETTINGS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <ProfileRow 
            title="Profile Settings" 
            iconName="user" 
            onPress={() => navigation.navigate('ProfileSettingsScreen')} 
          />
          <ProfileRow 
            title="View My Profile" 
            iconName="eye" 
            onPress={() => navigation.navigate('ViewMyProfileScreen')} 
          />
        </View>

        {/* SUPPORT SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Community</Text>
          <ProfileRow 
            title="Connect Telegram" 
            iconName="send" 
            color="#0088CC" 
            onPress={openTelegram} 
          />
          <ProfileRow 
            title="Chat with us" 
            iconName="message-circle" 
            color="#2ECC71" 
            onPress={() => Linking.openURL('mailto:support@amara.com')} 
          />
        </View>

        {/* LEGAL SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <ProfileRow 
            title="Privacy Policy" 
            iconName="shield" 
            color="#607D8B" 
            onPress={() => navigation.navigate('PrivacyPolicy', { type: 'privacy' })} 
          />
          <ProfileRow 
            title="Terms & Conditions" 
            iconName="file-text" 
            color="#607D8B" 
            onPress={() => navigation.navigate('PrivacyPolicy', { type: 'terms' })} 
          />
        </View>

        {/* DANGER ZONE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <ProfileRow 
            title="Logout" 
            iconName="log-out" 
            color="#FF5A79" 
            onPress={handleLogout} 
          />
          <ProfileRow 
            title="Delete My Profile" 
            iconName="trash-2" 
            color="#333" 
            onPress={handleDeleteProfile} 
          />
        </View>

        <Text style={styles.footerText}>AMARA - All Rights Reserved</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    textTransform: 'uppercase',
  },
  footerText: {
    textAlign: 'center',
    color: '#CCC',
    fontSize: 12,
    marginTop: 30,
    marginBottom: 20,
    letterSpacing: 1,
  },
});

export default ProfileScreen;