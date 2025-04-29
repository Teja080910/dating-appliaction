// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   SafeAreaView,
//   StatusBar,
//   Platform,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/FontAwesome5';
// import { Picker } from '@react-native-picker/picker';

// const DOBScreen = ({ navigation }: any) => {
//   const [selectedDay, setSelectedDay] = useState(11);
//   const [selectedMonth, setSelectedMonth] = useState('April');
//   const [selectedYear, setSelectedYear] = useState(1995);

//   const days = Array.from({ length: 31 }, (_, i) => i + 1);
//   const months = ['January', 'February', 'March', 'April', 'May', 'June'];
//   const years = Array.from({ length: 30 }, (_, i) => 1993 + i);

//   const handleNext = () => {
//     // You can add DOB validation here if needed
//     navigation.navigate('Home'); // Replace with your next screen
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//       {/* Progress Bar */}
//       <View style={styles.progressBarContainer}>
//         <View style={styles.progressBarFill} />
//       </View>

//       {/* Title */}
//       <Text style={styles.title}>When are you born?</Text>

//       {/* Picker Row */}
//       <View style={styles.pickerRow}>
//         <Picker
//           selectedValue={selectedMonth}
//           style={styles.picker}
//           onValueChange={(itemValue) => setSelectedMonth(itemValue)}
//         >
//           {months.map((month) => (
//             <Picker.Item key={month} label={month} value={month} />
//           ))}
//         </Picker>

//         <Picker
//           selectedValue={selectedDay}
//           style={styles.picker}
//           onValueChange={(itemValue) => setSelectedDay(itemValue)}
//         >
//           {days.map((day) => (
//             <Picker.Item key={day} label={String(day)} value={day} />
//           ))}
//         </Picker>

//         <Picker
//           selectedValue={selectedYear}
//           style={styles.picker}
//           onValueChange={(itemValue) => setSelectedYear(itemValue)}
//         >
//           {years.map((year) => (
//             <Picker.Item key={year} label={String(year)} value={year} />
//           ))}
//         </Picker>
//       </View>

//       {/* Bottom Section */}
//       <View style={styles.bottomContainer}>
//         <View style={styles.infoContainer}>
//           <Icon name="info-circle" size={16} color="#999" />
//           <Text style={styles.infoText}>
//             Did you know that you have 100% privacy at Glambu? Only the people
//             who have you sent an invitation will be able to view your profile!
//           </Text>
//         </View>

//         <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
//           <Text style={styles.nextButtonText}>Next</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default DOBScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     paddingHorizontal: 24,
//   },
//   progressBarContainer: {
//     height: 5,
//     backgroundColor: '#e0e0e0',
//     marginTop: 10,
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   progressBarFill: {
//     width: '25%',
//     height: '100%',
//     backgroundColor: '#E94057',
//   },
//   title: {
//     marginTop: 30,
//     fontSize: 22,
//     fontWeight: '700',
//     color: '#333',
//     textAlign: 'center',
//   },
//   pickerRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 40,
//     marginBottom: 20,
//   },
//   picker: {
//     flex: 1,
//     height: Platform.OS === 'ios' ? 160 : 50,
//   },
//   bottomContainer: {
//     marginTop: 'auto',
//     paddingBottom: 30,
//   },
//   infoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//     gap: 8,
//   },
//   infoText: {
//     fontSize: 12,
//     color: '#999',
//     flex: 1,
//   },
//   nextButton: {
//     backgroundColor: '#E94057',
//     paddingVertical: 16,
//     borderRadius: 999,
//     alignItems: 'center',
//   },
//   nextButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 16,
//   },
// });






// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   SafeAreaView,
//   StatusBar,
//   Platform,
// } from 'react-native';
// import DatePicker from 'react-native-date-picker';
// import Icon from 'react-native-vector-icons/FontAwesome5';

// const DOBScreen = ({ navigation }: any) => {
//   const [date, setDate] = useState(new Date(1995, 3, 11)); // April is month 3
//   const [open, setOpen] = useState(false); // optional, for modal style if needed

//   const handleNext = () => {
//     // Format and send the date if needed
//     navigation.navigate('Home'); // replace 'Home' with your next screen
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//       {/* Progress Bar */}
//       <View style={styles.progressBarContainer}>
//         <View style={styles.progressBarFill} />
//       </View>

//       {/* Title */}
//       <Text style={styles.title}>When’s your birthday?</Text>

//       {/* Subtitle */}
//       <Text style={styles.subtitle}>This won’t be shown on your profile.</Text>

//       {/* Date Picker Wheel */}
//       <View style={styles.datePickerWrapper}>
//         <DatePicker
//           date={date}
//           onDateChange={setDate}
//           mode="date"
//           androidVariant="iosClone"
//           textColor="#000"
//           fadeToColor="none"
//         />
//       </View>

//       {/* Bottom Info */}
//       <View style={styles.bottomContainer}>
//         <View style={styles.infoContainer}>
//           <Icon name="info-circle" size={14} color="#999" />
//           <Text style={styles.infoText}>
//             Did you know that you have 100% privacy at Glambu? Only the people
//             who have you sent an invitation will be able to view your profile!
//           </Text>
//         </View>

//         {/* Next Button */}
//         <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
//           <Text style={styles.nextButtonText}>Continue</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default DOBScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     paddingHorizontal: 24,
//   },
//   progressBarContainer: {
//     height: 5,
//     backgroundColor: '#eee',
//     marginTop: 10,
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   progressBarFill: {
//     width: '60%',
//     height: '100%',
//     backgroundColor: '#E94057',
//   },
//   title: {
//     marginTop: 30,
//     fontSize: 26,
//     fontWeight: '700',
//     textAlign: 'center',
//     color: '#000',
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//     marginTop: 8,
//   },
//   datePickerWrapper: {
//     marginTop: 40,
//     alignItems: 'center',
//   },
//   bottomContainer: {
//     marginTop: 'auto',
//     paddingBottom: 30,
//   },
//   infoContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: 8,
//     marginBottom: 20,
//   },
//   infoText: {
//     fontSize: 12,
//     color: '#999',
//     flex: 1,
//   },
//   nextButton: {
//     backgroundColor: '#E94057',
//     paddingVertical: 16,
//     borderRadius: 999,
//     alignItems: 'center',
//   },
//   nextButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 16,
//   },
// });












// import React, { useContext, useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   SafeAreaView,
//   StatusBar,
//   Platform,
// } from 'react-native';
// import DatePicker from 'react-native-date-picker';
// import Icon from 'react-native-vector-icons/FontAwesome5';
// import AppContext from '../../context/CreateGlobalStateContext';

// const DOBScreen = ({ navigation }: any) => {
//   // const [date, setDate] = useState(new Date(1995, 3, 11)); // April 11, 1995

//   const { date, setDate} = useContext(AppContext);

//   const handleNext = () => {
//     // You can format the date here if needed before navigating
//     navigation.navigate('Home'); // Replace 'Home' with your actual next screen
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//       {/* Progress Bar */}
//       <View style={styles.progressBarContainer}>
//         <View style={styles.progressBarFill} />
//       </View>

//       {/* Title */}
//       <Text style={styles.title}>When’s your birthday?</Text>

//       {/* Subtitle */}
//       <Text style={styles.subtitle}>This won’t be shown on your profile.</Text>

//       {/* Date Picker */}
//       <View style={styles.datePickerWrapper}>
//         <DatePicker
//           date={date}
//           onDateChange={setDate}
//           mode="date"
//           androidVariant="iosClone" // ✅ Required for wheel-style on Android
//           textColor="#000"
//           fadeToColor="none"
//           locale="en"
//         />
//       </View>

//       {/* Bottom Info */}
//       <View style={styles.bottomContainer}>
//         <View style={styles.infoContainer}>
//           <Icon name="info-circle" size={14} color="#999" style={{ marginTop: 2 }} />
//           <Text style={styles.infoText}>
//             Did you know that you have 100% privacy at Glambu? Only the people
//             who you have sent an invitation to will be able to view your profile!
//           </Text>
//         </View>

//         {/* Continue Button */}
//         <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
//           <Text style={styles.nextButtonText}>Continue</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default DOBScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     paddingHorizontal: 24,
//   },
//   progressBarContainer: {
//     height: 5,
//     backgroundColor: '#eee',
//     marginTop: 10,
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   progressBarFill: {
//     width: '60%',
//     height: '100%',
//     backgroundColor: '#E94057',
//   },
//   title: {
//     marginTop: 30,
//     fontSize: 26,
//     fontWeight: '700',
//     textAlign: 'center',
//     color: '#000',
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//     marginTop: 8,
//   },
//   datePickerWrapper: {
//     marginTop: 40,
//     alignItems: 'center',
//   },
//   bottomContainer: {
//     marginTop: 'auto',
//     paddingBottom: 30,
//   },
//   infoContainer: {
//     flexDirection: 'row',
//     gap: 10,
//     alignItems: 'flex-start',
//     marginBottom: 20,
//   },
//   infoText: {
//     fontSize: 12,
//     color: '#999',
//     flex: 1,
//   },
//   nextButton: {
//     backgroundColor: '#E94057',
//     paddingVertical: 16,
//     borderRadius: 999,
//     alignItems: 'center',
//   },
//   nextButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 16,
//   },
// });










// import React, { useContext } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   SafeAreaView,
//   StatusBar,
// } from 'react-native';
// import DatePicker from 'react-native-date-picker';
// import Icon from 'react-native-vector-icons/FontAwesome5';
// import AppContext from '../../context/CreateGlobalStateContext';

// const DOBScreen = ({ navigation }: any) => {
//   const { date, setDate } = useContext(AppContext);

//   const handleNext = () => {
//     navigation.navigate('Home');
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />

//       {/* Progress Bar */}
//       <View style={styles.progressBarContainer}>
//         <View style={styles.progressBarFill} />
//       </View>

//       {/* Title */}
//       <Text style={styles.title}>When are you born?</Text>

//       {/* Date Picker directly below title */}
//       <View style={styles.datePickerWrapper}>
//         <DatePicker
//           date={date}
//           onDateChange={setDate}
//           mode="date"
//           androidVariant="iosClone" // wheel style
//           textColor="#000"
//           fadeToColor="none"
//           locale="en"
//         />
//       </View>

//       {/* Bottom Info */}
//       <View style={styles.bottomContainer}>
//         <View style={styles.infoContainer}>
//           <Icon name="info-circle" size={14} color="#999" style={{ marginTop: 2 }} />
//           <Text style={styles.infoText}>
//             Did you know that you have 100% privacy at Glambu? Only the people
//             who you have sent an invitation to will be able to view your profile!
//           </Text>
//         </View>

//         <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
//           <Text style={styles.nextButtonText}>Next</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default DOBScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     paddingHorizontal: 24,
//   },
//   progressBarContainer: {
//     height: 5,
//     backgroundColor: '#eee',
//     marginTop: 10,
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   progressBarFill: {
//     width: '60%',
//     height: '100%',
//     backgroundColor: '#E94057',
//   },
//   title: {
//     marginTop: 30,
//     fontSize: 26,
//     fontWeight: '700',
//     textAlign: 'center',
//     color: '#000',
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//     marginTop: 8,
//   },
//   datePickerWrapper: {
//     marginTop: 20,
//     alignItems: 'center',
//   },
//   bottomContainer: {
//     marginTop: 'auto',
//     paddingBottom: 30,
//   },
//   infoContainer: {
//     flexDirection: 'row',
//     gap: 10,
//     alignItems: 'flex-start',
//     marginBottom: 20,
//   },
//   infoText: {
//     fontSize: 12,
//     color: '#999',
//     flex: 1,
//   },
//   nextButton: {
//     backgroundColor: '#E94057',
//     paddingVertical: 16,
//     borderRadius: 999,
//     alignItems: 'center',
//   },
//   nextButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 16,
//   },
// });











import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AppContext from '../../context/CreateGlobalStateContext';
import { useFocusEffect } from '@react-navigation/native';

const DOBScreen = ({ navigation }: any) => {
  const { date, setDate } = useContext(AppContext);
  const [open, setOpen] = useState(false);

  const handleNext = () => {
    navigation.navigate('UploadImage'); // Replace with your next screen
  };

  useFocusEffect(
    useCallback( () => {
    
      const onBackPress = () => {
        navigation.replace('DisplayName')
        return true;
      }
      const backHandler = 
        BackHandler.addEventListener('hardwareBackPress', onBackPress)
        return () => backHandler.remove();
    },[navigation])
  )

  const formattedDate = date.toLocaleDateString('en-GB'); // format like "11/04/2025"

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarFill} />
      </View>

      {/* Title */}
      <Text style={styles.title}>When are you born?</Text>

      {/* Touchable Date Display */}
      <TouchableOpacity style={styles.dateDisplay} onPress={() => setOpen(true)}>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </TouchableOpacity>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={open}
        date={date}
        mode="date"
        onConfirm={(selectedDate) => {
          setOpen(false);
          setDate(selectedDate);
        }}
        onCancel={() => setOpen(false)}
      />

      {/* Bottom Info */}
      <View style={styles.bottomContainer}>
        <View style={styles.infoContainer}>
          <Icon name="info-circle" size={14} color="#999" style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            Did you know that you have 100% privacy at Dating? Only the people
            who you have sent an invitation to will be able to view your profile!
          </Text>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DOBScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  progressBarContainer: {
    height: 5,
    backgroundColor: '#eee',
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#E94057',
  },
  title: {
    marginTop: 30,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000',
  },
  dateDisplay: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  bottomContainer: {
    marginTop: 'auto',
    paddingBottom: 30,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#E94057',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
