import { StyleSheet, Text, View } from 'react-native';
import React, { useContext } from 'react';
import AppContext from '../../../context/CreateGlobalStateContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const UserDetails = () => {
  const { viewMyProfile, name, cardUserName, cardUserAge, date, profileText } = useContext(AppContext);
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {viewMyProfile === true ? (
          <>
            <Text style={styles.nameText}>{name},</Text>
            <Text style={styles.ageText}>{currentYear - date.getFullYear()}</Text>
            <Icon name="check-decagram" size={18} color="#E9446A" style={styles.icon} />
          </>
        ) : (
          <>
            <Text style={styles.nameText}>{cardUserName},</Text>
            <Text style={styles.ageText}>{cardUserAge}</Text>
            <Icon name="check-decagram" size={18} color="#E9446A" style={styles.icon} />
          </>
        )}
      </View>

      {viewMyProfile === true && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsHeading}>Details</Text>
          <Text style={styles.detailsText}>{profileText}</Text>
        </View>
      )}
    </View>
  );
};

export default UserDetails;

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  ageText: {
    fontSize: 22,
    color: '#666',
    marginLeft: 4,
  },
  icon: {
    marginLeft: 6,
    marginTop: 2,
  },
  detailsSection: {
    marginTop: 20,
  },
  detailsHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 16,
    color: '#444',
  },
});
