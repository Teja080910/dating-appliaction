import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import AvatarGroup from '../../components/MessageTabComponents/AvatarGroup';
import InviteButton from '../../components/MessageTabComponents/InviteButton';
import { getGender } from '../../utils/types/AsyncStorage'; // or wherever you defined it
import AppContext from '../../context/CreateGlobalStateContext';

export default function InvitationsScreen() {
  const { oppositeGender, setOppositeGender } = useContext(AppContext);

  useEffect(() => {
    const fetchGender = async () => {
      const gender = await getGender();
      console.log("gender in home:", gender);
      if (gender === 'straight_woman') {
        setOppositeGender('straight_man');
      } else if (gender === 'straight_man') {
        setOppositeGender('straight_woman');
      } else {
        setOppositeGender('lgbtqia');
      }
    };
    fetchGender();
  }, []);

  const isLookingForWoman = oppositeGender === 'straight_woman';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/MessageTabImages/envelope.png')} style={styles.icon} />
        <Text style={styles.title}>Invitations</Text>
      </View>

      <AvatarGroup gender={oppositeGender} />

      <Text style={styles.message}>
        You didn't invite anybody yet. Don't lose time.{"\n"}
        Invite somebody today!
      </Text>

      <Text style={styles.subtext}>
        When {isLookingForWoman ? "she" : "he"} accepts your invitation, you can contact{"\n"}
        {isLookingForWoman ? "her" : "him"} on Whatsapp or Telegram. Only a {isLookingForWoman ? "woman" : "man"} you{"\n"}
        invited can see your profile.
      </Text>

      <InviteButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  message: {
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: '500',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
});
