import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import AppContext from '../../context/CreateGlobalStateContext';

interface AgeRangeSliderProps {
  onChange?: (min: number, max: number) => void;
}

const AgeRangeSlider: React.FC<AgeRangeSliderProps> = ({ onChange }) => {
  const { ageRange } = useContext(AppContext);
  const [localAgeRange, setLocalAgeRange] = useState(ageRange || [18, 55]);

  const handleValuesChange = (values: number[]) => {
    setLocalAgeRange(values);
    if (onChange) {
      onChange(values[0], values[1]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        <Text style={styles.bold}>Age Range:</Text> {localAgeRange[0]} - {localAgeRange[1]}{localAgeRange[1] === 55 ? '+' : ''}
      </Text>

      <MultiSlider
        values={localAgeRange}
        sliderLength={330}
        onValuesChange={handleValuesChange}
        min={18}
        max={55}
        step={1}
        selectedStyle={{ backgroundColor: '#d33' }}
        unselectedStyle={{ backgroundColor: '#eee' }}
        markerStyle={styles.marker}
        containerStyle={styles.sliderContainer}
        trackStyle={styles.track}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f2f2f2',
  },
  label: {
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
  },
  thumb: {
    marginLeft: 13,
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#e94e77',
    backgroundColor: '#fff',
  },
  thumbPressed: {
    height: 28,
    width: 28,
  },
   marker: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#d33',
    backgroundColor: '#fff',
  },
  sliderContainer: {
    marginLeft: 10,
    height: 40,
  },
  track: { 
    height: 4,
    borderRadius: 2,
  },
});

export default AgeRangeSlider;
