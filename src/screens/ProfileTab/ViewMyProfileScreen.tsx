import {
  FlatList,
  StyleSheet,
  View,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthImage from "../../components/AuthImage";
import AppContext from "../../context/CreateGlobalStateContext";
import UserDetails from "../../components/ProfileTabComponents/ViewMyProfile/UserDetails";
import { connectionsApi } from "../../api/connectionsApi";
import { profileApi } from "../../api/profileApi";
import { AuthStorage } from "../../api/authStorage";
import { ProfileResponse, User } from "../../api/types";
import { APIURL } from "../../environment/ApiConfig";

const SCREEN_WIDTH = Dimensions.get("window").width;

const ViewMyProfileScreen = ({ route }: any) => {
  const { images } = useContext(AppContext);
  const flatlistRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const profileUserId = route?.params?.userId;
  const userData = route?.params?.userData as User | undefined;
  const hasValidId = !!(profileUserId && Number(profileUserId) > 0);
  const isOwnProfile = !route?.params?.userId && !userData;

  const profileImageUrl = userData?.profile?.profileImageUrl
    ? userData.profile.profileImageUrl.startsWith("http")
      ? userData.profile.profileImageUrl
      : `${APIURL}${userData.profile.profileImageUrl}`
    : "";

  const profileData: ProfileResponse = {
    id: userData?.id || 0,
    name: userData?.name || userData?.profile?.displayName || "",
    displayName: userData?.profile?.displayName || userData?.name || "",
    bio: userData?.profile?.bio || "",
    language: userData?.profile?.language || "",
    height: userData?.profile?.height ?? undefined,
    bodyType: userData?.profile?.bodyType || "",
    appearance: userData?.profile?.appearance || "",
    ethnicity: userData?.profile?.ethnicity || "",
    englishLevel: userData?.profile?.englishLevel || "",
    smoke: userData?.profile?.smoke || "",
    drink: userData?.profile?.drink || "",
    lookingFor: userData?.profile?.lookingFor || "",
    profileImageUrl,
    images: userData?.profile?.images?.map((img: string) =>
      img.startsWith("http") ? img : `${APIURL}${img.startsWith("/") ? "" : "/"}${img}`
    ) || [],
    email: userData?.profile?.email || "",
  };

  const buildDisplayImages = (): { id: string; uri: string }[] => {
    const uris: string[] = [];
    if (userData?.images?.length) {
      userData.images.slice(0, 6).forEach((img) => {
        const uri = img.imageUrl
          ? img.imageUrl.startsWith("http")
            ? img.imageUrl
            : `${APIURL}${img.imageUrl.startsWith("/") ? "" : "/"}${img.imageUrl}`
          : "";
        if (uri) uris.push(uri);
      });
    }
    if (!uris.length && profileImageUrl) uris.push(profileImageUrl);
    if (!uris.length && isOwnProfile) {
      images.filter(Boolean).forEach((img: string) => uris.push(img.startsWith("http") ? img : `${APIURL}${img.startsWith("/") ? "" : "/"}${img}`));
    }
    return uris.map((uri, i) => ({ id: String(i), uri }));
  };

  const displayImages = buildDisplayImages();

  useEffect(() => {
    if (hasValidId && profileUserId) {
      checkConnectionStatus();
    }
  }, [profileUserId]);

  const checkConnectionStatus = async () => {
    try {
      const myId = await AuthStorage.getUserId();
      if (myId && profileUserId) {
        const status = await connectionsApi.getConnectionStatus(myId, Number(profileUserId));
        setConnectionStatus(status);
      }
    } catch {}
  };

  useEffect(() => {
    const getId = async() => {
      const myId = await AuthStorage.getUser()
      console.log(myId)
    }
    getId() ;
  } , [])

  const handleSendRequest = async () => {
    const pid = Number(profileUserId);
    if (!pid) {
      Alert.alert("Error", "Invalid user ID. This user may not have a complete profile.");
      return;
    }
    setSending(true);
    try {
      const myId = await AuthStorage.getUserId();
      console.log(myId)
      if (!myId) {
        Alert.alert("Error", "Session expired. Please login again.");
        return;
      }
      await connectionsApi.sendRequest({ senderId: myId, receiverId: pid });
      Alert.alert("Success", "Request sent successfully!");
      setConnectionStatus("PENDING");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  const isAccepted = connectionStatus === "ACCEPTED";
  const isPending = connectionStatus === "PENDING";

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.imageContainer}>
      {displayImages.length > 1 && (
        <View style={styles.dotsContainer}>
          {displayImages.map((_: any, i: number) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === activeIndex ? "#007BFF" : "#ccc" }]} />
          ))}
        </View>
      )}
      <AuthImage uri={item.uri} style={styles.image} resizeMode="cover" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {displayImages.length > 0 ? (
        <View style={styles.sliderWrapper}>
          <FlatList
            ref={flatlistRef}
            data={displayImages}
            renderItem={renderItem}
            keyExtractor={(item: any) => item.id}
            horizontal
            pagingEnabled
            onScroll={handleScroll}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="center"
            bounces={false}
          />
        </View>
      ) : (
        <View style={[styles.sliderWrapper, styles.noImageContainer]}>
          <Text style={styles.noImageText}>No photos available</Text>
        </View>
      )}

      <UserDetails connectionAccepted={isAccepted} profileData={profileData} />

      {!hasValidId && !isOwnProfile && (
        <View style={styles.sendRequestContainer}>
          <Text style={styles.unavailableText}>Send request unavailable for this user</Text>
        </View>
      )}

      {hasValidId && !isAccepted && !isPending && (
        <View style={styles.sendRequestContainer}>
          <TouchableOpacity
            style={[styles.sendRequestBtn, sending && { opacity: 0.7 }]}
            onPress={handleSendRequest}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendRequestText}>Send Request</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {hasValidId && isPending && (
        <View style={styles.sendRequestContainer}>
          <Text style={styles.pendingText}>Request Pending</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  sliderWrapper: { width: "100%", height: 320, marginTop: 20 },
  noImageContainer: { justifyContent: "center", alignItems: "center" },
  noImageText: { color: "#999", fontSize: 16 },
  imageContainer: { width: SCREEN_WIDTH, height: 320, position: "relative" },
  image: { width: "100%", height: "100%" },
  dotsContainer: {
    position: "absolute",
    top: 290,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 5 },
  sendRequestContainer: { paddingHorizontal: 20, marginTop: 20 },
  sendRequestBtn: {
    backgroundColor: "#D94B58",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  sendRequestText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  pendingText: { textAlign: "center", color: "#FF9800", fontSize: 16, fontWeight: "600" },
  unavailableText: { textAlign: "center", color: "#999", fontSize: 14, fontStyle: "italic" },
});

export default ViewMyProfileScreen;
