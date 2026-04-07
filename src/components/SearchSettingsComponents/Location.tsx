import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, SafeAreaView, Platform, Alert, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, { Marker } from 'react-native-maps';
import AppContext from '../../context/CreateGlobalStateContext';
import { getCurrentLocation } from '../../utils/geolocation';
import { useLocation } from '../../api/useLocation';

const THEME_COLOR = '#DB4260';
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
      Alert.alert('Location Error', getLocationErrorMessage(error, 'Unable to get your current location.'));
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
        <MaterialIcons name="arrow-drop-down" size={22} color="#444" />
      </TouchableOpacity>

      <Modal visible={locationModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafeArea}>
          {!isTypingLocation ? (
            // SCREEN 1: Change Location
            <View style={styles.fullScreen}>
              {/* Header */}
              <View style={styles.headerRed}>
                <TouchableOpacity onPress={() => setLocationModalVisible(false)} style={styles.headerIcon}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitleWhite}>Change location</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Content */}
              <View style={styles.bodyContent}>
                 <TouchableOpacity style={styles.currentLocationBox} activeOpacity={0.8} onPress={applyResolvedLocation}>
                    <View style={styles.rowLeft}>
                      <FontAwesome5 name="map-marker-alt" size={20} color={THEME_COLOR} style={styles.pinIcon} />
                      <Text style={styles.currentLocationText} numberOfLines={2}>{location}</Text>
                    </View>
                    {isResolvingLocation ? (
                      <ActivityIndicator color={THEME_COLOR} />
                    ) : (
                      <Ionicons name="locate" size={24} color={THEME_COLOR} />
                    )}
                 </TouchableOpacity>

                <Text style={styles.sectionLabel}>Previous locations</Text>
                {previousLocations.map((prev: string, index: number) => (
                    <TouchableOpacity key={index} style={styles.historyItem} onPress={() => handleSelect(prev)}>
                        <View style={styles.rowLeft}>
                          <Ionicons name="time-outline" size={20} color="#888" style={styles.pinIcon} />
                          <Text style={styles.historyText} numberOfLines={1}>{prev}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color="#CCC" />
                    </TouchableOpacity>
                ))}

              </View>

              {/* Bottom Red Button */}
              <View style={styles.bottomContainer}>
                <TouchableOpacity style={styles.redButtonLg} onPress={() => setIsTypingLocation(true)}>
                  <FontAwesome5 name="map-marker-alt" size={18} color="#fff" style={styles.pinIconBtn} />
                  <Text style={styles.redButtonLgText}>Add a new location</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // SCREEN 2: Search / Map View
            <View style={styles.fullScreen}>
              {/* Header Search */}
              <View style={styles.headerWhiteSearch}>
                 <TouchableOpacity onPress={() => { setIsTypingLocation(false); setIsMapVisible(false); setCustomLocation(''); }} style={styles.headerIcon}>
                    <Ionicons name="close" size={28} color="#000" />
                 </TouchableOpacity>
                 <View style={styles.searchBarContainer}>
                    <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput 
                      style={styles.searchInput}
                      placeholder="Search for a location"
                      placeholderTextColor="#888"
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
                    <FontAwesome5 name="map-marker-alt" size={22} color="#444" />
                 </TouchableOpacity>
              </View>

              {/* Map or Blank State */}
              {!isMapVisible ? (
                <View style={styles.searchContentCenter}>
                   <FontAwesome5 name="map-marker-alt" size={80} color="#888" style={{marginBottom: 20}} />
                   <Text style={styles.selectLocationTitle}>Select location</Text>
                   <Text style={styles.selectLocationDesc}>
                     Use the search bar above to find a location{'\n'}and view it on the map.
                   </Text>
                   
                   <TouchableOpacity style={styles.useCurrentBtn} onPress={() => {
                      void applyResolvedLocation();
                    }}>
                     <FontAwesome5 name="map-marker-alt" size={16} color="#fff" style={styles.pinIconBtn} />
                     <Text style={styles.useCurrentBtnText}>
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
                       <FontAwesome5 name="map-marker-alt" size={20} color={THEME_COLOR} style={{ marginRight: 12, marginTop: 3 }} />
                    <Text style={styles.addressText} numberOfLines={3}>
                          {customLocation || `Current location (${formatCoordinateLabel(mapRegion.latitude, mapRegion.longitude)})`}
                    </Text>


                    </View>
                    <TouchableOpacity style={styles.selectLocBtn} onPress={() => {
                      handleSelect(customLocation || `Current location (${formatCoordinateLabel(mapRegion.latitude, mapRegion.longitude)})`);
                    }}>
                      <Text style={styles.selectLocBtnText}>Select location</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    marginHorizontal: 20,
  },
  label: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  text: {
    fontSize: 16,
    color: '#000',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: THEME_COLOR,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  /* --- SCREEN 1 STYLES --- */
  headerRed: {
    backgroundColor: THEME_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 60,
  },
  headerIcon: {
    padding: 5,
  },
  headerIconRight: {
    padding: 10,
  },
  headerTitleWhite: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 25,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
    fontWeight: '500',
  },
  currentLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: THEME_COLOR,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 30,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    marginRight: 15,
  },
  currentLocationText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
    lineHeight: 20,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  historyText: {
    fontSize: 15,
    color: '#444',
    flex: 1,
  },

  bottomContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  redButtonLg: {
    backgroundColor: THEME_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  pinIconBtn: {
    marginRight: 10,
  },
  redButtonLgText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  /* --- SCREEN 2 STYLES --- */
  headerWhiteSearch: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 65,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 10,
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
    color: '#111',
    marginBottom: 10,
  },
  selectLocationDesc: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  useCurrentBtn: {
    backgroundColor: THEME_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  useCurrentBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  /* --- MAP STYLES --- */
  map: {
    flex: 1,
  },
  floatingBottomBox: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 15,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
    lineHeight: 22,
  },
  selectLocBtn: {
    backgroundColor: THEME_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  selectLocBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Location;
