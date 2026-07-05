import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DatePicker from 'react-native-date-picker';
import AppContext from '../../context/CreateGlobalStateContext';
import { calculateAge } from '../../utils/dateUtils';

const AgeSelector = () => {
  const { date, setDate } = useContext(AppContext);
  const [open, setOpen] = useState(false);

  const age = date ? calculateAge(date) : 0;
  const formattedDate = date ? date.toLocaleDateString('en-GB') : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Age: {age}</Text>
      <TouchableOpacity style={styles.dateDisplay} onPress={() => setOpen(true)}>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </TouchableOpacity>
      <DatePicker
        modal
        open={open}
        date={date || new Date(2004, 9, 7)}
        mode="date"
        maximumDate={new Date()}
        onConfirm={(selectedDate) => {
          setOpen(false);
          setDate(selectedDate);
        }}
        onCancel={() => setOpen(false)}
      />
    </View>
  );
};

export default AgeSelector;

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  dateDisplay: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
});
