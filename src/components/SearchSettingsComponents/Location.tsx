import React, { useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Keyboard,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Ionicons from "react-native-vector-icons/Ionicons";
import MapView, { Marker } from "react-native-maps";
import AppContext from "../../context/CreateGlobalStateContext";
import { getCurrentLocation } from "../../utils/geolocation";
import { useLocation } from "../../api/useLocation";
import { useTheme, ThemeColors, Spacing } from "../../theme";
import { useAlert } from "../AlertModal";

export interface CityItem {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  popular?: boolean;
}

// Popular dating hubs in India and worldwide (Glambu-style quick pick)
export const POPULAR_CITIES: CityItem[] = [
  { id: "mum", name: "Mumbai", state: "Maharashtra", country: "India", lat: 19.076, lng: 72.8777, popular: true },
  { id: "del", name: "Delhi NCR", state: "Delhi", country: "India", lat: 28.7041, lng: 77.1025, popular: true },
  { id: "blr", name: "Bengaluru", state: "Karnataka", country: "India", lat: 12.9716, lng: 77.5946, popular: true },
  { id: "hyd", name: "Hyderabad", state: "Telangana", country: "India", lat: 17.385, lng: 78.4867, popular: true },
  { id: "goa", name: "Goa", state: "Goa", country: "India", lat: 15.2993, lng: 74.124, popular: true },
  { id: "pun", name: "Pune", state: "Maharashtra", country: "India", lat: 18.5204, lng: 73.8567, popular: true },
  { id: "kol", name: "Kolkata", state: "West Bengal", country: "India", lat: 22.5726, lng: 88.3639, popular: true },
  { id: "dxb", name: "Dubai", state: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708, popular: true },
  { id: "lon", name: "London", state: "England", country: "United Kingdom", lat: 51.5074, lng: -0.1278, popular: true },
];

// Rich city database for instant real-time autocomplete
export const ALL_CITIES: CityItem[] = [
  ...POPULAR_CITIES,
  { id: "chn", name: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0827, lng: 80.2707 },
  { id: "amd", name: "Ahmedabad", state: "Gujarat", country: "India", lat: 23.0225, lng: 72.5714 },
  { id: "jai", name: "Jaipur", state: "Rajasthan", country: "India", lat: 26.9124, lng: 75.7873 },
  { id: "chd", name: "Chandigarh", state: "Punjab", country: "India", lat: 30.7333, lng: 76.7794 },
  { id: "koc", name: "Kochi", state: "Kerala", country: "India", lat: 9.9312, lng: 76.2673 },
  { id: "lko", name: "Lucknow", state: "Uttar Pradesh", country: "India", lat: 26.8467, lng: 80.9462 },
  { id: "ind", name: "Indore", state: "Madhya Pradesh", country: "India", lat: 22.7196, lng: 75.8577 },
  { id: "srt", name: "Surat", state: "Gujarat", country: "India", lat: 21.1702, lng: 72.8311 },
  { id: "ngp", name: "Nagpur", state: "Maharashtra", country: "India", lat: 21.1458, lng: 79.0882 },
  { id: "pat", name: "Patna", state: "Bihar", country: "India", lat: 25.5941, lng: 85.1376 },
  { id: "bho", name: "Bhopal", state: "Madhya Pradesh", country: "India", lat: 23.2599, lng: 77.4126 },
  { id: "viz", name: "Visakhapatnam", state: "Andhra Pradesh", country: "India", lat: 17.6868, lng: 83.2185 },
  { id: "vad", name: "Vadodara", state: "Gujarat", country: "India", lat: 22.3072, lng: 73.1812 },
  { id: "ldh", name: "Ludhiana", state: "Punjab", country: "India", lat: 30.901, lng: 75.8573 },
  { id: "agr", name: "Agra", state: "Uttar Pradesh", country: "India", lat: 27.1767, lng: 78.0081 },
  { id: "vns", name: "Varanasi", state: "Uttar Pradesh", country: "India", lat: 25.3176, lng: 82.9739 },
  { id: "amr", name: "Amritsar", state: "Punjab", country: "India", lat: 31.634, lng: 74.8723 },
  { id: "cbe", name: "Coimbatore", state: "Tamil Nadu", country: "India", lat: 11.0168, lng: 76.9558 },
  { id: "gau", name: "Guwahati", state: "Assam", country: "India", lat: 26.1445, lng: 91.7362 },
  { id: "ddn", name: "Dehradun", state: "Uttarakhand", country: "India", lat: 30.3165, lng: 78.0322 },
  { id: "udp", name: "Udaipur", state: "Rajasthan", country: "India", lat: 24.5854, lng: 73.7125 },
  { id: "auh", name: "Abu Dhabi", state: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4539, lng: 54.3773 },
  { id: "nyc", name: "New York", state: "NY", country: "United States", lat: 40.7128, lng: -74.006 },
  { id: "sin", name: "Singapore", state: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { id: "bkk", name: "Bangkok", state: "Central", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { id: "par", name: "Paris", state: "Ile-de-France", country: "France", lat: 48.8566, lng: 2.3522 },
  { id: "tor", name: "Toronto", state: "Ontario", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { id: "syd", name: "Sydney", state: "NSW", country: "Australia", lat: -33.8688, lng: 151.2093 },
];

const DEFAULT_REGION = {
  latitude: 19.076,
  longitude: 72.8777,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

// Sleek dark mode styling for Google Maps
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#171822" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#171822" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8c93a8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d4d8e8" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6f768a" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#252837" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1b1d28" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#33374b" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f1118" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d4458" }],
  },
];

const formatCoordinateLabel = (latitude: number, longitude: number) =>
  `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

const buildLocationLabel = (payload: any, latitude: number, longitude: number) => {
  const source =
    payload?.data && typeof payload.data === "object"
      ? payload.data
      : payload;

  const parts = [source?.city, source?.state, source?.country]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return `Current location (${formatCoordinateLabel(latitude, longitude)})`;
};

const Location = () => {
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { alert, AlertComponent } = useAlert();
  const {
    location,
    setLocation,
    locationModalVisible,
    setLocationModalVisible,
    previousLocations,
    setPreviousLocations,
  } = useContext(AppContext);

  const [isTypingLocation, setIsTypingLocation] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const { addLocation, getLocationErrorMessage } = useLocation();

  // Instant real-time city autocomplete filter
  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return ALL_CITIES;
    }
    return ALL_CITIES.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const markerCoordinate = useMemo(
    () => ({
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
    }),
    [mapRegion.latitude, mapRegion.longitude],
  );

  const handleSelect = (selectedLoc: string, coords?: { lat: number; lng: number }) => {
    if (!previousLocations.includes(selectedLoc) && selectedLoc !== location) {
      setPreviousLocations([selectedLoc, ...previousLocations].slice(0, 5));
    }
    setLocation(selectedLoc);
    setLocationModalVisible(false);
    setIsTypingLocation(false);
    setIsMapVisible(false);
    setSearchQuery("");
    setSelectedCity(null);

    // Persist to backend if coordinates are available
    if (coords) {
      addLocation.mutate({
        city: selectedLoc.split(",")[0].trim(),
        state: "",
        country: "",
        lat: coords.lat,
        lng: coords.lng,
      });
    }
  };

  const handleCityPick = (city: any) => {
    Keyboard.dismiss();
    setSelectedCity(city);
    setMapRegion({
      latitude: city.lat,
      longitude: city.lng,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    });
    setIsMapVisible(true);
  };

  const applyResolvedLocation = async () => {
    try {
      setIsResolvingLocation(true);
      const coords = await getCurrentLocation();
      const nextRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setMapRegion(nextRegion);

      const response = await addLocation.mutateAsync({
        city: "",
        state: "",
        country: "",
        lat: coords.latitude,
        lng: coords.longitude,
      });

      const nextLocationLabel = buildLocationLabel(response, coords.latitude, coords.longitude);
      handleSelect(nextLocationLabel, { lat: coords.latitude, lng: coords.longitude });
    } catch (error) {
      alert("Location Error", getLocationErrorMessage(error, "Unable to get your current location. Please verify GPS permissions."));
    } finally {
      setIsResolvingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Location</Text>

      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setLocationModalVisible(true)}
      >
        <View style={styles.dropdownLeft}>
          <FontAwesome5 name="map-marker-alt" size={16} color={themeColors.primary} style={{ marginRight: 10 }} />
          <Text style={styles.text} numberOfLines={1}>{location || "My current location"}</Text>
        </View>
        <MaterialIcons name="keyboard-arrow-down" size={24} color={themeColors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={locationModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafeArea}>
          {!isTypingLocation ? (
            // ==========================================
            // SCREEN 1: GLAMBU-STYLE LOCATION DASHBOARD
            // ==========================================
            <View style={styles.fullScreen}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => setLocationModalVisible(false)}
                  style={styles.headerIconBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={26} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Location</Text>
                <View style={{ width: 36 }} />
              </View>

              <ScrollView
                style={styles.scrollBody}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 1-Tap GPS Location Card */}
                <TouchableOpacity
                  style={styles.gpsCard}
                  activeOpacity={0.85}
                  onPress={applyResolvedLocation}
                  disabled={isResolvingLocation}
                >
                  <View style={styles.gpsIconCircle}>
                    {isResolvingLocation ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="navigate" size={20} color="#FFFFFF" />
                    )}
                  </View>
                  <View style={styles.gpsTextWrapper}>
                    <Text style={styles.gpsTitle}>Use Current Location</Text>
                    <Text style={styles.gpsSubtitle} numberOfLines={1}>
                      {location || "Detect your GPS position automatically"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>

                {/* Popular Cities Section (Glambu Style Chips) */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Popular Dating Hubs</Text>
                  <Text style={styles.sectionBadge}>Top Cities</Text>
                </View>
                <View style={styles.chipsGrid}>
                  {POPULAR_CITIES.map((city) => {
                    const isSelected = location?.includes(city.name);
                    return (
                      <TouchableOpacity
                        key={city.id}
                        style={[styles.cityChip, isSelected && styles.cityChipActive]}
                        activeOpacity={0.75}
                        onPress={() => handleSelect(`${city.name}, ${city.country}`, { lat: city.lat, lng: city.lng })}
                      >
                        <FontAwesome5
                          name="fire"
                          size={11}
                          color={isSelected ? '#FFFFFF' : themeColors.primary}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.cityChipText, isSelected && styles.cityChipTextActive]}>
                          {city.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Previous Locations History */}
                {previousLocations.length > 0 && (
                  <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>Recent Locations</Text>
                    {previousLocations.map((prev, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.historyItem}
                        activeOpacity={0.7}
                        onPress={() => handleSelect(prev)}
                      >
                        <View style={styles.historyLeft}>
                          <Ionicons name="time-outline" size={18} color={themeColors.textSecondary} style={{ marginRight: 12 }} />
                          <Text style={styles.historyText} numberOfLines={1}>{prev}</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={16} color={themeColors.textSecondary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Bottom Floating Add/Search Button */}
              <View style={styles.bottomBar}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  activeOpacity={0.85}
                  onPress={() => {
                    setIsTypingLocation(true);
                    setIsMapVisible(false);
                    setSearchQuery("");
                  }}
                >
                  <Ionicons name="search" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryActionText}>Search or Add New Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // ==========================================
            // SCREEN 2: GLAMBU INSTANT AUTOCOMPLETE & MAP
            // ==========================================
            <View style={styles.fullScreen}>
              {/* Header with Search Bar */}
              <View style={styles.searchHeader}>
                <TouchableOpacity
                  onPress={() => {
                    if (isMapVisible) {
                      setIsMapVisible(false);
                    } else {
                      setIsTypingLocation(false);
                    }
                  }}
                  style={styles.headerIconBtn}
                >
                  <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                </TouchableOpacity>

                <View style={styles.searchBarBox}>
                  <Ionicons name="search" size={18} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search city, state, or country..."
                    placeholderTextColor={themeColors.textSecondary}
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      if (isMapVisible) setIsMapVisible(false);
                    }}
                    autoFocus={!isMapVisible}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery("")}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color={themeColors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Map/List Toggle */}
                <TouchableOpacity
                  style={[styles.mapToggleBtn, isMapVisible && styles.mapToggleBtnActive]}
                  onPress={() => setIsMapVisible(!isMapVisible)}
                >
                  <FontAwesome5
                    name={isMapVisible ? "list" : "map-marked-alt"}
                    size={16}
                    color={isMapVisible ? '#FFFFFF' : themeColors.primary}
                  />
                </TouchableOpacity>
              </View>

              {/* View 1: Live City Autocomplete Search Results */}
              {!isMapVisible ? (
                <View style={{ flex: 1 }}>
                  {/* Quick Popular Pills Bar when search is empty */}
                  {searchQuery.trim().length === 0 && (
                    <View style={styles.quickPillsRow}>
                      <Text style={styles.quickPillTitle}>Popular:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPillsScroll}>
                        {POPULAR_CITIES.slice(0, 6).map((city) => (
                          <TouchableOpacity
                            key={city.id}
                            style={styles.microChip}
                            onPress={() => handleCityPick(city)}
                          >
                            <Text style={styles.microChipText}>{city.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Instant City List */}
                  <FlatList
                    data={filteredCities}
                    keyExtractor={(item) => item.id}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.cityListContent}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.cityRow}
                        activeOpacity={0.7}
                        onPress={() => handleCityPick(item)}
                      >
                        <View style={styles.cityIconCircle}>
                          <FontAwesome5 name="map-marker-alt" size={15} color={themeColors.primary} />
                        </View>
                        <View style={styles.cityInfo}>
                          <Text style={styles.cityNameText}>{item.name}</Text>
                          <Text style={styles.cityMetaText}>
                            {item.state ? `${item.state}, ` : ""}{item.country}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={themeColors.textSecondary} />
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <View style={styles.emptySearchContainer}>
                        <FontAwesome5 name="search-location" size={48} color={themeColors.textSecondary} style={{ marginBottom: 16 }} />
                        <Text style={styles.emptySearchTitle}>No matching city found</Text>
                        <Text style={styles.emptySearchDesc}>
                          Try checking spelling or tap below to set "{searchQuery}" as custom location.
                        </Text>
                        {searchQuery.trim().length > 0 && (
                          <TouchableOpacity
                            style={styles.customAddButton}
                            onPress={() => handleSelect(searchQuery.trim())}
                          >
                            <Text style={styles.customAddButtonText}>Set "{searchQuery.trim()}"</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    }
                  />
                </View>
              ) : (
                // View 2: Interactive Map with Confirmation Card
                <View style={{ flex: 1 }}>
                  <MapView
                    style={styles.map}
                    region={mapRegion}
                    onRegionChangeComplete={setMapRegion}
                    customMapStyle={isDark ? DARK_MAP_STYLE : []}
                  >
                    <Marker coordinate={markerCoordinate}>
                      <View style={styles.customMarker}>
                        <FontAwesome5 name="map-marker-alt" size={32} color={themeColors.primary} />
                      </View>
                    </Marker>
                  </MapView>

                  {/* Floating Bottom Card */}
                  <View style={styles.floatingConfirmationCard}>
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardPinCircle}>
                        <FontAwesome5 name="map-marker-alt" size={18} color={themeColors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.confirmLocationTitle} numberOfLines={1}>
                          {selectedCity
                            ? `${selectedCity.name}, ${selectedCity.country}`
                            : `${searchQuery || "Selected Location"}`}
                        </Text>
                        <Text style={styles.confirmLocationCoords}>
                          {formatCoordinateLabel(mapRegion.latitude, mapRegion.longitude)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      activeOpacity={0.85}
                      onPress={() => {
                        const finalLabel = selectedCity
                          ? `${selectedCity.name}, ${selectedCity.country}`
                          : searchQuery || `Location (${formatCoordinateLabel(mapRegion.latitude, mapRegion.longitude)})`;
                        handleSelect(finalLabel, { lat: mapRegion.latitude, lng: mapRegion.longitude });
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryActionText}>Confirm & Set Location</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>
      {AlertComponent}
    </View>
  );
};

const createStyles = (themeColors: ThemeColors) =>
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
      fontWeight: "600",
      fontSize: 15,
      marginBottom: Spacing.md,
      color: themeColors.textSecondary,
    },
    dropdown: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md + 2,
      backgroundColor: themeColors.surfaceLight,
      borderRadius: Spacing.radiusLg,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    dropdownLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    text: {
      fontSize: 15,
      color: themeColors.text,
      fontWeight: "500",
    },
    modalSafeArea: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    fullScreen: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      height: 60,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderLight,
      backgroundColor: themeColors.surface,
    },
    headerIconBtn: {
      padding: 6,
    },
    headerTitle: {
      fontSize: 18,
      color: themeColors.text,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    scrollBody: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: 100,
    },
    gpsCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.surface,
      borderWidth: 1.5,
      borderColor: themeColors.primary,
      borderRadius: Spacing.radiusXl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    gpsIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: themeColors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.md,
    },
    gpsTextWrapper: {
      flex: 1,
    },
    gpsTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: themeColors.text,
      marginBottom: 2,
    },
    gpsSubtitle: {
      fontSize: 13,
      color: themeColors.textSecondary,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: themeColors.text,
    },
    sectionBadge: {
      fontSize: 12,
      fontWeight: "600",
      color: themeColors.primary,
      backgroundColor: "rgba(124, 58, 237, 0.12)",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    chipsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: Spacing.xxl,
    },
    cityChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: themeColors.surfaceLight,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    cityChipActive: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    cityChipText: {
      fontSize: 14,
      fontWeight: "600",
      color: themeColors.text,
    },
    cityChipTextActive: {
      color: "#FFFFFF",
    },
    historySection: {
      marginTop: Spacing.sm,
    },
    historyItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderLight,
    },
    historyLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    historyText: {
      fontSize: 15,
      color: themeColors.text,
      fontWeight: "500",
    },
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: themeColors.surface,
      borderTopWidth: 1,
      borderTopColor: themeColors.borderLight,
      padding: Spacing.xl,
      paddingBottom: Platform.OS === "ios" ? 34 : Spacing.xl,
    },
    primaryActionButton: {
      backgroundColor: themeColors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: Spacing.radiusLg,
    },
    primaryActionText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
    searchHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderLight,
      backgroundColor: themeColors.surface,
    },
    searchBarBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeColors.surfaceLight,
      borderRadius: Spacing.radiusLg,
      paddingHorizontal: Spacing.md,
      marginHorizontal: 8,
      height: 44,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: themeColors.text,
      paddingVertical: 4,
    },
    mapToggleBtn: {
      width: 44,
      height: 44,
      borderRadius: Spacing.radiusLg,
      backgroundColor: themeColors.surfaceLight,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    mapToggleBtnActive: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    quickPillsRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingVertical: 10,
      backgroundColor: themeColors.surfaceLight,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderLight,
    },
    quickPillTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: themeColors.textSecondary,
      marginRight: 8,
    },
    quickPillsScroll: {
      gap: 8,
    },
    microChip: {
      backgroundColor: themeColors.surface,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    microChipText: {
      color: themeColors.text,
      fontSize: 12,
      fontWeight: "600",
    },
    cityListContent: {
      paddingVertical: Spacing.sm,
    },
    cityRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.xl,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderLight,
    },
    cityIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: themeColors.surfaceLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    cityInfo: {
      flex: 1,
    },
    cityNameText: {
      fontSize: 16,
      fontWeight: "700",
      color: themeColors.text,
      marginBottom: 2,
    },
    cityMetaText: {
      fontSize: 13,
      color: themeColors.textSecondary,
    },
    emptySearchContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 60,
      paddingHorizontal: Spacing.xxl,
    },
    emptySearchTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: themeColors.text,
      marginBottom: 8,
    },
    emptySearchDesc: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 20,
    },
    customAddButton: {
      backgroundColor: themeColors.surfaceLight,
      borderWidth: 1,
      borderColor: themeColors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    customAddButtonText: {
      color: themeColors.primary,
      fontWeight: "700",
      fontSize: 14,
    },
    map: {
      flex: 1,
    },
    customMarker: {
      alignItems: "center",
      justifyContent: "center",
    },
    floatingConfirmationCard: {
      position: "absolute",
      bottom: Platform.OS === "ios" ? 36 : 20,
      left: 16,
      right: 16,
      backgroundColor: themeColors.surface,
      borderRadius: Spacing.radiusXl,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
      elevation: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.lg,
    },
    cardPinCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: themeColors.surfaceLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    confirmLocationTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: themeColors.text,
    },
    confirmLocationCoords: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
  });

export default Location;
