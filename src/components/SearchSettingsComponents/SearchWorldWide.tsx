import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckBox } from 'react-native-elements';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

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
    if (onToggle) onToggle(newVal);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleToggle} activeOpacity={0.7} style={styles.checkRow}>
        <CheckBox
          checked={isChecked}
          onPress={handleToggle}
          checkedColor={Colors.primary}
          containerStyle={styles.checkboxContainer}
        />
        <Text style={styles.label}>Search World Wide</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginTop: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    padding: 0,
    margin: 0,
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
});

export default SearchWorldWide;
