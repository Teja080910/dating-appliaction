import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
  Keyboard,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import OsmMapView from "./OsmMapView";
import type { MapRegion as Region } from "./OsmMapView";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import AppContext from "../../context/CreateGlobalStateContext";
import { getCurrentLocation } from "../../utils/geolocation";
import { useLocation } from "../../api/useLocation";
import { useTheme, ThemeColors, Spacing } from "../../theme";
import { useAlert } from "../AlertModal";
import { t, useTranslation } from '../../i18n';

export interface SavedLocationItem {
  id: string;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
}

export interface SuggestionItem {
  id: string;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
}

const STORAGE_SAVED_LOCATIONS = "@amara_saved_locations";
const STORAGE_ACTIVE_LOCATION_TYPE = "@amara_active_location_type";

// Comprehensive database of 120+ major Indian and international cities
const ALL_CITIES: SuggestionItem[] = [
  // India - Top Metros & Capitals
  { id: "hyd_in", name: "Hyderabad", fullAddress: "Hyderabad, Telangana, India", lat: 17.385, lng: 78.4867 },
  { id: "hyd_pk", name: "Hyderabad", fullAddress: "Hyderabad, Sindh, Pakistan", lat: 25.396, lng: 68.3578 },
  { id: "hyd_us", name: "Hyder", fullAddress: "Hyder, Alaska, United States", lat: 55.9172, lng: -130.0278 },
  { id: "hyd_up", name: "Hyderabad", fullAddress: "Hyderabad, Hasanganj, Unnao, Uttar Pradesh, India", lat: 26.6833, lng: 80.65 },
  { id: "mum", name: "Mumbai", fullAddress: "Mumbai, Maharashtra, India", lat: 19.076, lng: 72.8777 },
  { id: "del", name: "Delhi", fullAddress: "Delhi NCR, India", lat: 28.7041, lng: 77.1025 },
  { id: "blr", name: "Bengaluru", fullAddress: "Bengaluru, Karnataka, India", lat: 12.9716, lng: 77.5946 },
  { id: "chn", name: "Chennai", fullAddress: "Chennai, Tamil Nadu, India", lat: 13.0827, lng: 80.2707 },
  { id: "kol", name: "Kolkata", fullAddress: "Kolkata, West Bengal, India", lat: 22.5726, lng: 88.3639 },
  { id: "pun", name: "Pune", fullAddress: "Pune, Maharashtra, India", lat: 18.5204, lng: 73.8567 },
  { id: "amd", name: "Ahmedabad", fullAddress: "Ahmedabad, Gujarat, India", lat: 23.0225, lng: 72.5714 },
  { id: "jai", name: "Jaipur", fullAddress: "Jaipur, Rajasthan, India", lat: 26.9124, lng: 75.7873 },
  { id: "goa", name: "Goa", fullAddress: "Goa, India", lat: 15.2993, lng: 74.124 },
  { id: "chd", name: "Chandigarh", fullAddress: "Chandigarh, Punjab, India", lat: 30.7333, lng: 76.7794 },
  { id: "koc", name: "Kochi", fullAddress: "Kochi, Kerala, India", lat: 9.9312, lng: 76.2673 },
  { id: "lko", name: "Lucknow", fullAddress: "Lucknow, Uttar Pradesh, India", lat: 26.8467, lng: 80.9462 },
  { id: "ind", name: "Indore", fullAddress: "Indore, Madhya Pradesh, India", lat: 22.7196, lng: 75.8577 },
  { id: "srt", name: "Surat", fullAddress: "Surat, Gujarat, India", lat: 21.1702, lng: 72.8311 },
  { id: "ngp", name: "Nagpur", fullAddress: "Nagpur, Maharashtra, India", lat: 21.1458, lng: 79.0882 },
  { id: "pat", name: "Patna", fullAddress: "Patna, Bihar, India", lat: 25.5941, lng: 85.1376 },
  { id: "bho", name: "Bhopal", fullAddress: "Bhopal, Madhya Pradesh, India", lat: 23.2599, lng: 77.4126 },
  { id: "viz", name: "Visakhapatnam", fullAddress: "Visakhapatnam, Andhra Pradesh, India", lat: 17.6868, lng: 83.2185 },
  { id: "vad", name: "Vadodara", fullAddress: "Vadodara, Gujarat, India", lat: 22.3072, lng: 73.1812 },
  { id: "ldh", name: "Ludhiana", fullAddress: "Ludhiana, Punjab, India", lat: 30.901, lng: 75.8573 },
  { id: "agr", name: "Agra", fullAddress: "Agra, Uttar Pradesh, India", lat: 27.1767, lng: 78.0081 },
  { id: "vns", name: "Varanasi", fullAddress: "Varanasi, Uttar Pradesh, India", lat: 25.3176, lng: 82.9739 },
  { id: "amr", name: "Amritsar", fullAddress: "Amritsar, Punjab, India", lat: 31.634, lng: 74.8723 },
  { id: "cbe", name: "Coimbatore", fullAddress: "Coimbatore, Tamil Nadu, India", lat: 11.0168, lng: 76.9558 },
  { id: "gau", name: "Guwahati", fullAddress: "Guwahati, Assam, India", lat: 26.1445, lng: 91.7362 },
  { id: "ddn", name: "Dehradun", fullAddress: "Dehradun, Uttarakhand, India", lat: 30.3165, lng: 78.0322 },
  { id: "udp", name: "Udaipur", fullAddress: "Udaipur, Rajasthan, India", lat: 24.5854, lng: 73.7125 },
  { id: "mys", name: "Mysore", fullAddress: "Mysore, Karnataka, India", lat: 12.2958, lng: 76.6394 },
  { id: "mng", name: "Mangalore", fullAddress: "Mangalore, Karnataka, India", lat: 12.9141, lng: 74.856 },
  { id: "shm", name: "Shimla", fullAddress: "Shimla, Himachal Pradesh, India", lat: 31.1048, lng: 77.1734 },
  { id: "sri", name: "Srinagar", fullAddress: "Srinagar, Jammu & Kashmir, India", lat: 34.0837, lng: 74.7973 },
  { id: "noi", name: "Noida", fullAddress: "Noida, Uttar Pradesh, India", lat: 28.5355, lng: 77.391 },
  { id: "gur", name: "Gurugram", fullAddress: "Gurugram, Haryana, India", lat: 28.4595, lng: 77.0266 },

  // International Hubs
  { id: "dxb", name: "Dubai", fullAddress: "Dubai, United Arab Emirates", lat: 25.2048, lng: 55.2708 },
  { id: "auh", name: "Abu Dhabi", fullAddress: "Abu Dhabi, United Arab Emirates", lat: 24.4539, lng: 54.3773 },
  { id: "lon", name: "London", fullAddress: "London, England, United Kingdom", lat: 51.5074, lng: -0.1278 },
  { id: "nyc", name: "New York", fullAddress: "New York, NY, United States", lat: 40.7128, lng: -74.006 },
  { id: "sfo", name: "San Francisco", fullAddress: "San Francisco, CA, United States", lat: 37.7749, lng: -122.4194 },
  { id: "lax", name: "Los Angeles", fullAddress: "Los Angeles, CA, United States", lat: 34.0522, lng: -118.2437 },
  { id: "sin", name: "Singapore", fullAddress: "Singapore, Singapore", lat: 1.3521, lng: 103.8198 },
  { id: "bkk", name: "Bangkok", fullAddress: "Bangkok, Thailand", lat: 13.7563, lng: 100.5018 },
  { id: "par", name: "Paris", fullAddress: "Paris, France", lat: 48.8566, lng: 2.3522 },
  { id: "ber", name: "Berlin", fullAddress: "Berlin, Germany", lat: 52.52, lng: 13.405 },
  { id: "tok", name: "Tokyo", fullAddress: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
  { id: "tor", name: "Toronto", fullAddress: "Toronto, Ontario, Canada", lat: 43.6532, lng: -79.3832 },
  { id: "syd", name: "Sydney", fullAddress: "Sydney, NSW, Australia", lat: -33.8688, lng: 151.2093 },
  { id: "mel", name: "Melbourne", fullAddress: "Melbourne, VIC, Australia", lat: -37.8136, lng: 144.9631 },
];

const DEFAULT_REGION: Region = {
  latitude: 17.385,
  longitude: 78.4867,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const formatCoords = (lat: number, lng: number) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

// Distance calculation to find nearest city when GPS is detected
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

const findNearestCity = (lat: number, lng: number): SuggestionItem | null => {
  let nearest: SuggestionItem | null = null;
  let minDistance = Infinity;

  for (const city of ALL_CITIES) {
    const dist = calculateDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }

  // If within 80km of a known city, use it
  if (minDistance <= 80 && nearest) {
    return nearest;
  }
  return null;
};

const Location = () => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);
  const { alert, AlertComponent } = useAlert();
  const {
    location,
    setLocation,
    locationModalVisible,
    setLocationModalVisible,
  } = useContext(AppContext);

  const { addLocation, getLocationErrorMessage } = useLocation();

  // State
  const [activeLocationType, setActiveLocationType] = useState<"gps" | "custom">("custom");
  const [savedLocations, setSavedLocations] = useState<SavedLocationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingGps, setIsResolvingGps] = useState(false);

  // Map view state
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SuggestionItem | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);

  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved locations and active type from storage on mount
  useEffect(() => {
    loadSavedLocations();
  }, []);

  const loadSavedLocations = async () => {
    try {
      const storedList = await AsyncStorage.getItem(STORAGE_SAVED_LOCATIONS);
      if (storedList) {
        setSavedLocations(JSON.parse(storedList));
      }
      const storedType = await AsyncStorage.getItem(STORAGE_ACTIVE_LOCATION_TYPE);
      if (storedType === "gps" || storedType === "custom") {
        setActiveLocationType(storedType);
      } else {
        if (!location || location === t('search.location.my_current_location') || location.includes("Current location")) {
          setActiveLocationType("gps");
        } else {
          setActiveLocationType("custom");
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!location || location === t('search.location.my_current_location') || location.includes("Current location")) {
      setActiveLocationType("gps");
    } else {
      setActiveLocationType("custom");
    }
  }, [location]);

  // Real-time Autocomplete search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    // Instant local matches so user sees results with 0ms delay
    const lower = q.toLowerCase();
    const instantMatches = ALL_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.fullAddress.toLowerCase().includes(lower)
    );
    if (instantMatches.length > 0) {
      setSuggestions(instantMatches.slice(0, 8));
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Also attempt remote geocoding if online
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await axios.get(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`,
          { timeout: 3000 }
        );

        if (response.data?.features && response.data.features.length > 0) {
          const fetched: SuggestionItem[] = response.data.features.map((f: any, idx: number) => {
            const props = f.properties || {};
            const [lng, lat] = f.geometry?.coordinates || [0, 0];
            const name = props.name || props.city || q;
            const parts = [
              props.name,
              props.city !== props.name ? props.city : null,
              props.district,
              props.state,
              props.country,
            ].filter(Boolean);
            const fullAddress = parts.length > 0 ? parts.join(", ") : name;

            return {
              id: `photon_${props.osm_id || idx}_${idx}`,
              name,
              fullAddress,
              lat,
              lng,
            };
          });

          setSuggestions(fetched);
          setIsSearching(false);
          return;
        }
      } catch {
        // Fallback to local
      }

      if (instantMatches.length > 0) {
        setSuggestions(instantMatches.slice(0, 8));
      } else {
        // User typed an unlisted address: allow custom pin
        setSuggestions([
          {
            id: `custom_${Date.now()}`,
            name: q,
            fullAddress: q,
            lat: mapRegion.latitude || 17.385,
            lng: mapRegion.longitude || 78.4867,
          },
        ]);
      }
      setIsSearching(false);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Real GPS detection
  const handleSelectGps = async () => {
    try {
      setIsResolvingGps(true);
      const coords = await getCurrentLocation(true);

      // Determine real city from coordinates
      const nearest = findNearestCity(coords.latitude, coords.longitude);
      const resolvedCity = nearest ? nearest.name : t('search.location.my_current_location');

      setActiveLocationType("gps");
      setLocation(resolvedCity);
      await AsyncStorage.setItem(STORAGE_ACTIVE_LOCATION_TYPE, "gps");

      // Sync with backend
      addLocation.mutate({
        city: nearest ? nearest.name : "",
        state: nearest ? nearest.fullAddress.split(",")[1]?.trim() || "" : "",
        country: "India",
        lat: coords.latitude,
        lng: coords.longitude,
      });

      setLocationModalVisible(false);
      setIsMapVisible(false);
      setSearchQuery("");
      setSuggestions([]);
    } catch (err: any) {
      alert(
        t('search.location.location_error'),
        getLocationErrorMessage(
          err,
          "Unable to get your current location. Please verify GPS permissions."
        )
      );
    } finally {
      setIsResolvingGps(false);
    }
  };

  // Tap a suggestion to open Map
  const handleSelectSuggestion = (item: SuggestionItem) => {
    Keyboard.dismiss();
    setSelectedLocation(item);
    const newRegion: Region = {
      latitude: item.lat,
      longitude: item.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setMapRegion(newRegion);
    setIsMapVisible(true);
  };

  // Tap a saved location to activate it
  const handleSelectSavedLocation = async (item: SavedLocationItem) => {
    setActiveLocationType("custom");
    setLocation(item.name || item.fullAddress);
    await AsyncStorage.setItem(STORAGE_ACTIVE_LOCATION_TYPE, "custom");

    addLocation.mutate({
      city: item.name,
      state: "",
      country: "",
      lat: item.lat,
      lng: item.lng,
    });

    setLocationModalVisible(false);
    setIsMapVisible(false);
    setSearchQuery("");
  };

  // Delete saved location
  const handleDeleteSavedLocation = async (id: string) => {
    const updated = savedLocations.filter((s) => s.id !== id);
    setSavedLocations(updated);
    await AsyncStorage.setItem(STORAGE_SAVED_LOCATIONS, JSON.stringify(updated));
  };

  // Confirm and set active from Map view
  const handleConfirmLocation = async () => {
    if (!selectedLocation) return;

    const locName = selectedLocation.name || selectedLocation.fullAddress.split(",")[0].trim();
    const fullAddr = selectedLocation.fullAddress;
    const lat = mapRegion.latitude || selectedLocation.lat;
    const lng = mapRegion.longitude || selectedLocation.lng;

    const newItem: SavedLocationItem = {
      id: `saved_${Date.now()}`,
      name: locName,
      fullAddress: fullAddr,
      lat,
      lng,
    };

    const exists = savedLocations.some(
      (s) =>
        s.name.toLowerCase() === locName.toLowerCase() ||
        s.fullAddress.toLowerCase() === fullAddr.toLowerCase()
    );

    let updatedList = savedLocations;
    if (!exists) {
      updatedList = [newItem, ...savedLocations].slice(0, 10);
      setSavedLocations(updatedList);
      await AsyncStorage.setItem(STORAGE_SAVED_LOCATIONS, JSON.stringify(updatedList));
    }

    setActiveLocationType("custom");
    setLocation(locName);
    await AsyncStorage.setItem(STORAGE_ACTIVE_LOCATION_TYPE, "custom");

    // Sync with backend
    addLocation.mutate({
      city: locName,
      state: "",
      country: "",
      lat,
      lng,
    });

    setIsMapVisible(false);
    setLocationModalVisible(false);
    setSearchQuery("");
    setSuggestions([]);
  };

  // Re-center map to original selected coordinates
  const handleRecenter = () => {
    if (!selectedLocation) return;
    setMapRegion({
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  const displayTitle = useMemo(() => {
    if (activeLocationType === "gps") {
      return location && location !== t('search.location.my_current_location') ? location : t('search.location.my_current_location');
    }
    return location || t('search.location.hyderabad');
  }, [activeLocationType, location]);

  const displaySubtitle = useMemo(() => {
    if (activeLocationType === "gps") {
      return t('search.location.using_gps_location');
    }
    return "Custom location";
  }, [activeLocationType]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('search.location.search_location')}</Text>

      {/* Main Search Location Card (matching media_1791822690914.png) */}
      <TouchableOpacity
        style={styles.locationCard}
        activeOpacity={0.8}
        onPress={() => setLocationModalVisible(true)}
      >
        <View style={styles.locationCardLeft}>
          <Ionicons
            name="location-outline"
            size={22}
            color={themeColors.primary}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {displayTitle}
            </Text>
            <Text style={styles.cardSubtitle}>
              {displaySubtitle}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setLocationModalVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.changeBtnText}>{t('search.location.change')}</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Modal: Change Location */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          if (isMapVisible) {
            setIsMapVisible(false);
          } else {
            setLocationModalVisible(false);
          }
        }}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "left", "right"]}>
          {!isMapVisible ? (
            /* ========================================================= */
            /* SCREEN 1 & 2: LIST / SEARCH (media_1791822675727.png & media_1791822680523.png) */
            /* ========================================================= */
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setLocationModalVisible(false)}
                  style={styles.backButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="chevron-back" size={26} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={styles.modalHeaderTitle}>{t('profile.changelocation.change_location')}</Text>
              </View>

              {/* Search Input Bar */}
              <View style={styles.searchBarContainer}>
                <Ionicons
                  name="search-outline"
                  size={19}
                  color={themeColors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder={t('search.location.search_for_a_city_or_address')}
                  placeholderTextColor={themeColors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                )}
                {isSearching && (
                  <ActivityIndicator size="small" color={themeColors.primary} style={{ marginLeft: 6 }} />
                )}
              </View>

              {/* Suggestions Dropdown Card (media_1791822680523.png) */}
              {searchQuery.trim().length > 0 ? (
                <View style={styles.suggestionsCard}>
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.id}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        style={[
                          styles.suggestionRow,
                          index < suggestions.length - 1 && styles.suggestionBorder,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleSelectSuggestion(item)}
                      >
                        <Ionicons
                          name="location-outline"
                          size={19}
                          color={themeColors.primary}
                          style={{ marginRight: 12 }}
                        />
                        <Text style={styles.suggestionText} numberOfLines={1}>
                          {item.fullAddress}
                        </Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      !isSearching ? (
                        <View style={{ padding: 18, alignItems: "center" }}>
                          <Text style={{ color: themeColors.textSecondary, fontSize: 14 }}>{t('search.location.no_locations_found')}</Text>
                        </View>
                      ) : null
                    }
                  />
                </View>
              ) : (
                /* Main Location Card with GPS + Saved (media_1791822675727.png) */
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 90 }}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.mainGroupCard}>
                    {/* Using GPS Location */}
                    <TouchableOpacity
                      style={styles.gpsRow}
                      activeOpacity={0.75}
                      onPress={handleSelectGps}
                      disabled={isResolvingGps}
                    >
                      <View style={styles.gpsRowLeft}>
                        <Ionicons
                          name="navigate-outline"
                          size={24}
                          color={themeColors.primary}
                          style={{ marginRight: 14, transform: [{ rotate: "45deg" }] }}
                        />
                        <View>
                          <Text style={styles.gpsTitle}>{t('search.location.using_gps_location')}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                            <Text style={styles.gpsSubtitle}>{t('search.location.my_current_location')}</Text>
                            {activeLocationType === "gps" && (
                              <>
                                <Text style={styles.activeDot}> • </Text>
                                <Text style={styles.activeBadgeText}>{t('search.location.active')}</Text>
                              </>
                            )}
                          </View>
                        </View>
                      </View>

                      {isResolvingGps ? (
                        <ActivityIndicator size="small" color={themeColors.primary} />
                      ) : activeLocationType === "gps" ? (
                        <Ionicons name="checkmark" size={22} color={themeColors.primary} />
                      ) : null}
                    </TouchableOpacity>

                    {/* Divider with "Saved" */}
                    <View style={styles.savedDividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.savedDividerText}>{t('search.location.saved')}</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    {/* Saved Locations List */}
                    {savedLocations.length === 0 ? (
                      <View style={styles.savedEmptyBox}>
                        <Text style={styles.savedEmptyText}>{t('search.location.search_above_to_add_a_new_location')}</Text>
                      </View>
                    ) : (
                      <View style={styles.savedList}>
                        {savedLocations.map((item) => {
                          const isActive =
                            activeLocationType === "custom" &&
                            (location === item.name || location === item.fullAddress);
                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={styles.savedItemRow}
                              activeOpacity={0.7}
                              onPress={() => handleSelectSavedLocation(item)}
                            >
                              <View style={styles.savedItemLeft}>
                                <Ionicons
                                  name="location-outline"
                                  size={20}
                                  color={isActive ? themeColors.primary : themeColors.textSecondary}
                                  style={{ marginRight: 12 }}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.savedItemName} numberOfLines={1}>
                                    {item.name}
                                  </Text>
                                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Text style={styles.savedItemSub} numberOfLines={1}>
                                      {item.fullAddress}
                                    </Text>
                                    {isActive && (
                                      <>
                                        <Text style={styles.activeDot}> • </Text>
                                        <Text style={styles.activeBadgeText}>{t('search.location.active')}</Text>
                                      </>
                                    )}
                                  </View>
                                </View>
                              </View>

                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                {isActive && (
                                  <Ionicons
                                    name="checkmark"
                                    size={20}
                                    color={themeColors.primary}
                                    style={{ marginRight: 10 }}
                                  />
                                )}
                                <TouchableOpacity
                                  onPress={() => handleDeleteSavedLocation(item.id)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                  <Ionicons name="trash-outline" size={17} color={themeColors.textSecondary} />
                                </TouchableOpacity>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </ScrollView>
              )}

              {/* Amara Gradient FAB (+) Button */}
              <TouchableOpacity
                style={styles.fabButton}
                activeOpacity={0.85}
                onPress={() => {
                  searchInputRef.current?.focus();
                }}
              >
                <LinearGradient
                  colors={[themeColors.primary, themeColors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fabGradient}
                >
                  <Ionicons name="add" size={28} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            /* ========================================================= */
            /* SCREEN 3: MAP VIEW (media_1791822686051.png)              */
            /* ========================================================= */
            <View style={styles.mapContainer}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setIsMapVisible(false)}
                  style={styles.backButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="chevron-back" size={26} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={styles.modalHeaderTitle}>{t('profile.changelocation.change_location')}</Text>
              </View>

              {/* Map */}
              <View style={{ flex: 1, position: "relative" }}>
                <OsmMapView
                  region={mapRegion}
                  onRegionChangeComplete={setMapRegion}
                  markerTitle={selectedLocation?.name || selectedLocation?.fullAddress}
                  markerColor={themeColors.secondary}
                  isDark={isDark}
                />

                {/* Top-left Floating Back Button */}
                <TouchableOpacity
                  style={styles.floatingBackButton}
                  activeOpacity={0.85}
                  onPress={() => setIsMapVisible(false)}
                >
                  <Ionicons name="arrow-back" size={20} color={themeColors.text} />
                </TouchableOpacity>

                {/* Top-right Floating Recenter Button */}
                <TouchableOpacity
                  style={styles.floatingRecenterButton}
                  activeOpacity={0.85}
                  onPress={handleRecenter}
                >
                  <MaterialIcons name="my-location" size={20} color={themeColors.text} />
                </TouchableOpacity>

                {/* Bottom Sheet Card */}
                <View style={styles.bottomSheetCard}>
                  <Text style={styles.bottomSheetTitle} numberOfLines={1}>
                    {selectedLocation?.fullAddress || selectedLocation?.name || t('search.location.selected_location')}
                  </Text>
                  <Text style={styles.bottomSheetCoords}>
                    {formatCoords(mapRegion.latitude, mapRegion.longitude)}
                  </Text>
                  <Text style={styles.mapAttribution}>© OpenStreetMap contributors</Text>

                  {/* Amara Gradient Save & Set Active Button */}
                  <TouchableOpacity
                    style={styles.saveActiveButton}
                    activeOpacity={0.85}
                    onPress={handleConfirmLocation}
                  >
                    <LinearGradient
                      colors={[themeColors.primary, themeColors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.saveActiveGradient}
                    >
                      <Text style={styles.saveActiveButtonText}>{t('search.location.save_set_active')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
      {AlertComponent}
    </View>
  );
};

const createStyles = (themeColors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      padding: Spacing.xl,
      backgroundColor: themeColors.surface,
      marginHorizontal: Spacing.screenPaddingHorizontal,
      marginTop: Spacing.lg,
      borderRadius: Spacing.radiusXl,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    label: {
      fontWeight: "700",
      fontSize: 16,
      marginBottom: Spacing.md,
      color: themeColors.text,
      letterSpacing: 0.1,
    },
    locationCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: themeColors.surfaceLight,
      borderRadius: Spacing.radiusLg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    locationCardLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: themeColors.text,
    },
    cardSubtitle: {
      fontSize: 13,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    changeBtnText: {
      color: themeColors.primary,
      fontSize: 14,
      fontWeight: "600",
    },

    // Modal
    modalSafeArea: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    modalContent: {
      flex: 1,
      position: "relative",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: themeColors.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: themeColors.borderLight,
    },
    backButton: {
      marginRight: 12,
    },
    modalHeaderTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: themeColors.text,
    },

    // Search input
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.surfaceLight,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
      marginHorizontal: 16,
      marginTop: 14,
      marginBottom: 14,
      paddingHorizontal: 12,
      height: 46,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: themeColors.text,
      paddingVertical: 0,
    },

    // Suggestions dropdown
    suggestionsCard: {
      backgroundColor: themeColors.surface,
      borderRadius: 14,
      marginHorizontal: 16,
      paddingVertical: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.1,
      shadowRadius: 10,
      elevation: 5,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
      maxHeight: 360,
    },
    suggestionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    suggestionBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: themeColors.borderLight,
    },
    suggestionText: {
      fontSize: 14,
      fontWeight: "500",
      color: themeColors.text,
      flex: 1,
    },

    // Main group card
    mainGroupCard: {
      backgroundColor: themeColors.surfaceLight,
      borderRadius: 16,
      marginHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 20,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    gpsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    gpsRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    gpsTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: themeColors.text,
    },
    gpsSubtitle: {
      fontSize: 13,
      color: themeColors.textSecondary,
    },
    activeDot: {
      fontSize: 13,
      color: themeColors.textSecondary,
    },
    activeBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: themeColors.secondary,
      letterSpacing: 0.4,
    },

    // Divider
    savedDividerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      marginVertical: 8,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: themeColors.borderLight,
    },
    savedDividerText: {
      fontSize: 12,
      color: themeColors.textSecondary,
      paddingHorizontal: 10,
    },

    // Saved locations
    savedEmptyBox: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    savedEmptyText: {
      fontSize: 13,
      color: themeColors.textSecondary,
      textAlign: "center",
    },
    savedList: {
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    savedItemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: themeColors.borderLight,
    },
    savedItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 10,
    },
    savedItemName: {
      fontSize: 14,
      fontWeight: "600",
      color: themeColors.text,
    },
    savedItemSub: {
      fontSize: 12,
      color: themeColors.textSecondary,
      maxWidth: 160,
    },

    // FAB Button with Amara Gradient
    fabButton: {
      position: "absolute",
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
      overflow: "hidden",
    },
    fabGradient: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },

    // Map screen
    mapContainer: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    floatingBackButton: {
      position: "absolute",
      top: 16,
      left: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: themeColors.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.15,
      shadowRadius: 4,
      elevation: 4,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    floatingRecenterButton: {
      position: "absolute",
      top: 16,
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: themeColors.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.15,
      shadowRadius: 4,
      elevation: 4,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    bottomSheetCard: {
      position: "absolute",
      bottom: 20,
      left: 16,
      right: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 20,
      padding: 18,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.5 : 0.15,
      shadowRadius: 10,
      elevation: 6,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    bottomSheetTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: themeColors.text,
      marginBottom: 3,
    },
    bottomSheetCoords: {
      fontSize: 13,
      color: themeColors.textSecondary,
      marginBottom: 2,
    },
    mapAttribution: {
      fontSize: 10,
      color: themeColors.textSecondary,
      marginBottom: 14,
    },
    saveActiveButton: {
      borderRadius: 25,
      overflow: "hidden",
    },
    saveActiveGradient: {
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 25,
    },
    saveActiveButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });

export default Location;
