import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import AppContext from '../../context/CreateGlobalStateContext';

const englishLevels = ['Bad', 'Medium', 'Good', 'Very Good'];

const EnglishSkillSelector = () => {
  const { englishSkillLevel, setEnglishSkillLevel } = useContext(AppContext);

  // Local state for smooth slider updates
  const [localValue, setLocalValue] = useState(englishSkillLevel);

  // Keep local state in sync if context changes outside this component
  useEffect(() => {
    setLocalValue(englishSkillLevel);
  }, [englishSkillLevel]);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {/* <FontAwesome5 name="comments" size={20} color="#d33" style={{ marginRight: 8 }} /> */}
        <Text style={styles.label}>
          How good is your English: <Text style={styles.levelText}>{englishLevels[localValue]}</Text>
        </Text>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={3}
        step={1}
        minimumTrackTintColor="#d33"
        maximumTrackTintColor="#ccc"
        thumbTintColor="#d33"
        value={localValue}
        onValueChange={(value) => setLocalValue(value)} // just updates local state
        onSlidingComplete={(value) => setEnglishSkillLevel(value)} // final update to context
      />
    </View>
  );
};

export default EnglishSkillSelector;

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    flexShrink: 1,
  },
  levelText: {
    fontWeight: 'bold',
    color: '#333',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
