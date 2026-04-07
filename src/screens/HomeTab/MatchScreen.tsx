import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import useSubscriptionGate from '../../utils/useSubscriptionGate';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const avatarSize = Math.min(width * 0.34, 140);

const MatchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { requireSubscription } = useSubscriptionGate();
  
  // Params should include matched user details
  const { matchedUser } = route.params as any || {
    matchedUser: {
      name: 'User',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    }
  };

  // Add micro-animation effect here if using animated library

  return (
    <LinearGradient
      colors={['#2ECC71', '#27AE60']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.title}>It's a Match!</Text>
            <Text style={styles.subtitle}>You and {matchedUser.name} liked each other</Text>
            
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarWrapper, styles.myAvatar]}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop' }} 
                  style={styles.avatar}
                />
              </View>
              <View style={[styles.avatarWrapper, styles.theirAvatar]}>
                <Image 
                  source={{ uri: matchedUser.image }} 
                  style={styles.avatar}
                />
              </View>
            </View>
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => requireSubscription(() => navigation.goBack())}
              >
                <Icon name="message-circle" size={20} color="#E94057" style={styles.icon} />
                <Text style={styles.primaryButtonText}>Say Hello</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.secondaryButtonText}>Keep Swiping</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '8%',
    paddingVertical: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    fontStyle: 'italic',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 50,
    textAlign: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: avatarSize + 40,
    width: '100%',
    marginBottom: 60,
  },
  avatarWrapper: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
  },
  myAvatar: {
    zIndex: 1,
    marginRight: -20,
  },
  theirAvatar: {
    zIndex: 2,
    marginLeft: -20,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  primaryButton: {
    backgroundColor: '#fff',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#2ECC71',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 15,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MatchScreen;
