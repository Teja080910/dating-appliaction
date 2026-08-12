import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { getAbsoluteUrl, isApiHostedUrl } from "../../api/apiClient";
import { useConnection } from "../../api/useConnection";
import { useUserImages } from "../../api/useImages";
import { useMyProfile } from "../../api/useProfile";
import UserDetails from "../../components/ProfileTabComponents/ViewMyProfile/UserDetails";
import AppContext from "../../context/CreateGlobalStateContext";
import { Colors } from "../../theme";
import { isResolvedApiUserId, repairStoredSessionIdentity } from "../../utils/session";
import { getAuthToken, getUserId } from "../../utils/sessionHelper";

const { width: screenWidth } = Dimensions.get("window");
const heroHeight = Math.min(Math.max(screenWidth * 1.15, 360), 520);

const normalizeTextValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
};

const flattenProfileSource = (value: any) => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const nestedProfile =
    value?.profile && typeof value.profile === "object" ? value.profile : {};

  return {
    ...nestedProfile,
    ...value,
  };
};

const collectImageUris = (value: unknown): string[] => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectImageUris(item));
  }

  if (value && typeof value === "object") {
    const imageObject = value as Record<string, unknown>;
    return [
      ...collectImageUris(imageObject.imageUrl),
      ...collectImageUris(imageObject.profileImageUrl),
      ...collectImageUris(imageObject.url),
      ...collectImageUris(imageObject.uri),
      ...collectImageUris(imageObject.path),
      ...collectImageUris(imageObject.image),
    ];
  }

  return [];
};

const dedupeImageUris = (items: unknown[]) => {
  const seen = new Set<string>();
  const resolved: string[] = [];

  items
    .flatMap((item) => collectImageUris(item))
    .forEach((item) => {
      const normalized = item.trim();
      if (!normalized || seen.has(normalized)) {
        return;
      }

      seen.add(normalized);
      resolved.push(normalized);
    });

  return resolved;
};

const resolveNumericIdentifier = (...values: unknown[]) => {
  for (const value of values) {
    const normalized = String(value ?? '').trim();
    if (/^[A-Za-z]+\d+$/.test(normalized)) {
      return normalized;
    }
    if (/^\d+$/.test(normalized)) {
      const numericValue = Number(normalized);
      if (Number.isFinite(numericValue) && numericValue > 0) {
        return numericValue;
      }
    }
  }

  return null;
};

const ViewMyProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {
    viewMyProfile,
    name,
    displayName,
    date,
    height,
    profileText,
    profileImage,
    profileImageUrl,
    images: contextImages,
    selectedAppearance,
    selectedBodyType,
    selectedLanguages,
    englishSkillLevel,
    selectedEthinicity,
    selectedSmoking,
    selectedDrinking,
    selectedLookingFor,
    verifiedSelfie,
    location,
  } = useContext(AppContext);

  // userId from params if we are viewing someone else
  const {
    userId: paramId,
    targetUserId: paramTargetId,
    profileData: routeProfileData,
    image: routeImage,
    fallbackImage,
  } = route.params || {};

  const [myId, setMyId] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const [directId, token] = await Promise.all([getUserId(), getAuthToken()]);
      if (!isMounted) return;

      if (directId) {
        setMyId(String(directId));
      } else {
        const repairedId = await repairStoredSessionIdentity();
        if (repairedId && isResolvedApiUserId(repairedId) && isMounted) {
          setMyId(String(repairedId));
        }
      }

      setAuthToken(token);
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, []);

  const { getAllImages } = useUserImages();
  const { send: likeMutation } = useConnection(myId || undefined);

  // Fetch based on whether it's "Me" or "Other"
  const routeTargetId = resolveNumericIdentifier(
    paramTargetId,
    paramId,
    routeProfileData?.id,
    routeProfileData?.targetUserId,
    routeProfileData?.userId,
    routeProfileData?.uid,
    routeProfileData?.profile?.id,
    routeProfileData?.profile?.targetUserId,
    routeProfileData?.profile?.userId,
    routeProfileData?.profile?.uid,
    routeProfileData?.user?.id,
    routeProfileData?.user?.userId,
    routeProfileData?.user?.uid,
  );
  const targetId = viewMyProfile ? myId : routeTargetId;
  const hasNumericTargetId =
    typeof targetId === 'number' ||
    (typeof targetId === 'string' && (/^\d+$/.test(targetId) || /^[A-Za-z]+\d+$/.test(targetId)));
  const { data: fetchedProfile, isLoading: loading } = useMyProfile(
    hasNumericTargetId ? targetId : null
  );
  const numericTargetId = hasNumericTargetId ? String(targetId) : null;

  useEffect(() => {
    let isMounted = true;

    if (!numericTargetId) {
      setGalleryImages([]);
      return () => {
        isMounted = false;
      };
    }

    getAllImages.mutate(String(numericTargetId), {
      onSuccess: (data: any) => {
        if (!isMounted) {
          return;
        }

        setGalleryImages(dedupeImageUris([data]));
      },
      onError: () => {
        if (isMounted) {
          setGalleryImages([]);
        }
      },
    });

    return () => {
      isMounted = false;
    };
  }, [numericTargetId]);

  const flatlistRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: any) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth
    );
    setActiveIndex(index);
  };

  const handleLike = () => {
    if (!numericTargetId || !myId) return;
    likeMutation.mutate(numericTargetId, {
      onSuccess: () => navigation.goBack()
    });
  };
  const handleDislike = () => {
    navigation.goBack();
  };

  const renderItem = ({ item }: any) => {
    const imageSource: ImageSourcePropType =
      typeof item === 'string'
        ? authToken && isApiHostedUrl(item)
          ? { uri: item, headers: { Authorization: `Bearer ${authToken}` } }
          : { uri: item }
        : item;

    return (
      <View style={{ width: screenWidth, height: heroHeight }}>
        <Image
          source={imageSource}
          style={[styles.image, { height: heroHeight }]}
        />
      </View>
    );
  };

  const ownAge = useMemo(() => {
    const safeDate = date ? new Date(date) : null;
    if (!safeDate || Number.isNaN(safeDate.getTime())) {
      return null;
    }

    const today = new Date();
    let calculatedAge = today.getFullYear() - safeDate.getFullYear();
    const monthGap = today.getMonth() - safeDate.getMonth();

    if (monthGap < 0 || (monthGap === 0 && today.getDate() < safeDate.getDate())) {
      calculatedAge -= 1;
    }

    return calculatedAge > 0 ? calculatedAge : null;
  }, [date]);

  const mergedProfile = useMemo(() => {
    const fetched = flattenProfileSource(fetchedProfile);
    const routed = flattenProfileSource(routeProfileData);
    const contextLanguage = Array.isArray(selectedLanguages)
      ? selectedLanguages.filter(Boolean).join(", ")
      : null;
    const contextLookingFor = Array.isArray(selectedLookingFor)
      ? selectedLookingFor.filter(Boolean).join(", ")
      : normalizeTextValue(selectedLookingFor);
    const contextEnglishLevel =
      ["Beginner", "Intermediate", "Advanced", "Native"][englishSkillLevel] ||
      "Beginner";
    const contextPrimaryImage =
      dedupeImageUris([profileImageUrl, profileImage, contextImages])[0] || null;

    const mergedImages = dedupeImageUris([
      fetched?.images,
      fetched?.allImages,
      routed?.images,
      routed?.allImages,
      galleryImages,
      contextImages,
      profileImageUrl,
      profileImage,
      fetched?.profileImageUrl,
      routed?.profileImageUrl,
      routeImage,
    ]);

    return {
      ...routed,
      ...fetched,
      id: fetched?.id || routed?.id || numericTargetId || (viewMyProfile ? myId : null) || null,
      targetUserId: numericTargetId || routed?.targetUserId || routed?.userId || null,
      name:
        normalizeTextValue(fetched?.name) ||
        normalizeTextValue(routed?.name) ||
        normalizeTextValue(name) ||
        normalizeTextValue(displayName) ||
        "User",
      displayName:
        normalizeTextValue(fetched?.displayName) ||
        normalizeTextValue(routed?.displayName) ||
        normalizeTextValue(displayName) ||
        normalizeTextValue(name) ||
        "User",
      age: fetched?.age || routed?.age || ownAge || null,
      bio:
        normalizeTextValue(fetched?.bio) ||
        normalizeTextValue(routed?.bio) ||
        normalizeTextValue(profileText),
      height: fetched?.height || routed?.height || height || null,
      appearance:
        normalizeTextValue(fetched?.appearance) ||
        normalizeTextValue(routed?.appearance) ||
        normalizeTextValue(selectedAppearance),
      bodyType:
        normalizeTextValue(fetched?.bodyType) ||
        normalizeTextValue(routed?.bodyType) ||
        normalizeTextValue(selectedBodyType),
      language:
        normalizeTextValue(fetched?.language) ||
        normalizeTextValue(routed?.language) ||
        contextLanguage,
      englishLevel:
        normalizeTextValue(fetched?.englishLevel) ||
        normalizeTextValue(routed?.englishLevel) ||
        contextEnglishLevel,
      ethnicity:
        normalizeTextValue(fetched?.ethnicity) ||
        normalizeTextValue(routed?.ethnicity) ||
        normalizeTextValue(selectedEthinicity),
      smoke:
        normalizeTextValue(fetched?.smoke) ||
        normalizeTextValue(routed?.smoke) ||
        normalizeTextValue(selectedSmoking),
      drink:
        normalizeTextValue(fetched?.drink) ||
        normalizeTextValue(routed?.drink) ||
        normalizeTextValue(selectedDrinking),
      lookingFor:
        normalizeTextValue(fetched?.lookingFor) ||
        normalizeTextValue(routed?.lookingFor) ||
        contextLookingFor,
      currentCity:
        normalizeTextValue(fetched?.currentCity) ||
        normalizeTextValue(routed?.currentCity) ||
        normalizeTextValue(location),
      verifiedSelfie:
        fetched?.verifiedSelfie ??
        fetched?.selfieVerified ??
        routed?.verifiedSelfie ??
        routed?.selfieVerified ??
        verifiedSelfie,
      profileImageUrl:
        normalizeTextValue(fetched?.profileImageUrl) ||
        normalizeTextValue(routed?.profileImageUrl) ||
        contextPrimaryImage,
      images: mergedImages,
    };
  }, [
    date,
    displayName,
    englishSkillLevel,
    fetchedProfile,
    galleryImages,
    height,
    location,
    myId,
    name,
    numericTargetId,
    ownAge,
    profileImage,
    profileImageUrl,
    profileText,
    routeImage,
    routeProfileData,
    selectedAppearance,
    selectedBodyType,
    selectedDrinking,
    selectedEthinicity,
    selectedLanguages,
    selectedLookingFor,
    selectedSmoking,
    verifiedSelfie,
    contextImages,
  ]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF5A79" />
      </View>
    );
  }

  const profileImages = dedupeImageUris([
    mergedProfile?.images,
    mergedProfile?.profileImageUrl,
    routeImage,
  ]).map((image) => getAbsoluteUrl(image));
  const sliderImages =
    profileImages.length > 0
      ? profileImages
      : fallbackImage
        ? [fallbackImage]
        : [];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, !viewMyProfile && numericTargetId ? styles.scrollContentWithFooter : null]}
      >
        <View style={styles.sliderWrapper}>
          {sliderImages.length > 0 ? (
            <FlatList
              ref={flatlistRef}
              data={sliderImages}
              renderItem={renderItem}
              keyExtractor={(_, i) => i.toString()}
              horizontal
              pagingEnabled
              onScroll={handleScroll}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <View style={[styles.emptyHero, { height: heroHeight }]}>
              <Icon name="image" size={42} color="#CFCFCF" />
            </View>
          )}

          {/* Back */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-left" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Dots */}
          {sliderImages.length > 1 && (
            <View style={styles.dotsContainer}>
              {sliderImages.map((_: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === activeIndex
                          ? "#FF5A79"
                          : "rgba(255,255,255,0.7)",
                      width: index === activeIndex ? 18 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <UserDetails
          profile={mergedProfile}
          currentUserId={myId}
          targetUserId={numericTargetId}
        />
      </ScrollView>

      {/* 🔥 ACTION BUTTONS */}
      {!viewMyProfile && numericTargetId && (
        <View style={styles.actionFooter}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDislike}>
            <Icon name="x" size={28} color="red" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { borderColor: '#FF5A79' }]} onPress={handleLike}>
            <Icon name="heart" size={28} color="#FF5A79" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ViewMyProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background
  },
  sliderWrapper: {
    position: "relative",
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentWithFooter: {
    paddingBottom: 110,
  },
  image: {
    width: screenWidth,
    resizeMode: "cover",
  },
  emptyHero: {
    width: screenWidth,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 5,
    zIndex: 10
  },
  dotsContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    gap: 8,
    zIndex: 1
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  actionFooter: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.surface,
    position: 'absolute',
    bottom: 0,
    width: '100%'
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
});
