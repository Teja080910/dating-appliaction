import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Shadows } from '../../theme';
import { useSubscription } from '../../api/useSubscription';

const Header = () => {
  const { isSubscribed } = useContext(AppContext);
  const { subscriptionStatus } = useSubscription();
  const planCode = String(subscriptionStatus?.plan || '').toUpperCase();
  const planLabel = planCode === 'PREMIUM' ? 'ELITE' : planCode === 'GOLD' ? 'PREMIUM' : 'STANDARD';

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>AMARA</Text>
      {isSubscribed && (
        <View style={styles.premiumBadge}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            style={styles.badgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="crown" size={12} color={Colors.white} style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>{planLabel}</Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 2,
  },
  premiumBadge: {
    marginLeft: Spacing.sm,
    borderRadius: Spacing.radiusFull,
    overflow: 'hidden',
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.5,
  },
});
