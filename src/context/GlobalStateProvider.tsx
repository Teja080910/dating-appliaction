import { useState, useEffect } from "react";
import AppContext from "./CreateGlobalStateContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserId } from '../utils/sessionHelper';
import { clearFullSession } from '../utils/session';
import { MAX_PROFILE_IMAGES } from '../api/useImages';

const GlobalStateProvider = ({ children }: any) => {

  // ================= BASIC USER =================
  const [initialScreen, setInitialScreen] = useState<string | null>('Login');
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
  const [selectedKidCount, setSelectedKidCount] = useState<string | null>(null);
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);
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

  // ================= SEARCH FILTER =================
  const [ageRange, setAgeRange] = useState([18, 55]);
  const [distanceRange, setDistanceRange] = useState(1000);
  const [bodyHeight, setBodyHeight] = useState([120, 200]);

  const [searchLanguages, setSearchLanguages] = useState<string[]>([]);
  const [englishProficiency, setEnglishProficiency] = useState<string[]>([]);
  const [ethnicity, setEthnicity] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [smoke, setSmoke] = useState<string[]>([]);
  const [showMe, setShowMe] = useState<'straight_man' | 'straight_woman' | null>(null);

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

        const subStatus = await AsyncStorage.getItem('isSubscribed');
        if (subStatus === 'true') setIsSubscribed(true);
      } catch (e) {
        console.error('Init Error:', e);
      }
    };

    initializeApp();
  }, []);

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
    if (prefs.kidCount) setSelectedKidCount(prefs.kidCount);
    if (prefs.languages) setSelectedLanguages(prefs.languages);
    if (prefs.lookingFor) setSelectedLookingFor(prefs.lookingFor);
  };

  const resetApp = async () => {
    try {
      await clearFullSession();

      setName('');
      setEmail('');
      setPassword('');
      setUsername('');
      setPhoneNumber('');
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
        selectedKidCount, setSelectedKidCount,
        selectedLookingFor, setSelectedLookingFor,
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

        // search
        ageRange, setAgeRange,
        distanceRange, setDistanceRange,
        bodyHeight, setBodyHeight,
        searchLanguages, setSearchLanguages,
        englishProficiency, setEnglishProficiency,
        ethnicity, setEthnicity,
        lookingFor, setLookingFor,
        smoke, setSmoke,
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

        // Aliases for misspelled versions used in codebase
        selectedEthinicity: selectedEthnicity,
        setSelectedEthinicity: setSelectedEthnicity,

        // Aliases for shorter names
        kidsCount: selectedKidCount || '',
        setKidsCount: setSelectedKidCount,
        netWorth: selectedNetWorth || '',
        setNetWorth: setSelectedNetWorth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default GlobalStateProvider;
