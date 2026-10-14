import { useState, useEffect, useMemo, Dispatch, SetStateAction } from "react";
import { useColorScheme } from "react-native";
import AppContext from "./CreateGlobalStateContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserId } from '../utils/sessionHelper';
import { clearFullSession } from '../utils/session';
import { MAX_PROFILE_IMAGES } from '../api/useImages';
import { getSavedSearchFilters, clearSavedSearchFilters, getActiveFilterCount } from '../utils/types/AsyncStorage';
import { getThemeColors, Colors } from '../theme/colors';

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
        ] = await Promise.all([
          AsyncStorage.getItem('name'),
          AsyncStorage.getItem('displayName'),
          AsyncStorage.getItem('selectedGender'),
          AsyncStorage.getItem('userGender'),
          AsyncStorage.getItem('onboardingImages'),
          AsyncStorage.getItem('profileImage'),
          AsyncStorage.getItem('isLoggedIn'),
          AsyncStorage.getItem('@app_appearance_theme'),
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
          const resolvedGender = storedGender || storedUserGender;
          if (resolvedGender) setGender(resolvedGender);

          if (storedImages) {
            try {
              const parsed = JSON.parse(storedImages);
              if (Array.isArray(parsed) && parsed.some(Boolean)) {
                setImages(parsed);
              }
            } catch (e) {}
          }
          if (storedProfileImage) {
            setProfileImage(storedProfileImage);
            setProfileImageUrl(storedProfileImage);
          }
        } else {
          setImages(emptyImageSlots());
          setProfileImage(null);
          setProfileImageUrl(null);
        }

        const subStatus = await AsyncStorage.getItem('isSubscribed');
        if (subStatus === 'true') setIsSubscribed(true);

        await hydrateSavedFilters(id);
      } catch (e) {
        console.error('Init Error:', e);
      }
    };

    initializeApp();
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
          setDistanceRange(Number.isFinite(rawDist) ? Math.min(Math.max(rawDist, 5), 100) : 50);
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
