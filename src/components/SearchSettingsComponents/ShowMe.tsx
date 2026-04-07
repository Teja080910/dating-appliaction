import React, { useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getGender } from '../../utils/types/AsyncStorage';
import AppContext from '../../context/CreateGlobalStateContext';

interface ShowMeProps {
  onChange?: (val: string[]) => void;
}

const ShowMe: React.FC<ShowMeProps> = ({ onChange }) => {
  const { showMe, setShowMe } = useContext(AppContext);

  useEffect(() => {
    const fetchGender = async () => {
      try {
        const gender = await getGender(); // 'male' or 'female'
        const initialShow = gender === 'straight_man' ? 'straight_woman' : 'straight_man';
        setShowMe(initialShow);
        if (onChange) {
          onChange([initialShow]);
        }
      } catch (error) {
        console.error('Error fetching gender:', error);
      }
    };

    fetchGender();
  }, [onChange, setShowMe]);

  const handleSelect = (val: 'straight_man' | 'straight_woman') => {
    setShowMe(val);
    if (onChange) {
      onChange([val]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Show me:</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.button,
            showMe === 'straight_man' && styles.selectedButton,
          ]}
          onPress={() => handleSelect('straight_man')}
        >
          <Text
            style={[
              styles.buttonText,
              showMe === 'straight_man' && styles.selectedText,
            ]}
          >
            Only men
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            showMe === 'straight_woman' && styles.selectedButton,
          ]}
          onPress={() => handleSelect('straight_woman')}
        >
          <Text
            style={[
              styles.buttonText,
              showMe === 'straight_woman' && styles.selectedText,
            ]}
          >
            Only women
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    marginRight: 10,
  },
  selectedButton: {
    backgroundColor: '#e53945',
    borderColor: '#e53945',
  },
  buttonText: {
    color: '#000',
    fontSize: 15,
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ShowMe;










