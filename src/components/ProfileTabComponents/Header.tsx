import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Header = () => {
  const { isSubscribed } = useContext(AppContext);

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>AMARA</Text>
      {isSubscribed && (
        <View style={styles.premiumBadge}>
            <LinearGradient 
              colors={['#FFD700', '#FFA500']} 
              style={styles.badgeGradient}
              start={{x: 0, y: 0}} end={{x: 1, y: 0}}
            >
                <Icon name="crown" size={12} color="#000" style={{marginRight: 4}} />
                <Text style={styles.badgeText}>AMARA PREMIUM</Text>
            </LinearGradient>
        </View>
      )}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FF5A79', // Amara Theme color
    letterSpacing: 2,
  },
  premiumBadge: {
      marginLeft: 10,
      borderRadius: 12,
      overflow: 'hidden',
  },
  badgeGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
  },
  badgeText: {
      fontSize: 10,
      fontWeight: '900',
      color: '#000',
      letterSpacing: 0.5,
  }
});
