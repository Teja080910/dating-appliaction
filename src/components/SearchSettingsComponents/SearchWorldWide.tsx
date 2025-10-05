import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckBox } from 'react-native-elements';
import AppContext from '../../context/CreateGlobalStateContext';

const SearchWorldWide = () => {
  // const [isChecked, setIsChecked] = useState(false);
  const { isChecked, setIsChecked} = useContext(AppContext)

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setIsChecked(!isChecked)}>
        <CheckBox
          checked={isChecked}
          onPress={() => setIsChecked(!isChecked)}
          checkedColor="#e94e77"
          containerStyle={styles.checkboxContainer}
          
        />
      </TouchableOpacity>

      <Text style={styles.label}>Search World Wide</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  checkboxContainer: {
    padding: 0,
    margin: 0,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginLeft: 5,
  },
});

export default SearchWorldWide;
