import { useState } from "react";
import AppContext from "./CreateGlobalStateContext";

const GlobalStateProvider = ({ children }: any) => {
  const [initialScreen, setInitialScreen] = useState<string | null>(null);
  const [date, setDate] = useState(new Date(2004, 9, 7));
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [images, setImages] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [imageIds, setImageIds] = useState<(number | null)[]>([null, null, null, null, null, null]);
  const [filter, setFilter] = useState<'online' | 'newest'>('online');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [login, setLogin] = useState(false);
  const [oppositeGender, setOppositeGender] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAppearance, setSelectedAppearance] = useState<string | null>(null);
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null);
  const [height, setHeight] = useState(165);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [tempHeight, setTempHeight] = useState(height);
  const [englishSkillLevel, setEnglishSkillLevel] = useState(0);
  const [selectedEthinicity, setSelectedEthinicity] = useState<string | null>('');
  const [selectedSmoking, setSelectedSmoking] = useState<string | null>('');
  const [selectedKidCount, setSelectedKidCount] = useState<string | null>('');
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);
  const [selectedNetWorth, setSelectedNetWorth] = useState<string | null>(null);

  const [profilePreferences, setProfilePreferences] = useState({
    appearance: null,
    bodyType: null,
    smoking: null,
    englishSkill: null,
    ethnicity: null,
    height: null,
    kidCount: null,
    languages: [],
    lookingFor: null,
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileText, setProfileText] = useState('');

  const [ageRange, setAgeRange] = useState([18, 55]);
  const [isChecked, setIsChecked] = useState(false);

  const [location, setLocation] = useState('My current location');
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const [searchLanguages, setSearchLanguages] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [bodyHeight, setBodyHeight] = useState([120, 200]);
  const [selectBodyTypes, setSelectBodyTypes] = useState<string[]>([]);
  const [distanceRange, setDistanceRange] = useState(1100);
  const [englishProficiency, setEnglishProficiency] = useState<string[]>([]);
  const [ethnicity, setEthnicity] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [showMe, setShowMe] = useState<'straight_man' | 'straight_woman' | null>(null);
  const [smoke, setSmoke] = useState<string[]>([]);

  const [searchPreferences, setSearchPreferences] = useState({
    agesBetween: [],
    distanceRange: null,
    location: null,
    bodyHeightBetween: [],
    bodyType: null,
    appearance: [],
    languages: [],
    englishLevel: [],
    ethnicity: [],
    smoking: [],
    lookingFor: [],
    showMe: null,
  });

  const [viewMyProfile, setViewMyProfile] = useState(false);
  const [selectedUserImage, setSelectedUserImage] = useState<string | null>(null);

  const [cardUserName, setCardUserName] = useState<string | null>(null);
  const [cardUserAge, setCardUserAge] = useState<number | null>(null);

  return (
    <AppContext.Provider value={{
      initialScreen, setInitialScreen,
      date, setDate,
      selected, setSelected,
      name, setName,
      email, setEmail,
      password, setPassword,
      images, setImages,
      imageIds, setImageIds,
      filter, setFilter,
      isModalVisible, setIsModalVisible,
      selectedIndex, setSelectedIndex,
      login, setLogin,
      oppositeGender, setOppositeGender,
      phoneNumber, setPhoneNumber,
      username, setUsername,
      selectedAppearance, setSelectedAppearance,
      selectedBodyType, setSelectedBodyType,
      height, setHeight,
      selectedLanguages, setSelectedLanguages,
      tempHeight, setTempHeight,
      englishSkillLevel, setEnglishSkillLevel,
      selectedEthinicity, setSelectedEthinicity,
      selectedSmoking, setSelectedSmoking,
      selectedKidCount, setSelectedKidCount,
      selectedLookingFor, setSelectedLookingFor,
      selectedNetWorth, setSelectedNetWorth,
      profilePreferences, setProfilePreferences,
      profileImage, setProfileImage,
      profileText, setProfileText,
      ageRange, setAgeRange,
      isChecked, setIsChecked,
      location, setLocation,
      locationModalVisible, setLocationModalVisible,
      searchLanguages, setSearchLanguages,
      selectedOptions, setSelectedOptions,
      bodyHeight, setBodyHeight,
      selectBodyTypes, setSelectBodyTypes,
      distanceRange, setDistanceRange,
      englishProficiency, setEnglishProficiency,
      ethnicity, setEthnicity,
      lookingFor, setLookingFor,
      showMe, setShowMe,
      smoke, setSmoke,
      viewMyProfile, setViewMyProfile,
      selectedUserImage, setSelectedUserImage,
      cardUserName, setCardUserName,
      cardUserAge, setCardUserAge,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default GlobalStateProvider;
