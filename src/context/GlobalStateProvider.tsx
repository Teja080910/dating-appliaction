import { useState, useEffect, useMemo, Dispatch, SetStateAction } from "react";
import { useColorScheme, DeviceEventEmitter } from "react-native";
import AppContext from "./CreateGlobalStateContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserId } from '../utils/sessionHelper';
import { clearFullSession } from '../utils/session';
import { MAX_PROFILE_IMAGES } from '../api/useImages';
import { getSavedSearchFilters, clearSavedSearchFilters, getActiveFilterCount } from '../utils/types/AsyncStorage';
import { getThemeColors, Colors } from '../theme/colors';
import { mockStore } from '../mock/mockStore';
import apiClient from '../api/apiClient';

const GlobalStateProvider = ({ children }: any) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'system' | 'dark'>('dark');
  const themeColors = useMemo(() => getThemeColors(themeMode, systemColorScheme), [themeMode, systemColorScheme]);

  useEffect(() => {
    Object.assign(Colors, themeColors);
  }, [themeColors]);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const saved = await AsyncStorage.getItem('@app_appearance_theme');
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeMode(saved);
        }
      } catch (e) {
        console.warn('Failed to load appearance theme preference:', e);
      }
    };
    void loadThemePreference();
  }, []);

  const updateThemeMode: Dispatch<SetStateAction<'light' | 'system' | 'dark'>> = (value) => {
    setThemeMode((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      AsyncStorage.setItem('@app_appearance_theme', next).catch((e) =>
        console.warn('Failed to save appearance theme preference:', e)
      );
      return next;
    });
  };


  // ================= BASIC USER =================
  const [initialScreen, setInitialScreen] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [login, setLogin] = useState(false);
  const [gender, setGender] = useState<string | null>(null);

  // ================= PROFILE =================
  const [date, setDate] = useState(new Date(2004, 9, 7));
  const [height, setHeight] = useState(165);
  const [tempHeight, setTempHeight] = useState(165);

  const [selectedAppearance, setSelectedAppearance] = useState<string | null>(null);
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedEthnicity, setSelectedEthnicity] = useState<string | null>(null);
  const [selectedSmoking, setSelectedSmoking] = useState<string | null>(null);
  const [selectedDrinking, setSelectedDrinking] = useState<string | null>(null);
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);
  const [selectedKids, setSelectedKids] = useState<string | null>(null);
  const [selectedNetWorth, setSelectedNetWorth] = useState<string | null>(null);
  const [englishSkillLevel, setEnglishSkillLevel] = useState(0);

  const [profileText, setProfileText] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [verifiedSelfie, setVerifiedSelfie] = useState(false);

  const emptyImageSlots = () => Array(MAX_PROFILE_IMAGES).fill(null) as (string | null)[];
  const [images, setImages] = useState<(string | null)[]>(emptyImageSlots);

  // ================= DISCOVERY =================
  const [filter, setFilter] = useState<'online' | 'newest'>('online');
  const [oppositeGender, setOppositeGender] = useState<string | null>(null);
  // Results from the Search Settings screen. They are cleared when the user
  // switches back to one of the dashboard feeds.
  const [filteredProfiles, setFilteredProfiles] = useState<any[] | null>(null);

  // ================= SEARCH FILTER =================
  const [ageRange, setAgeRange] = useState([18, 55]);
  const [distanceRange, setDistanceRange] = useState(50);
  const [bodyHeight, setBodyHeight] = useState([120, 200]);

  const [searchLanguages, setSearchLanguages] = useState<string[]>([]);
  const [englishProficiency, setEnglishProficiency] = useState<string[]>([]);
  const [ethnicity, setEthnicity] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [smoke, setSmoke] = useState<string[]>([]);
  const [smokeFilter, setSmokeFilter] = useState<string | boolean | undefined>(undefined);
  const [drinkFilter, setDrinkFilter] = useState<string | boolean | undefined>(undefined);
  const [showMe, setShowMe] = useState<'straight_man' | 'straight_woman' | 'both' | null>(null);

  // Missing properties from components
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectBodyTypes, setSelectBodyTypes] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  // ================= LOCATION =================
  const [location, setLocation] = useState('Mumbai, India');
  const [previousLocations, setPreviousLocations] = useState<string[]>([]);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // ================= UI =================
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  // ================= PROFILE VIEW =================
  const [viewMyProfile, setViewMyProfile] = useState(false);
  const [selectedUserImage, setSelectedUserImage] = useState<string | null>(null);
  const [cardUserName, setCardUserName] = useState<string | null>(null);
  const [cardUserAge, setCardUserAge] = useState<number | string | null>(null);

  // ================= SOCIAL =================
  const [invitations, setInvitations] = useState<any[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);

  // ================= SUBSCRIPTION =================
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  // ================= INIT =================
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const id = await getUserId();
        if (id) setAuthUserId(id);

        const [
          storedName,
          storedDisplayName,
          storedGender,
          storedUserGender,
          storedImages,
          storedProfileImage,
          storedIsLoggedIn,
          storedTheme,
          storedBio,
          storedDob,
          userScopedImages,
          userScopedProfileImage,
          deletedRaw,
        ] = await Promise.all([
          AsyncStorage.getItem('name'),
          AsyncStorage.getItem('displayName'),
          AsyncStorage.getItem('selectedGender'),
          AsyncStorage.getItem('userGender'),
          AsyncStorage.getItem('onboardingImages'),
          AsyncStorage.getItem('profileImage'),
          AsyncStorage.getItem('isLoggedIn'),
          AsyncStorage.getItem('@app_appearance_theme'),
          AsyncStorage.getItem('bio').then((b) => b || AsyncStorage.getItem('@onboarding_bio')),
          AsyncStorage.getItem('userDob'),
          id ? AsyncStorage.getItem(`user_photos_${id}`).catch(() => null) : Promise.resolve(null),
          id ? AsyncStorage.getItem(`user_profile_photo_${id}`).catch(() => null) : Promise.resolve(null),
          id ? AsyncStorage.getItem(`deleted_photos_${id}`).catch(() => null) : Promise.resolve(null),
        ]);
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemeMode(storedTheme);
        } else {
          setThemeMode('dark');
        }
        // Generic name/profile keys belong to the active account only. During
        // a fresh registration they may still be present briefly while the
        // previous session is being cleared, so never hydrate them as a draft.
        if (storedIsLoggedIn === 'true') {
          if (storedName) setName(storedName);
          if (storedDisplayName) setDisplayName(storedDisplayName);
          if (storedBio) setProfileText(storedBio);
          if (storedDob) {
            try {
              setDate(new Date(storedDob));
            } catch {}
          }
          const resolvedGender = storedGender || storedUserGender;
          if (resolvedGender) {
            setGender(resolvedGender);
            setSelected(resolvedGender);
          }

          // Photos MUST be strictly scoped to the active account identity.
          // Never fall back to un-scoped 'onboardingImages' when logged in under a specific userId.
          const effectiveImages = userScopedImages || (id ? null : storedImages);
          if (effectiveImages) {
            try {
              const parsed = JSON.parse(effectiveImages);
              if (Array.isArray(parsed) && parsed.some(Boolean)) {
                const deletedList: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
                const filtered = parsed.map((u) => (u && deletedList.includes(u) ? null : u));
                while (filtered.length < MAX_PROFILE_IMAGES) filtered.push(null);
                setImages(filtered);
              } else {
                setImages(emptyImageSlots());
              }
            } catch (e) {
              setImages(emptyImageSlots());
            }
          } else {
            setImages(emptyImageSlots());
          }

          const effectiveProfilePhoto = userScopedProfileImage || (id ? null : storedProfileImage);
          if (effectiveProfilePhoto) {
            try {
              const deletedList: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
              if (!deletedList.includes(effectiveProfilePhoto)) {
                setProfileImage(effectiveProfilePhoto);
                setProfileImageUrl(effectiveProfilePhoto);
              } else {
                setProfileImage(null);
                setProfileImageUrl(null);
              }
            } catch {
              setProfileImage(effectiveProfilePhoto);
              setProfileImageUrl(effectiveProfilePhoto);
            }
          } else {
            setProfileImage(null);
            setProfileImageUrl(null);
          }

          const [
            storedHeight,
            storedAppearance,
            storedBodyType,
            storedEthnicity,
            storedSmoking,
            storedDrinking,
            storedLookingFor,
            storedLanguages,
            storedEnglishLevel,
            storedKids,
            storedNetWorth,
          ] = await Promise.all([
            AsyncStorage.getItem('@amara_height'),
            AsyncStorage.getItem('@amara_appearance'),
            AsyncStorage.getItem('@amara_body_type'),
            AsyncStorage.getItem('@amara_ethnicity'),
            AsyncStorage.getItem('@amara_smoking'),
            AsyncStorage.getItem('@amara_drinking'),
            AsyncStorage.getItem('@amara_looking_for'),
            AsyncStorage.getItem('@amara_languages'),
            AsyncStorage.getItem('@amara_english_level'),
            AsyncStorage.getItem('@amara_kid_count'),
            AsyncStorage.getItem('@amara_net_worth'),
          ]);

          if (storedHeight) {
            const h = Number(storedHeight);
            if (Number.isFinite(h) && h > 0) {
              setHeight(h);
              setTempHeight(h);
            }
          }
          if (storedAppearance) setSelectedAppearance(storedAppearance);
          if (storedBodyType) setSelectedBodyType(storedBodyType);
          if (storedEthnicity) setSelectedEthnicity(storedEthnicity);
          if (storedSmoking) setSelectedSmoking(storedSmoking);
          if (storedDrinking) setSelectedDrinking(storedDrinking);
          if (storedKids) setSelectedKids(storedKids);
          if (storedNetWorth) setSelectedNetWorth(storedNetWorth);
          if (storedEnglishLevel !== null && storedEnglishLevel !== undefined && storedEnglishLevel !== '') {
            setEnglishSkillLevel(Number(storedEnglishLevel));
          }
          if (storedLookingFor) {
            try {
              const parsed = JSON.parse(storedLookingFor);
              if (Array.isArray(parsed) && parsed.length > 0) setSelectedLookingFor(parsed);
            } catch {}
          }
          if (storedLanguages) {
            try {
              const parsed = JSON.parse(storedLanguages);
              if (Array.isArray(parsed) && parsed.length > 0) setSelectedLanguages(parsed);
            } catch {}
          }

          // Live server synchronization for profile photos to prevent stale local cache
          if (id) {
            try {
              apiClient.get(`/users/${id}/images`).then((res) => {
                const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.images) ? res.data.images : []);
                if (list.length > 0) {
                  const liveUrls = list.map((item: any) => item?.imageUrl || item?.url || (typeof item === 'string' ? item : null)).filter(Boolean);
                  if (liveUrls.length > 0) {
                    const slots = [...liveUrls];
                    while (slots.length < MAX_PROFILE_IMAGES) slots.push(null);
                    setImages(slots);
                    setProfileImage(slots[0]);
                    setProfileImageUrl(slots[0]);
                    AsyncStorage.setItem(`user_photos_${id}`, JSON.stringify(slots)).catch(() => {});
                  }
                }
              }).catch(() => {});
            } catch {}
          }
        } else {
          setImages(emptyImageSlots());
          setProfileImage(null);
          setProfileImageUrl(null);
        }

        const effectiveGender = storedGender || storedUserGender;
        const isWoman =
          effectiveGender === 'straight_woman' ||
          effectiveGender === 'woman';
        let activeSub = false;
        if (isWoman) {
          activeSub = true;
        } else if (id) {
          try {
            let isActive = false;
            let planName = 'STANDARD';
            let endDateStr: string | null = null;

            try {
              const res = await apiClient.get('/subscriber/status', { params: { userId: id } });
              const d = res.data;
              if (d?.active || d?.isActive || d?.status === 'ACTIVE') {
                isActive = true;
                planName = d.plan || d.planType || 'STANDARD';
                endDateStr = d.endDate || null;
              }
            } catch {}

            if (!isActive) {
              const sub = await mockStore.getSubscriptionStatus(String(id)).catch(() => null);
              if (sub && sub.status === 'ACTIVE') {
                isActive = true;
                planName = sub.plan || 'STANDARD';
                endDateStr = sub.endDate || null;
              }
            }

            if (isActive) {
              activeSub = true;
              await AsyncStorage.setItem('isSubscribed', 'true');
              await AsyncStorage.setItem('@subscription_plan', planName);
              if (endDateStr) {
                await AsyncStorage.setItem('@subscription_endDate', endDateStr);
              }
            } else {
              // Check local storage with expiration check
              const localSub = await AsyncStorage.getItem('isSubscribed');
              const localEnd = await AsyncStorage.getItem('@subscription_endDate');
              if (localSub === 'true' && (!localEnd || new Date(localEnd).getTime() > Date.now())) {
                activeSub = true;
              } else {
                await AsyncStorage.multiRemove(['isSubscribed', '@subscription_plan', '@subscription_endDate']);
              }
            }
          } catch {
            const localSub = await AsyncStorage.getItem('isSubscribed');
            const localEnd = await AsyncStorage.getItem('@subscription_endDate');
            if (localSub === 'true' && (!localEnd || new Date(localEnd).getTime() > Date.now())) {
              activeSub = true;
            }
          }
        } else {
          await AsyncStorage.multiRemove(['isSubscribed', '@subscription_plan', '@subscription_endDate']);
        }
        setIsSubscribed(activeSub);

        await hydrateSavedFilters(id);
      } catch (e) {
        console.error('Init Error:', e);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('AMARA_PROFILE_UPDATED', async (event?: any) => {
      const activeId = event?.uid || (await getUserId().catch(() => null));
      if (activeId) {
        try {
          const res = await apiClient.get(`/users/${activeId}/images`).catch(() => null);
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.images) ? res.data.images : []);
          if (list.length > 0) {
            const liveUrls = list.map((item: any) => item?.imageUrl || item?.url || (typeof item === 'string' ? item : null)).filter(Boolean);
            if (liveUrls.length > 0) {
              const slots = [...liveUrls];
              while (slots.length < MAX_PROFILE_IMAGES) slots.push(null);
              setImages(slots);
              setProfileImage(slots[0]);
              setProfileImageUrl(slots[0]);
              AsyncStorage.setItem(`user_photos_${activeId}`, JSON.stringify(slots)).catch(() => {});
            }
          }
        } catch {}
      }
    });
    return () => sub.remove();
  }, []);

  const hydrateSavedFilters = async (customUserId?: string | number | null) => {
    try {
      const targetId = customUserId ?? authUserId ?? (await getUserId());
      const savedFilters = await getSavedSearchFilters(targetId);
      if (savedFilters) {
        if (savedFilters.minAge !== undefined && savedFilters.maxAge !== undefined) {
          setAgeRange([savedFilters.minAge, savedFilters.maxAge]);
        }
        if (savedFilters.maxDistanceKm !== undefined) {
          const rawDist = Number(savedFilters.maxDistanceKm);
          setDistanceRange(Number.isFinite(rawDist) ? Math.min(Math.max(rawDist, 5), 200) : 50);
        }
        if (savedFilters.minHeight !== undefined && savedFilters.maxHeight !== undefined) {
          setBodyHeight([savedFilters.minHeight, savedFilters.maxHeight]);
        }
        if (savedFilters.bodyType) setSelectBodyTypes(savedFilters.bodyType);
        if (savedFilters.appearance) setSelectedOptions(savedFilters.appearance);
        if (savedFilters.language) setSearchLanguages(savedFilters.language);
        if (savedFilters.englishLevel) setEnglishProficiency(savedFilters.englishLevel);
        if (savedFilters.ethnicity) setEthnicity(savedFilters.ethnicity);
        if (savedFilters.lookingFor) setLookingFor(savedFilters.lookingFor);
        if (savedFilters.showMe !== undefined) {
          setShowMe(savedFilters.showMe);
        } else if (savedFilters.gender?.length) {
          const hasMale = savedFilters.gender.includes('Male');
          const hasFemale = savedFilters.gender.includes('Female');
          if (hasMale && hasFemale) setShowMe('both');
          else if (hasMale) setShowMe('straight_man');
          else setShowMe('straight_woman');
        }
        if (savedFilters.smoke !== undefined) setSmokeFilter(savedFilters.smoke);
        if (savedFilters.drink !== undefined) setDrinkFilter(savedFilters.drink);
        if (savedFilters.worldwide !== undefined) setIsChecked(savedFilters.worldwide);
        if (savedFilters.location) setLocation(savedFilters.location);
      }
    } catch (e) {
      console.error('Error hydrating saved search filters:', e);
    }
  };

  const resetSearchFilters = async () => {
    try {
      const targetId = authUserId ?? (await getUserId());
      await clearSavedSearchFilters(targetId);
      setAgeRange([18, 40]);
      setDistanceRange(50);
      setBodyHeight([120, 200]);
      setSelectBodyTypes([]);
      setSelectedOptions([]);
      setSearchLanguages([]);
      setEnglishProficiency([]);
      setEthnicity([]);
      setLookingFor([]);
      setSmokeFilter(undefined);
      setDrinkFilter(undefined);
      setIsChecked(false);
      setLocation('');
      setShowMe('straight_woman');
      setFilteredProfiles(null);
    } catch (e) {
      console.error('Error resetting search filters:', e);
    }
  };

  const activeFilterCount = useMemo(() => {
    return getActiveFilterCount({
      minAge: ageRange?.[0],
      maxAge: ageRange?.[1],
      maxDistanceKm: Number(distanceRange),
      worldwide: isChecked,
      minHeight: bodyHeight?.[0],
      maxHeight: bodyHeight?.[1],
      location: location,
      bodyType: selectBodyTypes,
      appearance: selectedOptions,
      language: searchLanguages,
      englishLevel: englishProficiency,
      ethnicity: ethnicity,
      lookingFor: lookingFor,
      smoke: smokeFilter,
      drink: drinkFilter,
    });
  }, [
    ageRange,
    distanceRange,
    isChecked,
    bodyHeight,
    location,
    selectBodyTypes,
    selectedOptions,
    searchLanguages,
    englishProficiency,
    ethnicity,
    lookingFor,
    smokeFilter,
    drinkFilter,
  ]);

  // ================= ACTIONS =================
  const logout = async () => {
    await resetApp();
    setInitialScreen('Login');
  };

  const setProfilePreferences = (prefs: any) => {
    if (prefs.appearance) setSelectedAppearance(prefs.appearance);
    if (prefs.bodyType) setSelectedBodyType(prefs.bodyType);
    if (prefs.smoking) setSelectedSmoking(prefs.smoking);
    if (prefs.englishSkill !== undefined) setEnglishSkillLevel(prefs.englishSkill);
    if (prefs.ethnicity) setSelectedEthnicity(prefs.ethnicity);
    if (prefs.height) setHeight(prefs.height);
    if (prefs.languages) setSelectedLanguages(prefs.languages);
    if (prefs.lookingFor) setSelectedLookingFor(prefs.lookingFor);
  };

  const resetApp = async () => {
    try {
      await clearFullSession();

      setName('');
      setDisplayName('');
      setEmail('');
      setPassword('');
      setUsername('');
      setPhoneNumber('');
      setDate(new Date());
      setProfileText('');
      setSelected(null);
      setSelectedAppearance(null);
      setSelectedBodyType(null);
      setSelectedLanguages([]);
      setSelectedEthnicity(null);
      setSelectedSmoking(null);
      setSelectedDrinking(null);
      setSelectedLookingFor([]);
      setSelectedKids(null);
      setSelectedNetWorth(null);
      setEnglishSkillLevel(0);
      setVerifiedSelfie(false);
      setOppositeGender('straight_woman');
      setShowMe('straight_woman');
      // Preserved across logout/login per user requirement
      setImages(emptyImageSlots());
      setProfileImage(null);
      setProfileImageUrl(null);
      setSelectedUserImage(null);
      AsyncStorage.multiRemove(['onboardingImages', 'profileImage']).catch(() => {});
      setLogin(false);
      setIsSubscribed(false);
      setInvitations([]);
      setChats([]);

      console.log('App reset successful');
    } catch (e) {
      console.error('Reset Error:', e);
    }
  };

  // ================= PROVIDER =================
  return (
    <AppContext.Provider
      value={{
        // user
        initialScreen, setInitialScreen,
        name, setName,
        displayName, setDisplayName,
        email, setEmail,
        password, setPassword,
        username, setUsername,
        phoneNumber, setPhoneNumber,
        login, setLogin,
        authUserId, setAuthUserId,
        gender, setGender,

        // profile
        date, setDate,
        height, setHeight,
        tempHeight, setTempHeight,
        selectedAppearance, setSelectedAppearance,
        selectedBodyType, setSelectedBodyType,
        selectedLanguages, setSelectedLanguages,
        selectedEthnicity, setSelectedEthnicity,
        selectedSmoking, setSelectedSmoking,
        selectedDrinking, setSelectedDrinking,
        selectedLookingFor, setSelectedLookingFor,
        selectedKids, setSelectedKids,
        selectedNetWorth, setSelectedNetWorth,
        englishSkillLevel, setEnglishSkillLevel,
        profileText, setProfileText,
        profileImage, setProfileImage,
        profileImageUrl, setProfileImageUrl,
        verifiedSelfie, setVerifiedSelfie,
        images, setImages,

        // discovery
        filter, setFilter,
        oppositeGender, setOppositeGender,
        filteredProfiles, setFilteredProfiles,

        // search
        ageRange, setAgeRange,
        distanceRange, setDistanceRange,
        bodyHeight, setBodyHeight,
        searchLanguages, setSearchLanguages,
        englishProficiency, setEnglishProficiency,
        ethnicity, setEthnicity,
        lookingFor, setLookingFor,
        smoke, setSmoke,
        smokeFilter, setSmokeFilter,
        drinkFilter, setDrinkFilter,
        showMe, setShowMe,

        selectedOptions, setSelectedOptions,
        selectBodyTypes, setSelectBodyTypes,
        selected, setSelected,

        // location
        location, setLocation,
        previousLocations, setPreviousLocations,
        locationModalVisible, setLocationModalVisible,

        // UI
        isModalVisible, setIsModalVisible,
        selectedIndex, setSelectedIndex,
        isChecked, setIsChecked,

        // profile view
        viewMyProfile, setViewMyProfile,
        selectedUserImage, setSelectedUserImage,
        cardUserName, setCardUserName,
        cardUserAge, setCardUserAge,

        // social
        invitations, setInvitations,
        receivedInvitations, setReceivedInvitations,
        chats, setChats,

        // subscription
        isSubscribed, setIsSubscribed,
        paywallVisible, setPaywallVisible,

        // utils
        resetApp,
        logout,
        setProfilePreferences,
        activeFilterCount,
        hydrateSavedFilters,
        resetSearchFilters,

        // Aliases for misspelled versions used in codebase
        selectedEthinicity: selectedEthnicity,
        setSelectedEthinicity: setSelectedEthnicity,

        // theme & appearance
        themeMode,
        setThemeMode: updateThemeMode,
        themeColors,

      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default GlobalStateProvider;
