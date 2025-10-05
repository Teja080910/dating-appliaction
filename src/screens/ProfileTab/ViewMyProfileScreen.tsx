import {
	FlatList,
	Image,
	StyleSheet,
	View,
	Dimensions,
} from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AppContext from "../../context/CreateGlobalStateContext";
import UserDetails from "../../components/ProfileTabComponents/ViewMyProfile/UserDetails";

const ViewMyProfileScreen = () => {
  const { viewMyProfile, images, selectedUserImage } = useContext(AppContext);
  const screenWidth = Dimensions.get("window").width;
  const flatlistRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    console.log('View My Profile ====>', viewMyProfile);
  }, [viewMyProfile])
  

  const validContextImages = images
    ?.filter((img) => img !== null && img !== undefined)
    ?.map((img: string, index: number) => ({ id: index.toString(), image: { uri: img } }));

  const carouselData = [
    { id: "01", image: require("../../assets/MessageTabImages/boy1.webp") },
    { id: "02", image: require("../../assets/MessageTabImages/boy2.webp") },
    { id: "03", image: require("../../assets/MessageTabImages/boy3.webp") },
    { id: "04", image: require("../../assets/MessageTabImages/girl1.webp") },
    { id: "05", image: require("../../assets/MessageTabImages/girl2.webp") },
    { id: "06", image: require("../../assets/MessageTabImages/girl3.webp") },
  ];

  let displayImages;

  if (!viewMyProfile && selectedUserImage) {
    displayImages = [{ id: "user", image: { uri: selectedUserImage } }];
  } else if (viewMyProfile && validContextImages?.length) {
    displayImages = validContextImages;
  } else {
    displayImages = carouselData;
  }

  const getItemLayout = (_: any, index: number) => ({
    length: screenWidth,
    offset: screenWidth * index,
    index,
  });

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setActiveIndex(index);
  };

  const renderItem = ({ item }) => (
    <View style={styles.imageContainer}>
      <View style={styles.dotsContainer}>
        {displayImages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === activeIndex ? "#007BFF" : "#ccc" },
            ]}
          />
        ))}
      </View>
      <Image source={item.image} style={styles.image} resizeMode="cover" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sliderWrapper}>
        <FlatList
          ref={flatlistRef}
          data={displayImages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          getItemLayout={getItemLayout}
          onScroll={handleScroll}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={screenWidth}
          snapToAlignment="center"
          bounces={false}
        />
      </View>
      <UserDetails />
    </SafeAreaView>
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
		height: 320,
		marginTop: 20,
	},
	imageContainer: {
	width: Dimensions.get("window").width,
	height: 420, // try increasing from 300 to 360 or 400
	position: "relative",

  // color: "red",
},

	image: {
	width: "100%",
	height: "100%",
	// alignSelf: "center",
    // borderBottomLeftRadius: 180
},

	dotsContainer: {
	position: "absolute",
	top: 300, // adjust as needed
	width: "100%",
	flexDirection: "row",
	justifyContent: "center",
	alignItems: "center",
	zIndex: 1,
},

	dot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginHorizontal: 5,
	},
});