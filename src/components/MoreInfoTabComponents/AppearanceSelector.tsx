
import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { APPEARANCE_OPTIONS as appearances } from '../../constants/profileOptions';

const AppearanceSelector = () => {
  const { selectedAppearance, setSelectedAppearance } = useContext(AppContext);

  const toggleAppearance = (appearance: string) => {
    if (selectedAppearance === appearance) {
      setSelectedAppearance(null);
    } else {
      setSelectedAppearance(appearance);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your appearance</Text>
      <View style={styles.optionsContainer}>
        {appearances.map((appearance) => (
          <TouchableOpacity
            key={appearance}
            style={[
              styles.option,
              selectedAppearance === appearance && styles.selectedOption
            ]}
            onPress={() => toggleAppearance(appearance)}
          >
            <Text
              style={[
                styles.optionText,
                selectedAppearance === appearance && styles.selectedOptionText
              ]}
            >
              {appearance}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default AppearanceSelector;

const styles = StyleSheet.create({
  container: { marginVertical: 16, paddingHorizontal: 16 },
  label: { fontSize: 16, marginBottom: 10 },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  option: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 6,
  },
  selectedOption: {
    backgroundColor: '#d33',
    borderColor: '#d33',
  },
  optionText: {
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
});
