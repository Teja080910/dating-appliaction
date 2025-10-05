import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import App from '../../../App';
import AppContext from '../../context/CreateGlobalStateContext';

const AgeRangeSlider = () => {
  // const [ageRange, setAgeRange] = useState([18, 55]); 

  const { ageRange, setAgeRange} = useContext(AppContext);
  const [localAgeRange, setLocalAgeRange] = useState(ageRange);


  // console.log('Age Range:', ageRange);
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        <Text style={styles.bold}>Age Range:</Text> {localAgeRange[0]} - {localAgeRange[1]}{localAgeRange[1] === 55 ? '+' : ''}
      </Text>

      <MultiSlider
        values={localAgeRange}
        sliderLength={330}
        onValuesChange={setLocalAgeRange}
        min={18}
        max={55}
        step={1}
        // selectedStyle={{ backgroundColor: '#e94e77' }}
        // unselectedStyle={{ backgroundColor: '#bbb' }}
        // markerStyle={styles.thumb}
        // pressedMarkerStyle={styles.thumbPressed}
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
