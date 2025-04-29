import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet} from 'react-native';
import Slider from '@react-native-community/slider';
import AppContext from '../../context/CreateGlobalStateContext';


const HeightSelector = () => {
  const {height, setHeight, tempHeight, setTempHeight} = useContext(AppContext); 

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your height: {tempHeight} cm</Text>
      <Slider
        style={styles.slider}
        minimumValue={120}
        maximumValue={200}
        step={1}
        minimumTrackTintColor="#d33"
        maximumTrackTintColor="#ccc"
        thumbTintColor="#d33"
        value={height}
        onValueChange={(value) => setTempHeight(Math.round(value))} // Just update temporary height
        onSlidingComplete={(value) => setHeight(Math.round(value))}
      />
    </View>
  );
};

export default HeightSelector;

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});

















