import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppContext from '../../../context/CreateGlobalStateContext';

const YourBirthday = () => {
  const { date, setDate } = useContext(AppContext);
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios'); // iOS keeps modal open, Android closes
    setDate(currentDate);
  };

  const formatDate = (dateObj) => {
    const day = ('0' + dateObj.getDate()).slice(-2);
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your birthday</Text>
      <Text style={styles.subtitle}>When were you born?</Text>

      <TouchableOpacity style={styles.inputBox} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="calendar"
          onChange={handleChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f2f2f2',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 15,
    color: '#9e9e9e',
    marginTop: 4,
    marginBottom: 12,
  },
  inputBox: {
    backgroundColor: '#f2f2f2',
    padding: 14,
    borderRadius: 8,
    borderColor: '#e2e2e2',
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
});

export default YourBirthday;
