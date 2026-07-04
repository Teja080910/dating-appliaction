import {
  FlatList,
  StyleSheet,
  View,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthImage from "../../components/AuthImage";
import AppContext from "../../context/CreateGlobalStateContext";
import { connectionsApi } from "../../api/connectionsApi";
import { profileApi } from "../../api/profileApi";
import { AuthStorage } from "../../api/authStorage";
import { ProfileResponse, User, ConnectionRequest } from "../../api/types";
import { resolveImageUri } from "../../utils/imageUtils";

const SCREEN_WIDTH = Dimensions.get("window").width;

const ViewMyProfileScreen = ({ route }: any) => {
  const { images } = useContext(AppContext);
  const flatlistRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<{ mobile?: string; telegram?: string; email?: string; instagram?: string }>({});
  const [fetchedProfile, setFetchedProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const userData = route?.params?.userData as User | undefined;
  const paramUserUserId = route?.params?.userUserId as string | undefined;
  const targetUserId = userData?.userId || paramUserUserId || "";
  const isOwnProfile = !userData && !paramUserUserId;

  useEffect(() => {
    (async () => {
      const userData = await AuthStorage.getUser();
      const id = userData?.userId || (await AuthStorage.getUserIdStr());
      setMyUserId(id);
    })();
  }, []);

  useEffect(() => {
    if (targetUserId && !isOwnProfile) {
      setProfileLoading(true);
      profileApi.getMyProfile(targetUserId)
        .then(setFetchedProfile)
        .catch(() => setFetchedProfile(userData?.profile || userData))
        .finally(() => setProfileLoading(false));
    }
  }, [targetUserId]);

  useFocusEffect(
    useCallback(() => {
      if (targetUserId && myUserId) {
        (async () => {
          try {
            const status = await connectionsApi.getConnectionStatus(myUserId, targetUserId);
            setConnectionStatus(status);
          } catch {
            const uidNum = await AuthStorage.getUserId();
            if (uidNum) {
              try {
                const status = await connectionsApi.getConnectionStatus(String(uidNum), targetUserId);
                setConnectionStatus(status);
              } catch {}
            }
          }
        })();
      }
    }, [targetUserId, myUserId])
  );

  useEffect(() => {
    if (showAccepted && targetUserId && myUserId) fetchContactInfo();
  }, [showAccepted, targetUserId, myUserId]);

  const canSendRequest = !isOwnProfile;
  const showPending = connectionStatus === "PENDING";
  const showAccepted = connectionStatus === "ACCEPTED";

  const handleSendRequest = async () => {
    if (!targetUserId) {
      Alert.alert("Error", "Invalid user");
      return;
    }
    setSending(true);
    try {
      if (!myUserId) {
        Alert.alert("Error", "Session expired. Please login again.");
        return;
      }
      await connectionsApi.sendRequest({ senderId: myUserId, receiverId: targetUserId });
      Alert.alert("Success", "Request sent successfully!");
      setConnectionStatus("PENDING");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  const fetchContactInfo = async () => {
    try {
      if (!myUserId || !targetUserId) return;
      const connections = await connectionsApi.getConnections(myUserId);
      const matched = connections.find(
        (c: ConnectionRequest) =>
          (c.sender?.userId === myUserId && c.receiver?.userId === targetUserId) ||
          (c.sender?.userId === targetUserId && c.receiver?.userId === myUserId)
      );
      if (matched && matched.status === 'ACCEPTED') {
        const otherUser = matched.sender?.userId === targetUserId ? matched.sender : matched.receiver;
        setContactInfo({
          mobile: otherUser?.mobile || '',
          telegram: otherUser?.telegramUsername || '',
          instagram: otherUser?.instagramUsername || '',
          email: userData?.profile?.email || '',
        });
      }
    } catch {}
  };

  const handlePhone = () => {
    if (contactInfo.mobile) Linking.openURL(`tel:${contactInfo.mobile}`);
  };

  const handleTelegram = () => {
    if (contactInfo.telegram) {
      const tg = contactInfo.telegram.replace('@', '');
      Linking.openURL(`https://t.me/${tg}`);
    }
  };

  const handleWhatsApp = () => {
    if (contactInfo.mobile) {
      Linking.openURL(`https://wa.me/${contactInfo.mobile.replace(/[^0-9]/g, '')}`);
    }
  };

  const handleEmail = () => {
    if (contactInfo.email) Linking.openURL(`mailto:${contactInfo.email}`);
  };

  const handleInstagram = () => {
    if (contactInfo.instagram) {
      const ig = contactInfo.instagram.replace('@', '');
      Linking.openURL(`https://instagram.com/${ig}`);
    }
  };

  const profileImageUrl = (fetchedProfile?.profileImageUrl || userData?.profile?.profileImageUrl)
    ? resolveImageUri(fetchedProfile?.profileImageUrl || userData?.profile?.profileImageUrl)
    : "";

  const profileData: ProfileResponse = {
    id: fetchedProfile?.id || userData?.id || 0,
    name: fetchedProfile?.name || userData?.name || userData?.profile?.displayName || "",
    displayName: fetchedProfile?.displayName || userData?.profile?.displayName || userData?.name || "",
    bio: fetchedProfile?.bio || userData?.profile?.bio || "",
    language: fetchedProfile?.language || userData?.profile?.language || "",
    height: fetchedProfile?.height ?? userData?.profile?.height ?? undefined,
    bodyType: fetchedProfile?.bodyType || userData?.profile?.bodyType || "",
    appearance: fetchedProfile?.appearance || userData?.profile?.appearance || "",
    ethnicity: fetchedProfile?.ethnicity || userData?.profile?.ethnicity || "",
    englishLevel: fetchedProfile?.englishLevel || userData?.profile?.englishLevel || "",
    smoke: fetchedProfile?.smoke || userData?.profile?.smoke || "",
    drink: fetchedProfile?.drink || userData?.profile?.drink || "",
    lookingFor: fetchedProfile?.lookingFor || userData?.profile?.lookingFor || "",
    gender: fetchedProfile?.gender || userData?.profile?.gender || "",
    orientation: fetchedProfile?.orientation || userData?.profile?.orientation || "",
    age: fetchedProfile?.age ?? userData?.profile?.age ?? undefined,
    profileImageUrl,
    images: (fetchedProfile?.images || userData?.profile?.images || []).map((img: any) =>
      resolveImageUri(img.imageUrl || img)
    ),
    email: fetchedProfile?.email || userData?.profile?.email || "",
  };

  const buildDisplayImages = (): { id: string; uri: string }[] => {
    const uris: string[] = [];
    const sourceImages = fetchedProfile?.images || userData?.images || userData?.profile?.images || [];
    if (Array.isArray(sourceImages) && sourceImages.length > 0) {
      sourceImages.slice(0, 6).forEach((img: any) => {
        const uri = typeof img === 'string' ? resolveImageUri(img) : resolveImageUri(img.imageUrl || '');
        if (uri) uris.push(uri);
      });
    }
    if (!uris.length && profileImageUrl) uris.push(profileImageUrl);
    if (!uris.length && isOwnProfile) {
      images.filter(Boolean).forEach((img: string) => uris.push(resolveImageUri(img)));
    }
    return uris.map((uri, i) => ({ id: String(i), uri }));
  };

  const displayImages = buildDisplayImages();

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.imageContainer}>
      <AuthImage uri={item.uri} style={styles.image} resizeMode="cover" />
    </View>
  );

  const lookingForList = profileData.lookingFor
    ? profileData.lookingFor.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
            {displayImages.length > 1 && (
              <View style={styles.dotsContainer}>
                {displayImages.map((_: any, i: number) => (
                  <View key={i} style={[styles.dot, { backgroundColor: i === activeIndex ? "#D94B58" : "#ccc" }]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.sliderWrapper, styles.noImageContainer]}>
            <Text style={styles.noImageText}>No photos available</Text>
          </View>
        )}

        <View style={styles.profileHeader}>
          <Text style={styles.nameText}>
            {profileData.displayName || profileData.name || "Unknown"}
            {profileData.age ? <Text style={styles.ageText}>, {profileData.age}</Text> : null}
          </Text>
          {profileData.gender ? (
            <Text style={styles.genderText}>{profileData.gender}</Text>
          ) : null}
        </View>

        {profileData.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profileData.bio}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            {profileData.height ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Height</Text>
                <Text style={styles.detailValue}>{profileData.height} cm</Text>
              </View>
            ) : null}
            {profileData.bodyType ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Body Type</Text>
                <Text style={styles.detailValue}>{profileData.bodyType}</Text>
              </View>
            ) : null}
            {profileData.appearance ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Appearance</Text>
                <Text style={styles.detailValue}>{profileData.appearance}</Text>
              </View>
            ) : null}
            {profileData.language ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Language</Text>
                <Text style={styles.detailValue}>{profileData.language}</Text>
              </View>
            ) : null}
            {profileData.englishLevel ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>English</Text>
                <Text style={styles.detailValue}>{profileData.englishLevel}</Text>
              </View>
            ) : null}
            {profileData.ethnicity ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Ethnicity</Text>
                <Text style={styles.detailValue}>{profileData.ethnicity}</Text>
              </View>
            ) : null}
            {profileData.smoke ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Smoke</Text>
                <Text style={styles.detailValue}>{profileData.smoke}</Text>
              </View>
            ) : null}
            {profileData.drink ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Drink</Text>
                <Text style={styles.detailValue}>{profileData.drink}</Text>
              </View>
            ) : null}
            {profileData.orientation ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Orientation</Text>
                <Text style={styles.detailValue}>{profileData.orientation}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {lookingForList.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking For</Text>
            <View style={styles.tagsRow}>
              {lookingForList.map((item, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {!isOwnProfile && showPending && (
          <View style={styles.sendRequestContainer}>
            <Text style={styles.pendingText}>Request Pending</Text>
          </View>
        )}

        {!isOwnProfile && showAccepted && (
          <View style={styles.sendRequestContainer}>
            <View style={styles.acceptedBadge}>
              <Text style={styles.acceptedText}>Connected</Text>
            </View>
            <View style={styles.contactSection}>
              <Text style={styles.contactSectionTitle}>Contact Information</Text>
              {contactInfo.telegram ? (
                <TouchableOpacity style={styles.contactRow} onPress={handleTelegram}>
                  <Text style={styles.contactIcon}>✈</Text>
                  <Text style={styles.contactText}>Telegram: @{contactInfo.telegram}</Text>
                </TouchableOpacity>
              ) : null}
              {contactInfo.mobile ? (
                <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp}>
                  <Text style={styles.contactIcon}>💬</Text>
                  <Text style={styles.contactText}>WhatsApp: {contactInfo.mobile}</Text>
                </TouchableOpacity>
              ) : null}
              {contactInfo.mobile ? (
                <TouchableOpacity style={styles.contactRow} onPress={handlePhone}>
                  <Text style={styles.contactIcon}>📞</Text>
                  <Text style={styles.contactText}>Phone: {contactInfo.mobile}</Text>
                </TouchableOpacity>
              ) : null}
              {contactInfo.email ? (
                <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
                  <Text style={styles.contactIcon}>✉</Text>
                  <Text style={styles.contactText}>Email: {contactInfo.email}</Text>
                </TouchableOpacity>
              ) : null}
              {contactInfo.instagram ? (
                <TouchableOpacity style={styles.contactRow} onPress={handleInstagram}>
                  <Text style={styles.contactIcon}>📷</Text>
                  <Text style={styles.contactText}>Instagram: @{contactInfo.instagram}</Text>
                </TouchableOpacity>
              ) : null}
              {!contactInfo.mobile && !contactInfo.telegram && !contactInfo.email && !contactInfo.instagram ? (
                <Text style={styles.noContactText}>Loading contact info...</Text>
              ) : null}
            </View>
          </View>
        )}

        {!isOwnProfile && canSendRequest && !showPending && !showAccepted && (
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingBottom: 40 },
  sliderWrapper: { width: "100%", height: 360, marginTop: 0 },
  noImageContainer: { justifyContent: "center", alignItems: "center" },
  noImageText: { color: "#999", fontSize: 16 },
  imageContainer: { width: SCREEN_WIDTH, height: 360, position: "relative" },
  image: { width: "100%", height: "100%" },
  dotsContainer: {
    position: "absolute",
    bottom: 16,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  profileHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  nameText: { fontSize: 24, fontWeight: "bold", color: "#000" },
  ageText: { fontSize: 24, fontWeight: "normal", color: "#666" },
  genderText: { fontSize: 14, color: "#888", marginTop: 2 },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  bioText: { fontSize: 15, color: "#444", lineHeight: 22 },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  detailItem: {
    width: "50%",
    paddingVertical: 6,
    paddingRight: 12,
  },
  detailLabel: { fontSize: 12, color: "#999", marginBottom: 2 },
  detailValue: { fontSize: 15, color: "#333", fontWeight: "500" },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  tagText: { fontSize: 13, color: "#333" },
  sendRequestContainer: { paddingHorizontal: 20, marginTop: 24 },
  sendRequestBtn: {
    backgroundColor: "#D94B58",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  sendRequestText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  pendingText: { textAlign: "center", color: "#FF9800", fontSize: 16, fontWeight: "600" },
  acceptedBadge: {
    backgroundColor: "#e8f5e9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptedText: { color: "#2e7d32", fontWeight: "600", fontSize: 16 },
  contactSection: { marginTop: 16, backgroundColor: "#f0f8f0", padding: 16, borderRadius: 12 },
  contactSectionTitle: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 10 },
  contactRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  contactIcon: { fontSize: 16, marginRight: 8 },
  contactText: { fontSize: 15, color: "#333" },
  noContactText: { fontSize: 14, color: "#888", fontStyle: "italic" },
});

export default ViewMyProfileScreen;
