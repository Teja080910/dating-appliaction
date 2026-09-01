import React, { useContext, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getGender } from '../../utils/types/AsyncStorage';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

interface ShowMeProps {
  onChange?: (val: string[]) => void;
}

const ShowMe: React.FC<ShowMeProps> = ({ onChange }) => {
  const { showMe, setShowMe } = useContext(AppContext);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    const fetchGender = async () => {
      try {
        const gender = await getGender();
        const initialShow = gender === 'straight_man' ? 'straight_woman' : 'straight_man';
        setShowMe(initialShow);
        if (onChange) onChange([initialShow]);
        initialized.current = true;
      } catch (error) {
        console.error('Error fetching gender:', error);
      }
    };
    fetchGender();
  }, []);

  const handleSelect = (val: 'straight_man' | 'straight_woman') => {
    setShowMe(val);
    if (onChange) onChange([val]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Show me:</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, showMe === 'straight_man' && styles.selectedButton]}
          onPress={() => handleSelect('straight_man')}
        >
          <Text style={[styles.buttonText, showMe === 'straight_man' && styles.selectedText]}>
            Only men
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, showMe === 'straight_woman' && styles.selectedButton]}
          onPress={() => handleSelect('straight_woman')}
        >
          <Text style={[styles.buttonText, showMe === 'straight_woman' && styles.selectedText]}>
            Only women
          </Text>
        </TouchableOpacity>
      </View>
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
  label: {
    fontSize: 15,
    marginBottom: Spacing.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.radiusFull,
    borderWidth: 1.5,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.inputBackground,
    marginRight: Spacing.md,
  },
  selectedButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  buttonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: Colors.white,
  },
});

export default ShowMe;
