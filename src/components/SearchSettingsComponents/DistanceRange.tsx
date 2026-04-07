import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import AppContext from '../../context/CreateGlobalStateContext';

interface DistanceSliderProps {
  onChange?: (val: number) => void;
}

const DistanceSlider: React.FC<DistanceSliderProps> = ({ onChange }) => {
  const { distanceRange } = useContext(AppContext);
  const [localDistanceRange, setLocalDistanceRange] = useState(distanceRange || 50);

  const handleValueChange = (val: number) => {
    setLocalDistanceRange(val);
    if (onChange) {
      onChange(val);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        <Text style={styles.bold}>Distance Range:</Text> {localDistanceRange} km
      </Text>

      <Slider
        style={styles.slider}
        minimumValue={5}
        maximumValue={2000}
        step={5}
        value={localDistanceRange}
        onValueChange={handleValueChange}
        minimumTrackTintColor="#d33"
        maximumTrackTintColor="#bbb"
        thumbTintColor="#d33" // This sets the fill color of the thumb
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
