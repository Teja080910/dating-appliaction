import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import React, { useContext, useState } from 'react';
import AppContext from '../../../context/CreateGlobalStateContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';

const UserDetails = () => {
  const { 
    name, 
    date, 
    viewMyProfile, 
    cardUserName, 
    cardUserAge,
    selectedUserImage,
    height,
    englishSkillLevel,
    selectedEthinicity,
    selectedSmoking,
    selectedKidCount,
    setInvitations,
    invitations,
    setPaywallVisible,
    isSubscribed
  } = useContext(AppContext);

  const [inviting, setInviting] = useState(false);

  const currentYear = new Date().getFullYear();
  const myAge = currentYear - date.getFullYear();

  const displayName = viewMyProfile ? name : cardUserName;
  const displayAge = viewMyProfile ? myAge : cardUserAge;

  // Check if this user is already invited
  const isAlreadyInvited = invitations?.some((inv: any) => inv.name === displayName);

  const handleInvite = () => {
    // TRIGGER PAYWALL if not subscribed
    if (!isSubscribed) {
        setPaywallVisible(true);
        return;
    }

    if (isAlreadyInvited) {
        Toast.show({ type: 'info', text1: 'Already invited!' });
        return;
    }

    setInviting(true);
    // Simulate API call
    setTimeout(() => {
        setInviting(false);
        
        const newInvite = {
            id: Date.now().toString(),
            name: displayName || "Guest",
            age: displayAge || 25,
            image: selectedUserImage,
            status: 'Pending',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setInvitations([newInvite, ...invitations]);

        Toast.show({
            type: 'success',
            text1: 'Invitation Sent!',
            text2: `You invited ${displayName || "Radha"} to connect.`,
            position: 'top',
        });
    }, 1200);
  };

  const handleReport = () => {
      Alert.alert(
          "Report Profile",
          "Are you sure you want to report or block this user?",
          [
              { text: "Cancel", style: "cancel" },
              { text: "Report", style: "destructive", onPress: () => {
                  Toast.show({ type: 'info', text1: 'Profile reported successfully.' });
              }}
          ]
      );
  }

  const DetailPill = ({ icon, text }: { icon: string, text: string }) => (
    <View style={styles.pill}>
      <Icon name={icon} size={18} color="#FF5A79" style={styles.pillIcon} />
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );

  const InterestTag = ({ text }: { text: string }) => (
      <View style={styles.interestTag}>
          <Text style={styles.interestText}>#{text}</Text>
      </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerArea}>
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>{displayName || "Radha singh"}, {displayAge || "25"}</Text>
          <Icon name="check-decagram" size={24} color="#FF5A79" style={styles.verifiedIcon} />
        </View>
        
        <View style={styles.statusRow}>
            <View style={styles.statusItem}>
                <Feather name="clock" size={12} color="#AAA" />
                <Text style={styles.statusText}>Active today</Text>
            </View>
            <View style={styles.statusItem}>
                <Feather name="navigation" size={12} color="#AAA" />
                <Text style={styles.statusText}>Malihabad, 13 km away</Text>
            </View>
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.section}>
          <Text style={styles.sectionTitle}>About me</Text>
          <Text style={styles.bioText}>
              I'm a passionate traveler and someone who loves exploring new cultures and cuisines. 
              Looking for someone who is honest, adventurous and has a great sense of humor. 
              Let's connect and see where it goes! ✨
          </Text>
      </View>

      {/* More Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>More info</Text>
        <View style={styles.pillsContainer}>
          <DetailPill icon="emoticon-happy-outline" text="Attractive" />
          <DetailPill icon="ruler" text={`${height || '171'} cm`} />
          <DetailPill icon="human-handsup" text="Slim" />
          <DetailPill icon="ear-hearing" text={englishSkillLevel || "Medium English"} />
          <DetailPill icon="account-outline" text={selectedEthinicity || "Indian"} />
          <DetailPill icon="smoking-off" text="Non-Smoker" />
          <DetailPill icon="baby-face-outline" text={`Kids: ${selectedKidCount || "0"}`} />
        </View>
      </View>

      {/* Interests Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.interestsContainer}>
            <InterestTag text="Travel" />
            <InterestTag text="Music" />
            <InterestTag text="Cooking" />
            <InterestTag text="Photography" />
            <InterestTag text="Fitness" />
            <InterestTag text="Art" />
        </View>
      </View>

      {/* Looking for Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Looking for</Text>
        <View style={styles.pillsContainer}>
          <DetailPill icon="glass-cocktail" text="Hookup" />
          <DetailPill icon="heart-outline" text="Relationship" />
          <DetailPill icon="ring" text="Marriage" />
        </View>
      </View>

      {/* Languages Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Languages</Text>
        <View style={styles.pillsContainer}>
           <View style={styles.pill}>
             <Text style={styles.flag}>🇺🇸</Text>
             <Text style={styles.pillText}>English</Text>
           </View>
           <View style={styles.pill}>
             <Text style={styles.flag}>🇮🇳</Text>
             <Text style={styles.pillText}>Hindi</Text>
           </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.reportBtn} 
            onPress={handleReport}
          >
               <Icon name="alert-octagon-outline" size={18} color="#FF5A79" />
               <Text style={styles.reportText}>Report / block this profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.9} 
            style={[styles.inviteBtn, (inviting || isAlreadyInvited) && styles.disabledBtn]} 
            onPress={handleInvite}
            disabled={inviting || isAlreadyInvited}
          >
               {inviting ? (
                   <ActivityIndicator color="#fff" />
               ) : (
                   <>
                        <Icon name={isAlreadyInvited ? "check-all" : "heart-flash"} size={22} color="#fff" style={styles.inviteIcon} />
                        <Text style={styles.inviteText}>{isAlreadyInvited ? "Invited" : "Invite Now"}</Text>
                   </>
               )}
          </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />
    </View>
  );
};

export default UserDetails;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 25,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    paddingTop: 35,
  },
  headerArea: {
      marginBottom: 35,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
  },
  verifiedIcon: {
    marginLeft: 12,
  },
  statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
  },
  statusItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
  },
  statusText: {
      fontSize: 14,
      color: '#999',
      fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
    marginBottom: 16,
  },
  bioText: {
      fontSize: 16,
      color: '#555',
      lineHeight: 24,
      fontWeight: '500',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
      backgroundColor: '#FFF2F4',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
  },
  interestText: {
      color: '#FF5A79',
      fontSize: 14,
      fontWeight: '700',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF5A79',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  pillIcon: {
    marginRight: 8,
  },
  flag: {
      fontSize: 18,
      marginRight: 10,
  },
  pillText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '700',
  },
  actionSection: {
      gap: 18,
      marginTop: 15,
  },
  reportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 56,
      borderRadius: 15,
      borderWidth: 1.5,
      borderColor: '#F0F0F0',
      gap: 10,
  },
  reportText: {
      color: '#888',
      fontSize: 15,
      fontWeight: '600',
  },
  inviteBtn: {
      backgroundColor: '#FF5A79',
      height: 66,
      borderRadius: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      shadowColor: '#FF5A79',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
  },
  disabledBtn: {
      backgroundColor: '#BDBDBD',
      shadowOpacity: 0,
      elevation: 0,
  },
  inviteIcon: {
      transform: [{ rotate: '-15deg' }],
  },
  inviteText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '900',
  },
});
