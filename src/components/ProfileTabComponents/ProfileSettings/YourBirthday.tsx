import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DatePicker from 'react-native-date-picker';
import AppContext from '../../../context/CreateGlobalStateContext';

const YourBirthday = () => {
  const { date, setDate } = useContext(AppContext);
  const [open, setOpen] = useState(false);

  const formatDate = (dateObj: Date) => {
    const day = ('0' + dateObj.getDate()).slice(-2);
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your birthday</Text>
      <Text style={styles.subtitle}>When were you born?</Text>

      <TouchableOpacity style={styles.inputBox} onPress={() => setOpen(true)}>
        <Text style={styles.dateText}>{formatDate(date)}</Text>
      </TouchableOpacity>

      <DatePicker
        modal
        open={open}
        date={date}
        mode="date"
        onConfirm={(selectedDate) => {
          setOpen(false);
          setDate(selectedDate);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </View>
  );
};

export default YourBirthday;

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
