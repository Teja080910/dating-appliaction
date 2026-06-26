import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, { Marker } from 'react-native-maps';
import AppContext from '../../context/CreateGlobalStateContext';
import { getCurrentLocation } from '../../utils/geolocation';
import { useLocation } from '../../api/useLocation';
import { Colors, Spacing } from '../../theme';
import { useAlert } from '../AlertModal';

const DEFAULT_REGION = {
  latitude: 26.8467,
  longitude: 80.9462,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

const formatCoordinateLabel = (latitude: number, longitude: number) =>
  `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

const buildLocationLabel = (payload: any, latitude: number, longitude: number) => {
  const source =
    payload?.data && typeof payload.data === 'object'
      ? payload.data
      : payload;

  const parts = [source?.city, source?.state, source?.country]
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return `Current location (${formatCoordinateLabel(latitude, longitude)})`;
};

const Location = () => {
  const { alert, AlertComponent } = useAlert();
  const { location, setLocation, locationModalVisible, setLocationModalVisible, previousLocations, setPreviousLocations } = useContext(AppContext);
  const [isTypingLocation, setIsTypingLocation] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const { addLocation, getLocationErrorMessage } = useLocation();

  const markerCoordinate = useMemo(
    () => ({
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
    }),
    [mapRegion.latitude, mapRegion.longitude],
  );

  const handleSelect = (selectedLoc: string) => {
    if (!previousLocations.includes(selectedLoc) && selectedLoc !== location) {
      setPreviousLocations([selectedLoc, ...previousLocations].slice(0, 5));
    }
    setLocation(selectedLoc);
    setLocationModalVisible(false);
    setIsTypingLocation(false);
    setIsMapVisible(false);
    setCustomLocation('');
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
      setIsTypingLocation(true);
      setIsMapVisible(true);

      const response = await addLocation.mutateAsync({
        city: '',
        state: '',
        country: '',
        lat: coords.latitude,
        lng: coords.longitude,
      });

      const nextLocationLabel = buildLocationLabel(response, coords.latitude, coords.longitude);
      setCustomLocation(nextLocationLabel);
      setLocation(nextLocationLabel);
    } catch (error: any) {
      alert('Location Error', getLocationErrorMessage(error, 'Unable to get your current location.'));
    } finally {
      setIsResolvingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Location</Text>

      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setLocationModalVisible(true)}>
        <Text style={styles.text}>{location || 'My current location'}</Text>
        <MaterialIcons name="arrow-drop-down" size={22} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={locationModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafeArea}>
          {!isTypingLocation ? (
            // SCREEN 1: Change Location
            <View style={styles.fullScreen}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setLocationModalVisible(false)} style={styles.headerIcon}>
                  <Ionicons name="close" size={28} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change location</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Content */}
              <View style={styles.bodyContent}>
                 <TouchableOpacity style={styles.currentLocationBox} activeOpacity={0.8} onPress={applyResolvedLocation}>
                    <View style={styles.rowLeft}>
                      <FontAwesome5 name="map-marker-alt" size={20} color={Colors.primary} style={styles.pinIcon} />
                      <Text style={styles.currentLocationText} numberOfLines={2}>{location}</Text>
                    </View>
                    {isResolvingLocation ? (
                      <ActivityIndicator color={Colors.primary} />
                    ) : (
                      <Ionicons name="locate" size={24} color={Colors.primary} />
                    )}
                 </TouchableOpacity>

                <Text style={styles.sectionLabel}>Previous locations</Text>
                {previousLocations.map((prev: string, index: number) => (
                    <TouchableOpacity key={index} style={styles.historyItem} onPress={() => handleSelect(prev)}>
                        <View style={styles.rowLeft}>
                          <Ionicons name="time-outline" size={20} color={Colors.textMuted} style={styles.pinIcon} />
                          <Text style={styles.historyText} numberOfLines={1}>{prev}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
                    </TouchableOpacity>
                ))}

              </View>

              {/* Bottom Button */}
              <View style={styles.bottomContainer}>
                <TouchableOpacity style={styles.gradientButton} onPress={() => setIsTypingLocation(true)}>
                  <FontAwesome5 name="map-marker-alt" size={18} color={Colors.white} style={styles.pinIconBtn} />
                  <Text style={styles.gradientButtonText}>Add a new location</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // SCREEN 2: Search / Map View
            <View style={styles.fullScreen}>
              {/* Header Search */}
              <View style={styles.headerSearch}>
                 <TouchableOpacity onPress={() => { setIsTypingLocation(false); setIsMapVisible(false); setCustomLocation(''); }} style={styles.headerIcon}>
                    <Ionicons name="close" size={28} color={Colors.text} />
                 </TouchableOpacity>
                 <View style={styles.searchBarContainer}>
                    <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
                    <TextInput 
                      style={styles.searchInput}
                      placeholder="Search for a location"
                      placeholderTextColor={Colors.textMuted}
                      value={customLocation}
                      onChangeText={setCustomLocation}
                      autoFocus
                      onSubmitEditing={() => {
                        if(customLocation.trim()) {
                          setIsMapVisible(true);
                        }
                      }}
                    />
                 </View>
                 <TouchableOpacity style={styles.headerIconRight} onPress={() => {
                   void applyResolvedLocation();
                 }}>
                    <FontAwesome5 name="map-marker-alt" size={22} color={Colors.primary} />
                 </TouchableOpacity>
              </View>

              {/* Map or Blank State */}
              {!isMapVisible ? (
                <View style={styles.searchContentCenter}>
                   <FontAwesome5 name="map-marker-alt" size={80} color={Colors.textMuted} style={{marginBottom: 20}} />
                   <Text style={styles.selectLocationTitle}>Select location</Text>
                   <Text style={styles.selectLocationDesc}>
                     Use the search bar above to find a location{'\n'}and view it on the map.
                   </Text>
                   
                   <TouchableOpacity style={styles.gradientButton} onPress={() => {
                      void applyResolvedLocation();
                    }}>
                     <FontAwesome5 name="map-marker-alt" size={16} color={Colors.white} style={styles.pinIconBtn} />
                     <Text style={styles.gradientButtonText}>
                       {isResolvingLocation ? 'Getting current location...' : 'Use current location'}
                     </Text>
                   </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <MapView
                    style={styles.map}
                    region={mapRegion}
                    onRegionChangeComplete={setMapRegion}
                  >
                    <Marker coordinate={markerCoordinate} />
                  </MapView>

                  {/* Floating Bottom Card */}
                  <View style={styles.floatingBottomBox}>
                    <View style={styles.addressRow}>
                       <FontAwesome5 name="map-marker-alt" size={20} color={Colors.primary} style={{ marginRight: 12, marginTop: 3 }} />
                    <Text style={styles.addressText} numberOfLines={3}>
                          {customLocation || `Current location (${formatCoordinateLabel(mapRegion.latitude, mapRegion.longitude)})`}
                    </Text>

                    </View>
                    <TouchableOpacity style={styles.gradientButton} onPress={() => {
                      handleSelect(customLocation || `Current location (${formatCoordinateLabel(mapRegion.latitude, mapRegion.longitude)})`);
                    }}>
                      <Text style={styles.gradientButtonText}>Select location</Text>
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

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginTop: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  label: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: Spacing.md,
    color: Colors.textSecondary,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    backgroundColor: Colors.inputBackground,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  text: {
    fontSize: 16,
    color: Colors.text,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  headerSearch: {
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: 65,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  headerIcon: {
    padding: 5,
  },
  headerIconRight: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '600',
  },
  bodyContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
  currentLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Spacing.radiusLg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.inputBackground,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pinIcon: {
    marginRight: Spacing.md,
  },
  currentLocationText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  historyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    flex: 1,
  },
  bottomContainer: {
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.xl,
  },
  gradientButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.radiusLg,
  },
  pinIconBtn: {
    marginRight: Spacing.sm,
  },
  gradientButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
    backgroundColor: Colors.inputBackground,
    borderRadius: Spacing.radiusLg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    padding: Spacing.sm + 2,
  },
  searchContentCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  selectLocationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm + 2,
  },
  selectLocationDesc: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  map: {
    flex: 1,
  },
  floatingBottomBox: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 15,
    right: 15,
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusXl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    elevation: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    lineHeight: 22,
  },
});

export default Location;
