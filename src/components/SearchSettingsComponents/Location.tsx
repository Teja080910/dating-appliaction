import React, {useContext, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import App from '../../../App';
import AppContext from '../../context/CreateGlobalStateContext';

const Location = () => {
  // const [location, setLocation] = useState('My current location');
  // const [locationModalVisible, setLocationModalVisible] = useState(false);

  const { location, setLocation, locationModalVisible, setLocationModalVisible } = useContext(AppContext)

  interface HandleSelect {
    (location: string): void;
  }

  const handleSelect: HandleSelect = (location) => {
    setLocation(location);
    setLocationModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Location</Text>

      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setLocationModalVisible(true)}>
        <Text style={styles.text}>{location}</Text>
        <MaterialIcons name="arrow-drop-down" size={22} color="#444" />
      </TouchableOpacity>

      <Modal visible={locationModalVisible} transparent >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPressOut={() => setLocationModalVisible(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Address</Text>

            <TouchableOpacity
              style={styles.option}
              onPress={() => handleSelect('Add a new location')}>
              <Text style={styles.optionText}>Add a new location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => handleSelect('My current location')}>
              <Text style={styles.optionText}>My current location</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    borderRadius: 4,
    elevation: 0.5,
  },
  text: {
    fontSize: 16,
    color: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'left',
    color: '#000',
  },
  option: {
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
});

export default Location;
