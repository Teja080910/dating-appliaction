import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import AppContext from '../../context/CreateGlobalStateContext';

const DistanceSlider = () => {
  const {distanceRange, setDistanceRange} = useContext(AppContext)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        <Text style={styles.bold}>Distance Range:</Text> {distanceRange} km
      </Text>

      <Slider
        style={styles.slider}
        minimumValue={5}
        maximumValue={2000}
        step={5}
        value={distanceRange}
        onValueChange={setDistanceRange}
        minimumTrackTintColor="#d33"
        maximumTrackTintColor="#bbb"
        thumbTintColor="#d33"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#f2f2f2',
  },
  label: {
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
    marginLeft: -10
  },
});

export default DistanceSlider;
