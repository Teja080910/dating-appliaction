import {Button, StyleSheet, Text, TouchableOpacity, View, Modal} from 'react-native';
import React, { useContext } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import {handleImagePick} from '../onboarding/ImagePickerModal';

const ModalAddPhoto = () => {
  const {isModalVisible, setIsModalVisible, selectedIndex, images, setImages, profileImage, setProfileImage} = useContext(AppContext);
    const onPickImage = async (type: 'camera' | 'gallery') => {
      await handleImagePick(type, selectedIndex, images, setImages, setIsModalVisible, profileImage, setProfileImage);
    };
  return (
    <Modal visible={isModalVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Add Photo</Text>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => onPickImage('gallery')}>
            <Text>📁 Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => onPickImage('camera')}>
            <Text>📷 Use Camera</Text>
          </TouchableOpacity>
          <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
        </View>
      </View>
    </Modal>
  );
};

export default ModalAddPhoto;

const styles = StyleSheet.create({
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
