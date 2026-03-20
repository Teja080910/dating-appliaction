import React, {useContext} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootParamList} from '../../utils/types/navigation.types';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

interface UserCardProps {
  name: string;
  age: number;
  image: string;
  distance: string;
  isOnline?: boolean;
  isNew?: boolean;
}

const CARD_WIDTH = (Dimensions.get('window').width - 45) / 2;

const UserCard = ({name, age, image, distance, isOnline, isNew}: UserCardProps) => {
  const navigation =
    useNavigation<StackNavigationProp<RootParamList, 'ViewMyProfileScreen'>>();
  const {
    setViewMyProfile,
    setSelectedUserImage,
    setCardUserName,
    setCardUserAge,
  } = useContext(AppContext);

  const handleUserCard = () => {
    setCardUserName(name);
    setCardUserAge(age);
    setViewMyProfile(false);
    setSelectedUserImage(image);
    navigation.navigate('ViewMyProfileScreen');
  };

  return (
    <Pressable onPress={handleUserCard}>
      <View style={styles.card}>
        <Image source={{uri: image}} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {name}, <Text style={styles.age}>{age}</Text>
              </Text>
              <Icon name="check-circle" size={14} color="#fff" style={styles.verifiedIcon} />
            </View>
            <View style={styles.statusRow}>
              {isOnline && (
                <View style={styles.onlineContainer}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.statusText}>Recently online</Text>
                </View>
              )}
              {isNew && (
                <View style={styles.newContainer}>
                  <Text style={styles.statusText}>New</Text>
                </View>
              )}
            </View>
            <View style={styles.distanceRow}>
              <Icon name="navigation" size={12} color="#fff" style={styles.navIcon} />
              <Text style={styles.distance}>{distance}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 240,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    padding: 12,
  },
  infoContainer: {
    flexDirection: 'column',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  age: {
    fontWeight: 'normal',
  },
  verifiedIcon: {
    marginLeft: 6,
    marginTop: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navIcon: {
    marginRight: 4,
    transform: [{ rotate: '45deg' }],
  },
  distance: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ECC71',
    marginRight: 4,
  },
  newContainer: {
    backgroundColor: '#FF1493',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default UserCard;
