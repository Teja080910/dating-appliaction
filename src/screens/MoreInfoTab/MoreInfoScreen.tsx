// import React from 'react';
// import { View, StyleSheet, ScrollView, Button, TouchableOpacity, Text } from 'react-native';
// import Header from '../../components/MoreInfoTabComponents/Header';
// import HeightSelector from '../../components/MoreInfoTabComponents/HeightSelector';
// import BodyTypeSelector from '../../components/MoreInfoTabComponents/BodyTypeSelector';
// import AppearanceSelector from '../../components/MoreInfoTabComponents/AppearanceSelector';
// import LanguagesSelector from '../../components/MoreInfoTabComponents/LanguagesSelector';

// const MoreInfoScreen = () => {
//   return (
//     <View style={styles.container}>
//       <Header />
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <HeightSelector />
//         <BodyTypeSelector />
//         <AppearanceSelector />
//         <LanguagesSelector />
//         {/* <View style={{ marginHorizontal: 16, marginTop: 24 }}>
//           <Button title="Save" color="#d33" onPress={() => {}} />
//         </View> */}
//       </ScrollView>
//       <TouchableOpacity style={styles.saveButton}>
//         <Text style={styles.saveButtonText}>Save</Text>
//       </TouchableOpacity>

//     </View>
//   );
// };

// export default MoreInfoScreen;

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: '#fff' 
//   },
//   scrollContent: { 
//     paddingBottom: 20 
//   },
//   saveButton: {
//     position: 'absolute',
//     bottom: 80,
//     left: 20,
//     right: 20,
//     backgroundColor: '#D9534F',
//     paddingVertical: 16,
//     borderRadius: 10,
//     alignItems: 'center',
//   },
//   scrollContent: { 
//     paddingBottom: 150,
//   },
// });






import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import Header from '../../components/MoreInfoTabComponents/Header';
import HeightSelector from '../../components/MoreInfoTabComponents/HeightSelector';
import BodyTypeSelector from '../../components/MoreInfoTabComponents/BodyTypeSelector';
import AppearanceSelector from '../../components/MoreInfoTabComponents/AppearanceSelector';
import LanguagesSelector from '../../components/MoreInfoTabComponents/LanguagesSelector';
import EnglishSkillSelector from '../../components/MoreInfoTabComponents/EnglishSkillSelector';
import EthnicitySelector from '../../components/MoreInfoTabComponents/EthnicitySelector';
import DoYouSmokeSelector from '../../components/MoreInfoTabComponents/DoYouSmokeSelector';
import KidsCountSelector from '../../components/MoreInfoTabComponents/KidsCountSelector';
import LookingForSelector from '../../components/MoreInfoTabComponents/LookingForSelector';
import NetWorthSelector from '../../components/MoreInfoTabComponents/NetWorthSelector';

const MoreInfoScreen = () => {
  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <HeightSelector />
        <BodyTypeSelector />
        <AppearanceSelector />
        <LanguagesSelector />
        <EnglishSkillSelector />
        <EthnicitySelector />
        <DoYouSmokeSelector />
        <KidsCountSelector />
        <LookingForSelector />
        <NetWorthSelector />
       
      </ScrollView>
      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MoreInfoScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContent: { 
    paddingBottom: 150, // Only this one is needed
  },
  saveButton: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#D9534F',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
