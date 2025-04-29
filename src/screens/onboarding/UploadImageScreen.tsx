// // UploadPhotosScreen.tsx

// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, Image, StyleSheet, Modal, Alert, Button } from 'react-native';
// import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

// import { handleImagePick } from '../../components/ImagePickerModal';

// const UploadPhotosScreen = ({navigation}: any) => {
//   const [images, setImages] = useState<(string | null)[]>([null, null, null, null, null, null]);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

//   const handleImagePick = async (type: 'camera' | 'gallery') => {
//     const options = { mediaType: 'photo', quality: 1 };

//     try {
//       const result =
//         type === 'camera'
//           ? await launchCamera(options)
//           : await launchImageLibrary(options);

//       if (result.assets && result.assets.length > 0) {
//         const uri = result.assets[0].uri;
//         if (uri && selectedIndex !== null) {
//           const newImages = [...images];
//           newImages[selectedIndex] = uri;
//           setImages(newImages);
//         }
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Something went wrong');
//     } finally {
//       setIsModalVisible(false);
//     }
//   };

//   const openImageOptions = (index: number) => {
//     setSelectedIndex(index);
//     setIsModalVisible(true);
//   };

//   const uploadedImagesCount = images.filter((img) => img !== null).length;

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Nice to meet you Gsg :-)</Text>
//       <Text style={styles.subtitle}>
//         Please upload at least 3 photos, including at least one clear picture of your face.
//       </Text>

//       <View style={styles.grid}>
//         {images.map((img, index) => (
//           <TouchableOpacity key={index} style={styles.imageBox} onPress={() => openImageOptions(index)}>
//             {img ? (
//               <Image source={{ uri: img }} style={styles.image} />
//             ) : (
//               <View style={styles.iconContainer}>
//                 <Text style={styles.cameraIcon}>📷</Text>
//                 <View style={styles.plusBadge}>
//                   <Text style={styles.plusText}>+</Text>
//                 </View>
//               </View>
//             )}
//           </TouchableOpacity>
//         ))}
//       </View>

//       <Text style={styles.warning}>
//         Please no nudity, filters, text, screenshots, or images without you.
//       </Text>

//       <TouchableOpacity
//         style={[styles.nextButton, { backgroundColor: uploadedImagesCount >= 3 ? '#d63d4c' : '#ccc' }]}
//         disabled={uploadedImagesCount < 3}
//         onPress={() => 
//           navigation.replace('Home')
//         }
//       >
//         <Text style={styles.nextText}>Next</Text>
//       </TouchableOpacity>

//       {/* Popup Modal */}
//       <Modal visible={isModalVisible} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.modalBox}>
//             <Text style={styles.modalTitle}>Add Photo</Text>
//             <TouchableOpacity style={styles.modalOption} onPress={() => handleImagePick('gallery')}>
//               <Text>📁 Upload</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.modalOption} onPress={() => handleImagePick('camera')}>
//               <Text>📷 Use Camera</Text>
//             </TouchableOpacity>
//             <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1,
//     padding: 20, 
//     backgroundColor: '#fff' 
//   },
//   title: { 
//     fontSize: 22, 
//     fontWeight: 'bold', 
//     marginVertical: 10 
//   },
//   subtitle: { 
//     fontSize: 14, 
//     color: '#666', 
//     marginBottom: 20 
//   },
//   grid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   imageBox: {
//     width: '30%',
//     aspectRatio: 1,
//     backgroundColor: '#f2f2f2',
//     marginVertical: 10,
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   iconContainer: { 
//     alignItems: 'center', 
//     justifyContent: 'center' 
//   },
//   cameraIcon: { 
//     fontSize: 24 
//   },
//   plusBadge: {
//     position: 'absolute',
//     top: -2,
//     right: -2,
//     backgroundColor: '#d63d4c',
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   plusText: { 
//     color: 'white', 
//     fontSize: 12, 
//     fontWeight: 'bold' 
//   },
//   image: { 
//     width: '100%', 
//     height: '100%', 
//     borderRadius: 10 
//   },
//   warning: { 
//     fontSize: 12, 
//     color: '#aaa', 
//     marginTop: 10 
//   },
//   nextButton: {
//     padding: 15,
//     borderRadius: 30,
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   nextText: { 
//     color: 'white', 
//     fontWeight: 'bold', 
//     fontSize: 16 
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.4)',
//     justifyContent: 'flex-end',
//   },
//   modalBox: {
//     backgroundColor: '#fff',
//     padding: 20,
//     borderTopRightRadius: 20,
//     borderTopLeftRadius: 20,
//   },
//   modalTitle: { 
//     fontSize: 18, 
//     fontWeight: 'bold', 
//     marginBottom: 10 
//   },
//   modalOption: { 
//     paddingVertical: 10 
//   },
// });


// export default UploadPhotosScreen;











import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Alert,
  Button,
  BackHandler,
} from 'react-native';
// import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { handleImagePick } from '../../components/onboarding/ImagePickerModal';
import AppContext from '../../context/CreateGlobalStateContext';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UploadPhotosScreen =  ({ navigation }: any) => {
 

  const { images, setImages, isModalVisible, setIsModalVisible, selectedIndex, setSelectedIndex, name, login } = useContext(AppContext);

  // const isLoggedIn = await AsyncStorage.getItem('isLoggedIn')
  
  // console.log('isLoggedIn', isLoggedIn );
  

  // if(login  === 'true' )
  // {
  //   useFocusEffect( 
  //     useCallback( () => {
  
  //       const onBackPress = () => {
  //         navigation.replace('DisplayName')
  //         return true;
  
  //       }
  //       const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
  //       return () => backHandler.remove();
  //     }, [navigation])
  //   ) 
  
  // }


  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        AsyncStorage.getItem('isLoggedIn').then((isLoggedIn) => {
          console.log('isLoggedIn', isLoggedIn);
          if (isLoggedIn === 'true') {
            navigation.replace('DisplayName');
          }
          else{
            navigation.replace('DOB');
          }
        });

        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation])
  );
 
  const onPickImage = async (type: 'camera' | 'gallery') => {
    await handleImagePick(type, selectedIndex, images, setImages, setIsModalVisible);
  };

  const openImageOptions = (index: number) => {
    setSelectedIndex(index);
    setIsModalVisible(true);
  };

  const uploadedImagesCount = images.filter((img: any) => img !== null).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nice to meet you {name} :-)</Text>
      <Text style={styles.subtitle}>
        Please upload at least 3 photos, including at least one clear picture
        of your face.
      </Text>

      <View style={styles.grid}>
        {images.map((img, index) => (
          <TouchableOpacity
            key={index}
            style={styles.imageBox}
            onPress={() => openImageOptions(index)}
          >
            {img ? (
              <Image source={{ uri: img }} style={styles.image} />
            ) : (
              <View style={styles.iconContainer}>
                <Text style={styles.cameraIcon}>📷</Text>
                <View style={styles.plusBadge}>
                  <Text style={styles.plusText}>+</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.warning}>
        Please no nudity, filters, text, screenshots, or images without you.
      </Text>

      <TouchableOpacity
        style={[
          styles.nextButton,
          { backgroundColor: uploadedImagesCount >= 3 ? '#d63d4c' : '#ccc' },
        ]}
        disabled={uploadedImagesCount < 3}
        onPress={() => navigation.navigate('BottomTabs')}
      >
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>

      {/* Popup Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Photo</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => onPickImage('gallery')}
            >
              <Text>📁 Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => onPickImage('camera')}
            >
              <Text>📷 Use Camera</Text>
            </TouchableOpacity>
            <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageBox: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f2f2f2',
    marginVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 24,
  },
  plusBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#d63d4c',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  warning: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 10,
  },
  nextButton: {
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  nextText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalOption: {
    paddingVertical: 10,
  },
});

export default UploadPhotosScreen;
