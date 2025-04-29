// import React, { useContext, useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import AppContext from '../../context/CreateGlobalStateContext';

// const bodyTypes = ['Slim', 'Muscular', 'Athletic', 'Average', 'Overweight', 'Other'];

// const BodyTypeSelector = () => {
//   const { selectedBodyType, setSelectedBodyType } = useContext(AppContext);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.label}>Your body type</Text>
//       <View style={styles.optionsContainer}>
//         {bodyTypes.map((type) => (
//           <TouchableOpacity
//             key={type}
//             style={[styles.option, selectedBodyType === type && styles.selectedOption]}
//             onPress={() => setSelectedBodyType(type)}
//           >
//             <Text style={[styles.optionText, selectedBodyType === type && styles.selectedOptionText]}>
//               {type}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>
//     </View>
//   );
// };

// export default BodyTypeSelector;

// const styles = StyleSheet.create({
//   container: { marginVertical: 16, paddingHorizontal: 16 },
//   label: { fontSize: 16, marginBottom: 10 },
//   optionsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
//   option: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 20,
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     margin: 6,
//   },
//   selectedOption: {
//     backgroundColor: '#d33',
//     borderColor: '#d33',
//   },
//   optionText: {
//     color: '#333',
//   },
//   selectedOptionText: {
//     color: '#fff',
//   },
// });



import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const bodyTypes = ['Slim', 'Muscular', 'Athletic', 'Average', 'Overweight', 'Other'];

const BodyTypeSelector = () => {
  const { selectedBodyType, setSelectedBodyType } = useContext(AppContext);

  const toggleBodyType = (type: string) => {
    console.log('You clicked:', type);
    console.log('Before click, selectedBodyType:', selectedBodyType);

    if (selectedBodyType === type) {
      // If already selected, deselect
      console.log('After removing: null');
      setSelectedBodyType(null);
    } else {
      // Otherwise, select this one
      console.log('After adding:', type);
      setSelectedBodyType(type);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your body type</Text>
      <View style={styles.optionsContainer}>
        {bodyTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.option,
              selectedBodyType === type && styles.selectedOption
            ]}
            onPress={() => toggleBodyType(type)}
          >
            <Text
              style={[
                styles.optionText,
                selectedBodyType === type && styles.selectedOptionText
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default BodyTypeSelector;

const styles = StyleSheet.create({
  container: { marginVertical: 16, paddingHorizontal: 16 },
  label: { fontSize: 16, marginBottom: 10 },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  option: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 6,
  },
  selectedOption: {
    backgroundColor: '#d33',
    borderColor: '#d33',
  },
  optionText: {
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
});

