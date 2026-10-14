import React, { useContext, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { useTheme, ThemeColors } from '../../theme';
import { useTranslation } from '../../i18n';
import { useAlert } from '../../components/AlertModal';
import AppContext from '../../context/CreateGlobalStateContext';
import { useLocation } from '../../api/useLocation';
import { getCurrentLocation } from '../../utils/geolocation';

const STORAGE_CITY = '@amara_user_city';
const STORAGE_COUNTRY = '@amara_user_country';

// Known landmark cities fallback
const FALLBACK_CITIES = [
  { name: 'Udayapura', state: 'Karnataka', country: 'India', lat: 12.7937, lng: 77.5085 },
  { name: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lng: 77.5946 },
  { name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', state: 'Delhi', country: 'India', lat: 28.7041, lng: 77.1025 },
  { name: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lng: 73.8567 },
  { name: 'London', state: 'England', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', state: 'NY', country: 'United States', lat: 40.7128, lng: -74.006 },
  { name: 'Dubai', state: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
];

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const findNearestFallbackCity = (lat: number, lng: number) => {
  let nearest = FALLBACK_CITIES[0];
  let minDistance = Infinity;

  for (const c of FALLBACK_CITIES) {
    const dist = calculateDistanceKm(lat, lng, c.lat, c.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = c;
    }
  }

  return nearest;
};

const reverseGeocodeCoordinates = async (
  lat: number,
  lng: number
): Promise<{ city: string; country: string; state: string }> => {
  // 1. Try Nominatim reverse API
  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        timeout: 4000,
        headers: { 'User-Agent': 'AmaraApp/1.0' },
      }
    );
    const address = res.data?.address;
    if (address) {
      const city =
        address.suburb ||
        address.village ||
        address.town ||
        address.city ||
        address.county ||
        address.state_district ||
        '';
      const country = address.country || 'India';
      const state = address.state || '';
      if (city) {
        return { city, country, state };
      }
    }
  } catch {}

  // 2. Try Photon reverse API
  try {
    const res = await axios.get(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`,
      { timeout: 3000 }
    );
    const feature = res.data?.features?.[0];
    if (feature?.properties) {
      const props = feature.properties;
      const city = props.name || props.city || props.district || '';
      const country = props.country || 'India';
      const state = props.state || '';
      if (city) {
        return { city, country, state };
      }
    }
  } catch {}

  // 3. Fallback to nearest landmark city
  const nearest = findNearestFallbackCity(lat, lng);
  return {
    city: nearest.name,
    country: nearest.country,
    state: nearest.state,
  };
};

const ResetLocationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { themeColors, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);
  const { alert, AlertComponent } = useAlert();
  const { location, setLocation } = useContext(AppContext);
  const { addLocation, useCurrentLocation } = useLocation();
  const { data: currentLocationData } = useCurrentLocation();

  const [city, setCity] = useState<string>('Udayapura');
  const [country, setCountry] = useState<string>('India');
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize City & Country on mount
  useEffect(() => {
    const initLocation = async () => {
      try {
        const storedCity = await AsyncStorage.getItem(STORAGE_CITY);
        const storedCountry = await AsyncStorage.getItem(STORAGE_COUNTRY);

        if (storedCity && storedCountry) {
          setCity(storedCity);
          setCountry(storedCountry);
          return;
        }

        // Check backend current location
        if (currentLocationData?.city) {
          setCity(currentLocationData.city);
          setCountry(currentLocationData.country || 'India');
          return;
        }

        // Parse from AppContext location (e.g. "Mumbai, India")
        if (location && location.includes(',')) {
          const parts = location.split(',').map((p) => p.trim());
          if (parts[0] && parts[1]) {
            setCity(parts[0]);
            setCountry(parts[parts.length - 1]);
            return;
          }
        }
      } catch {}
    };

    void initLocation();
  }, [currentLocationData, location]);

  const handleResetLocation = async () => {
    try {
      setLoading(true);

      // 1. Fetch real GPS position
      const coords = await getCurrentLocation(true);

      // 2. Reverse geocode to City & Country
      const resolved = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
      const newCity = resolved.city || 'Udayapura';
      const newCountry = resolved.country || 'India';
      const newState = resolved.state || '';

      // 3. Update local state
      setCity(newCity);
      setCountry(newCountry);

      // 4. Update AsyncStorage & Global Context
      await AsyncStorage.setItem(STORAGE_CITY, newCity);
      await AsyncStorage.setItem(STORAGE_COUNTRY, newCountry);
      setLocation(`${newCity}, ${newCountry}`);

      // 5. Sync with backend API
      addLocation.mutate({
        city: newCity,
        state: newState,
        country: newCountry,
        lat: coords.latitude,
        lng: coords.longitude,
      });

      alert(
        t('profile.resetlocationscreen.location_updated'),
        t('profile.resetlocationscreen.your_location_has_been_updated_to_newcity_newcou', { newCity, newCountry })
      );
    } catch (err: any) {
      alert(
        t('search.location.location_error'),
        t('profile.resetlocationscreen.could_not_fetch_your_current_gps_location_please')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Feather
            name="chevron-left"
            size={28}
            color={themeColors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          {t('profile.resetlocationscreen.reset_location')}
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Location Icon Badge with Amara Signature Gradient */}
        <LinearGradient
          colors={[themeColors.primary, themeColors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Icon name="map-marker" size={46} color="#FFFFFF" />
        </LinearGradient>

        {/* Section Headline */}
        <Text style={[styles.headline, { color: themeColors.text }]}>
          {t('profile.userdetails.your_location')}
        </Text>

        {/* Location Card styled with theme surface and subtle border */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? themeColors.surface : themeColors.surfaceLight,
              borderColor: isDark ? 'rgba(124, 58, 237, 0.25)' : themeColors.borderLight,
            },
          ]}
        >
          {/* City Row */}
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: themeColors.textSecondary }]}>
              {t('profile.resetlocationscreen.city')}
            </Text>
            <Text style={[styles.cardValue, { color: themeColors.text }]}>
              {city}
            </Text>
          </View>

          {/* Card Divider */}
          <View
            style={[
              styles.cardDivider,
              { backgroundColor: themeColors.divider || (isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB') },
            ]}
          />

          {/* Country Row */}
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: themeColors.textSecondary }]}>
              {t('profile.resetlocationscreen.country')}
            </Text>
            <Text style={[styles.cardValue, { color: themeColors.text }]}>
              {country}
            </Text>
          </View>
        </View>

        {/* Explanation text */}
        <View style={styles.explanationContainer}>
          <Text style={[styles.explanationTitle, { color: themeColors.text }]}>
            {t('profile.resetlocationscreen.reset_your_location')}
          </Text>
          <Text
            style={[
              styles.explanationDesc,
              { color: themeColors.textSecondary },
            ]}
          >
            {t('profile.resetlocationscreen.only_do_this_if_youve_traveled')}
          </Text>
        </View>

        {/* Reset Location Action Button with Amara Gradient */}
        <TouchableOpacity
          style={[styles.resetButtonWrapper, loading && { opacity: 0.7 }]}
          onPress={handleResetLocation}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[themeColors.primary, themeColors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.resetButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.resetButtonText}>{t('profile.resetlocationscreen.reset_location')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {AlertComponent}
    </SafeAreaView>
  );
};

export default ResetLocationScreen;

const createStyles = (themeColors: ThemeColors, _isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      padding: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    headerRightSpacer: {
      width: 36,
    },
    content: {
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    iconCircle: {
      width: 92,
      height: 92,
      borderRadius: 46,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,
      marginBottom: 24,
      elevation: 6,
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    headline: {
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 32,
      letterSpacing: -0.3,
    },
    card: {
      width: '100%',
      borderRadius: 18,
      borderWidth: 1.5,
      overflow: 'hidden',
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 18,
    },
    cardLabel: {
      fontSize: 16,
      fontWeight: '500',
    },
    cardValue: {
      fontSize: 16,
      fontWeight: '700',
    },
    cardDivider: {
      height: 1,
      width: '100%',
    },
    explanationContainer: {
      alignItems: 'center',
      marginTop: 44,
      marginBottom: 36,
      paddingHorizontal: 12,
    },
    explanationTitle: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 8,
    },
    explanationDesc: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    resetButtonWrapper: {
      width: '100%',
      height: 52,
      borderRadius: 26,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
    resetButtonGradient: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 26,
    },
    resetButtonText: {
      color: '#FFFFFF',
      fontSize: 16.5,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  });
