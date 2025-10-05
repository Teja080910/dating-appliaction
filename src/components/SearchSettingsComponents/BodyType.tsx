import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const bodyTypes = ['Slim', 'Curvy', 'Athletic', 'Average', 'Overweight', 'Other'];

const BodyType = () => {
  // const [selectBodyTypes, setSelectBodyTypes] = useState<string[]>([]);

  const {selectBodyTypes, setSelectBodyTypes} = useContext(AppContext)

  const toggleSelection = (type: string) => {
    if (selectBodyTypes.includes(type)) {
      setSelectBodyTypes(selectBodyTypes.filter(item => item !== type));
    } else {
      setSelectBodyTypes([...selectBodyTypes, type]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Body type</Text>
      <View style={styles.optionsWrapper}>
        {bodyTypes.map((type, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              selectBodyTypes.includes(type) && styles.optionSelected
            ]}
            onPress={() => toggleSelection(type)}
          >
            <Text style={[
              styles.optionText,
              selectBodyTypes.includes(type) && styles.optionTextSelected
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    color: '#222',
  },
  optionsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: '#d33',
    // borderColor: '#222',
  },
  optionText: {
    fontSize: 15,
    color: '#222',
  },
  optionTextSelected: {
    color: '#fff',
  },
});

export default BodyType;
