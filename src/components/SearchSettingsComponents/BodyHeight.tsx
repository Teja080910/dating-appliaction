import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import AppContext from '../../context/CreateGlobalStateContext';

interface BodyHeightProps {
  onChange?: (min: number, max: number) => void;
}

const BodyHeight: React.FC<BodyHeightProps> = ({ onChange }) => {
  const { bodyHeight } = useContext(AppContext);
  const [localBodyHeight, setLocalBodyHeight] = useState(bodyHeight || [120, 200]);

  const handleValuesChange = (values: number[]) => {
    setLocalBodyHeight(values);
    if (onChange) {
      onChange(values[0], values[1]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        <Text style={styles.labelBold}>Body height: </Text>
        {localBodyHeight[0]} cm - {localBodyHeight[1]} cm
      </Text>

      <MultiSlider
        values={localBodyHeight}
        sliderLength={330}
        min={120}
        max={200}
        onValuesChange={handleValuesChange}
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
    marginHorizontal: 20,
    marginTop: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 20,
    color: '#000',
  },
  labelBold: {
    fontWeight: 'bold',
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

export default BodyHeight;
