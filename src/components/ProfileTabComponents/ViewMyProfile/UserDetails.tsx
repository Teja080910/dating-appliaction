import { StyleSheet, Text, View, Linking, TouchableOpacity } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import AppContext from '../../../context/CreateGlobalStateContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ProfileResponse, ConnectionRequest } from '../../../api/types';
import { connectionsApi } from '../../../api/connectionsApi';
import { AuthStorage } from '../../../api/authStorage';

interface UserDetailsProps {
  connectionAccepted?: boolean;
  profileData?: ProfileResponse | null;
  connectionData?: ConnectionRequest | null;
}

const UserDetails = ({ connectionAccepted, profileData }: UserDetailsProps) => {
  const { cardUserName, cardUserAge } = useContext(AppContext);
  const [contactInfo, setContactInfo] = useState<{ mobile?: string; telegram?: string; email?: string }>({});

  useEffect(() => {
    if (connectionAccepted) {
      fetchContactInfo();
    }
  }, [connectionAccepted]);

  const fetchContactInfo = async () => {
    if (!profileData?.id) return;
    try {
      const myId = await AuthStorage.getUserIdStr();
      if (!myId) return;
      const connections = await connectionsApi.getConnections(myId);
      const profileUserId = String(profileData.id);
      const matched = connections.find(
        (c: ConnectionRequest) =>
          (c.sender?.userId === myId && c.receiver?.userId === profileUserId) ||
          (c.sender?.userId === profileUserId && c.receiver?.userId === myId)
      );
      if (matched && matched.status === 'ACCEPTED') {
        const otherUser = matched.sender?.userId === profileUserId ? matched.sender : matched.receiver;
        setContactInfo({
          mobile: otherUser?.mobile || profileData.email || '',
          telegram: otherUser?.telegramUsername || '',
          email: profileData?.email || '',
        });
      }
    } catch {}
  };

  const displayName = profileData?.displayName || profileData?.name || cardUserName || '';
  const displayAge = cardUserAge || '';
  const displayBio = profileData?.bio || '';

  const handlePhone = () => {
    if (contactInfo.mobile) {
      Linking.openURL(`tel:${contactInfo.mobile}`);
    }
  };

  const handleTelegram = () => {
    if (contactInfo.telegram) {
      const tg = contactInfo.telegram.replace('@', '');
      Linking.openURL(`https://t.me/${tg}`);
    }
  };

  const handleWhatsApp = () => {
    if (contactInfo.mobile) {
      Linking.openURL(`https://wa.me/${contactInfo.mobile.replace(/[^0-9]/g, '')}`);
    }
  };

  const handleEmail = () => {
    if (contactInfo.email) {
      Linking.openURL(`mailto:${contactInfo.email}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.nameText}>{displayName},</Text>
        {displayAge ? <Text style={styles.ageText}>{displayAge}</Text> : null}
        <Icon name="check-decagram" size={18} color="#E9446A" style={styles.icon} />
      </View>

      {displayBio ? (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsHeading}>Details</Text>
          <Text style={styles.detailsText}>{displayBio}</Text>
        </View>
      ) : null}

      {profileData ? (
        <View style={styles.profileInfoSection}>
          {profileData.language ? (
            <Text style={styles.infoText}>Language: {profileData.language}</Text>
          ) : null}
          {profileData.height ? (
            <Text style={styles.infoText}>Height: {profileData.height} cm</Text>
          ) : null}
          {profileData.bodyType ? (
            <Text style={styles.infoText}>Body Type: {profileData.bodyType}</Text>
          ) : null}
          {profileData.appearance ? (
            <Text style={styles.infoText}>Appearance: {profileData.appearance}</Text>
          ) : null}
          {profileData.ethnicity ? (
            <Text style={styles.infoText}>Ethnicity: {profileData.ethnicity}</Text>
          ) : null}
          {profileData.englishLevel ? (
            <Text style={styles.infoText}>English: {profileData.englishLevel}</Text>
          ) : null}
          {profileData.smoke ? (
            <Text style={styles.infoText}>Smoke: {profileData.smoke}</Text>
          ) : null}
          {profileData.drink ? (
            <Text style={styles.infoText}>Drink: {profileData.drink}</Text>
          ) : null}
        </View>
      ) : null}

      {connectionAccepted ? (
        <View style={styles.contactSection}>
          <Text style={styles.detailsHeading}>Contact Information</Text>

          {contactInfo.mobile ? (
            <TouchableOpacity style={styles.contactRow} onPress={handlePhone}>
              <Icon name="phone" size={18} color="#4CAF50" />
              <Text style={styles.contactText}>{contactInfo.mobile}</Text>
            </TouchableOpacity>
          ) : null}

          {contactInfo.mobile ? (
            <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp}>
              <Icon name="whatsapp" size={18} color="#25D366" />
              <Text style={styles.contactText}>WhatsApp: {contactInfo.mobile}</Text>
            </TouchableOpacity>
          ) : null}

          {contactInfo.telegram ? (
            <TouchableOpacity style={styles.contactRow} onPress={handleTelegram}>
              <Icon name="telegram" size={18} color="#0088cc" />
              <Text style={styles.contactText}>Telegram: @{contactInfo.telegram}</Text>
            </TouchableOpacity>
          ) : null}

          {contactInfo.email ? (
            <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
              <Icon name="email" size={18} color="#FF5722" />
              <Text style={styles.contactText}>{contactInfo.email}</Text>
            </TouchableOpacity>
          ) : null}

          {!contactInfo.mobile && !contactInfo.telegram && !contactInfo.email ? (
            <Text style={styles.noContactText}>Contact information shared after acceptance</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 10, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  nameText: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  ageText: { fontSize: 22, color: '#666', marginLeft: 4 },
  icon: { marginLeft: 6, marginTop: 2 },
  detailsSection: { marginTop: 20 },
  detailsHeading: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  detailsText: { fontSize: 16, color: '#444', lineHeight: 22 },
  profileInfoSection: { marginTop: 12 },
  infoText: { fontSize: 15, color: '#555', marginBottom: 4 },
  contactSection: { marginTop: 20, backgroundColor: '#f0f8f0', padding: 16, borderRadius: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  contactText: { marginLeft: 10, fontSize: 15, color: '#333' },
  noContactText: { fontSize: 14, color: '#888', fontStyle: 'italic' },
});

export default UserDetails;
