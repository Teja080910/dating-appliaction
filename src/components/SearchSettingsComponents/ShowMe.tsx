import React, { useContext, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getGender } from '../../utils/types/AsyncStorage';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';

interface ShowMeProps {
  onChange?: (val: string[]) => void;
}

const ShowMe: React.FC<ShowMeProps> = ({ onChange }) => {
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { showMe, setShowMe } = useContext(AppContext);
  const initialized = useRef(false);

  const isMenSelected = showMe === 'straight_man' || (showMe as any) === 'Male' || (showMe as any) === 'man';
  const isWomenSelected = showMe === 'straight_woman' || (showMe as any) === 'Female' || (showMe as any) === 'woman';

  useEffect(() => {
    if (initialized.current) return;
    if (showMe) {
      if (onChange) onChange([isMenSelected ? 'Male' : 'Female']);
      initialized.current = true;
      return;
    }
    const fetchGender = async () => {
      try {
        const userGender = await getGender();
        const initialShow = userGender === 'straight_man' || userGender === 'Male' ? 'straight_woman' : 'straight_man';
        setShowMe(initialShow);
        if (onChange) onChange([initialShow === 'straight_man' ? 'Male' : 'Female']);
        initialized.current = true;
      } catch (error) {
        console.error('Error fetching gender:', error);
      }
    };
    fetchGender();
  }, [showMe]);

  const handleSelect = (val: 'straight_man' | 'straight_woman') => {
    setShowMe(val);
    if (onChange) onChange([val === 'straight_man' ? 'Male' : 'Female']);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Show me:</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, isWomenSelected && styles.selectedButton]}
          onPress={() => handleSelect('straight_woman')}
        >
          <Text style={[styles.buttonText, isWomenSelected && styles.selectedText]}>
            Women
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isMenSelected && styles.selectedButton]}
          onPress={() => handleSelect('straight_man')}
        >
          <Text style={[styles.buttonText, isMenSelected && styles.selectedText]}>
            Men
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: Spacing.xl,
      backgroundColor: themeColors.surface,
      marginHorizontal: Spacing.screenPaddingHorizontal,
      marginTop: Spacing.lg,
      borderRadius: Spacing.radiusXl,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    label: {
      fontSize: 15,
      marginBottom: Spacing.md,
      fontWeight: '600',
      color: themeColors.textSecondary,
    },
    buttonGroup: {
      flexDirection: 'row',
    },
    button: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: Spacing.radiusFull,
      borderWidth: 1.5,
      borderColor: themeColors.borderLight,
      backgroundColor: themeColors.surfaceLight,
      marginRight: Spacing.md,
    },
    selectedButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    buttonText: {
      color: themeColors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    selectedText: {
      color: '#FFFFFF',
    },
  });

export default ShowMe;
