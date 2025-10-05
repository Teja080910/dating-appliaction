import React, {useContext, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Button,
  Pressable,
} from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootParamList} from '../../utils/types/navigation.types';

interface UserCardProps {
  name: string;
  age: number;
  image: string;
  distance: string;
}

const CARD_WIDTH = (Dimensions.get('window').width - 45) / 2;

const UserCard = ({name, age, image, distance}: UserCardProps) => {
  const navigation =
    useNavigation<StackNavigationProp<RootParamList, 'ViewMyProfileScreen'>>();
  const {
    viewMyProfile,
    setViewMyProfile,
    setSelectedUserImage,
    cardUserName,
    setCardUserName,
    cardUserAge,
    setCardUserAge,
  } = useContext(AppContext);
  // useEffect(() => {
  //   console.log('View My Profile:', viewMyProfile);

  // },[viewMyProfile])
    


  const handleUserCard = () => {
    console.log('User details:', name, age, image, distance);

    setCardUserName(name);
    setCardUserAge(age);

    setViewMyProfile(false);
    setSelectedUserImage(image);
    navigation.navigate('ViewMyProfileScreen');
  };
  return (
    <Pressable onPress={handleUserCard}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={{uri: image}} style={styles.image} />
          <View style={styles.overlayText}>
            <Text style={styles.name}>
              {name}, {age}
            </Text>
            <Text style={styles.distance}>{distance}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 15,
    marginHorizontal: 7.5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 170,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  overlayText: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'trasparent',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  distance: {
    color: 'white',
  },
});

export default UserCard;
