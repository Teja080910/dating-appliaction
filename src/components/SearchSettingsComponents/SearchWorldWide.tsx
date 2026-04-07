import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckBox } from 'react-native-elements';
import AppContext from '../../context/CreateGlobalStateContext';

interface SearchWorldWideProps {
  onToggle?: (val: boolean) => void;
}

const SearchWorldWide: React.FC<SearchWorldWideProps> = ({ onToggle }) => {
  const { isChecked, setIsChecked, isSubscribed, setPaywallVisible } = useContext(AppContext);

  const handleToggle = () => {
    if (!isSubscribed) {
      setPaywallVisible(true);
      return;
    }
    const newVal = !isChecked;
    setIsChecked(newVal);
    if (onToggle) {
      onToggle(newVal);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleToggle} activeOpacity={0.7}>
        <CheckBox
          checked={isChecked}
          onPress={handleToggle}
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
