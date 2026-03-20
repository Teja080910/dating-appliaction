import {
  FlatList,
  Image,
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  Text,
  ScrollView,
} from "react-native";
import React, { useContext, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AppContext from "../../context/CreateGlobalStateContext";
import UserDetails from "../../components/ProfileTabComponents/ViewMyProfile/UserDetails";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ViewMyProfileScreen = () => {
  const navigation = useNavigation();
  const { 
    images, 
    viewMyProfile, 
    selectedUserImage, 
    cardUserName, 
    cardUserAge 
  } = useContext(AppContext);
  
  const flatlistRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // If viewing someone else, we likely only have one image in mock logic, 
  // but let's assume images array is used if available.
  const displayImages = viewMyProfile 
    ? images?.filter((img) => img && img.trim() !== '')?.map((img: string, index: number) => ({ id: index.toString(), uri: img }))
    : [{ id: '0', uri: selectedUserImage }];

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setActiveIndex(index);
  };

  const renderItem = ({ item }) => (
    <View style={{ width: screenWidth, height: 500 }}>
      <Image 
        source={{ uri: item.uri }} 
        style={styles.image} 
        resizeMode="cover" 
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.sliderWrapper}>
            <FlatList
              ref={flatlistRef}
              data={displayImages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              onScroll={handleScroll}
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={screenWidth}
              snapToAlignment="center"
              bounces={false}
            />

            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Icon name="chevron-left" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Dots Overlay */}
            {displayImages.length > 1 && (
                <View style={styles.dotsContainer}>
                {displayImages.map((_, index) => (
                    <View
                    key={index}
                    style={[
                        styles.dot,
                        { 
                        backgroundColor: index === activeIndex ? "#FF5A79" : "rgba(255,255,255,0.7)",
                        width: index === activeIndex ? 18 : 6 
                        },
                    ]}
                    />
                ))}
                </View>
            )}
          </View>

          <UserDetails />
      </ScrollView>
    </View>
  );
};

export default ViewMyProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  sliderWrapper: {
    width: "100%",
    height: 500,
    backgroundColor: '#000',
  },
  image: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 40, // Above UserDetails overlap
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  actionFooter: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 30,
      paddingHorizontal: 20,
  },
  actionBtn: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 8,
  },
  dislikeBtn: {},
  likeBtn: {},
});