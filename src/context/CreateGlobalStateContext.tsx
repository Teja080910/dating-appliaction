import { createContext, Dispatch, SetStateAction } from 'react';

interface AppContextType {
  // basic user
  initialScreen: string | null;
  setInitialScreen: Dispatch<SetStateAction<string | null>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  displayName: string;
  setDisplayName: Dispatch<SetStateAction<string>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  username: string;
  setUsername: Dispatch<SetStateAction<string>>;
  phoneNumber: string;
  setPhoneNumber: Dispatch<SetStateAction<string>>;
  login: boolean;
  setLogin: Dispatch<SetStateAction<boolean>>;
  authUserId: string | null;
  setAuthUserId: Dispatch<SetStateAction<string | null>>;
  gender: string | null;
  setGender: Dispatch<SetStateAction<string | null>>;

  // profile
  date: Date;
  setDate: Dispatch<SetStateAction<Date>>;
  height: number;
  setHeight: Dispatch<SetStateAction<number>>;
  tempHeight: number;
  setTempHeight: Dispatch<SetStateAction<number>>;
  selectedAppearance: string | null;
  setSelectedAppearance: Dispatch<SetStateAction<string | null>>;
  selectedBodyType: string | null;
  setSelectedBodyType: Dispatch<SetStateAction<string | null>>;
  selectedLanguages: string[];
  setSelectedLanguages: Dispatch<SetStateAction<string[]>>;
  selectedEthnicity: string | null;
  setSelectedEthnicity: Dispatch<SetStateAction<string | null>>;
  selectedSmoking: string | null;
  setSelectedSmoking: Dispatch<SetStateAction<string | null>>;
  selectedDrinking: string | null;
  setSelectedDrinking: Dispatch<SetStateAction<string | null>>;
  selectedKidCount: string | null;
  setSelectedKidCount: Dispatch<SetStateAction<string | null>>;
  selectedLookingFor: string[];
  setSelectedLookingFor: Dispatch<SetStateAction<string[]>>;
  selectedNetWorth: string | null;
  setSelectedNetWorth: Dispatch<SetStateAction<string | null>>;
  englishSkillLevel: number;
  setEnglishSkillLevel: Dispatch<SetStateAction<number>>;
  profileText: string;
  setProfileText: Dispatch<SetStateAction<string>>;
  profileImage: string | null;
  setProfileImage: Dispatch<SetStateAction<string | null>>;
  profileImageUrl: string | null;
  setProfileImageUrl: Dispatch<SetStateAction<string | null>>;
  verifiedSelfie: boolean;
  setVerifiedSelfie: Dispatch<SetStateAction<boolean>>;
  images: (string | null)[];
  setImages: Dispatch<SetStateAction<(string | null)[]>>;

  // missing properties
  kidsCount: string | null;
  setKidsCount: Dispatch<SetStateAction<string | null>>;
  netWorth: string | null;
  setNetWorth: Dispatch<SetStateAction<string | null>>;

  // discovery
  filter: 'online' | 'newest';
  setFilter: Dispatch<SetStateAction<'online' | 'newest'>>;
  oppositeGender: string | null;
  setOppositeGender: Dispatch<SetStateAction<string | null>>;

  // search
  ageRange: number[];
  setAgeRange: Dispatch<SetStateAction<number[]>>;
  distanceRange: number;
  setDistanceRange: Dispatch<SetStateAction<number>>;
  bodyHeight: number[];
  setBodyHeight: Dispatch<SetStateAction<number[]>>;
  searchLanguages: string[];
  setSearchLanguages: Dispatch<SetStateAction<string[]>>;
  englishProficiency: string[];
  setEnglishProficiency: Dispatch<SetStateAction<string[]>>;
  ethnicity: string[];
  setEthnicity: Dispatch<SetStateAction<string[]>>;
  lookingFor: string[];
  setLookingFor: Dispatch<SetStateAction<string[]>>;
  smoke: string[];
  setSmoke: Dispatch<SetStateAction<string[]>>;
  showMe: 'straight_man' | 'straight_woman' | null;
  setShowMe: Dispatch<SetStateAction<'straight_man' | 'straight_woman' | null>>;

  // missing properties from components
  selectedOptions: string[];
  setSelectedOptions: Dispatch<SetStateAction<string[]>>;
  selectBodyTypes: string[];
  setSelectBodyTypes: Dispatch<SetStateAction<string[]>>;
  selected: string | null;
  setSelected: Dispatch<SetStateAction<string | null>>;

  // location
  location: string;
  setLocation: Dispatch<SetStateAction<string>>;
  previousLocations: string[];
  setPreviousLocations: Dispatch<SetStateAction<string[]>>;
  locationModalVisible: boolean;
  setLocationModalVisible: Dispatch<SetStateAction<boolean>>;

  // UI
  isModalVisible: boolean;
  setIsModalVisible: Dispatch<SetStateAction<boolean>>;
  selectedIndex: number | null;
  setSelectedIndex: Dispatch<SetStateAction<number | null>>;
  isChecked: boolean;
  setIsChecked: Dispatch<SetStateAction<boolean>>;

  // profile view
  viewMyProfile: boolean;
  setViewMyProfile: Dispatch<SetStateAction<boolean>>;
  selectedUserImage: string | null;
  setSelectedUserImage: Dispatch<SetStateAction<string | null>>;
  cardUserName: string | null;
  setCardUserName: Dispatch<SetStateAction<string | null>>;
  cardUserAge: number | string | null;
  setCardUserAge: Dispatch<SetStateAction<number | string | null>>;

  // social
  invitations: any[];
  setInvitations: Dispatch<SetStateAction<any[]>>;
  receivedInvitations: any[];
  setReceivedInvitations: Dispatch<SetStateAction<any[]>>;
  chats: any[];
  setChats: Dispatch<SetStateAction<any[]>>;

  // subscription
  isSubscribed: boolean;
  setIsSubscribed: Dispatch<SetStateAction<boolean>>;
  paywallVisible: boolean;
  setPaywallVisible: Dispatch<SetStateAction<boolean>>;

  // utils
  resetApp: () => Promise<void>;
  logout: () => Promise<void>;
  setProfilePreferences: (prefs: any) => void;

  // aliases
  selectedEthinicity: string | null;
  setSelectedEthinicity: Dispatch<SetStateAction<string | null>>;
}

const AppContext = createContext<AppContextType>(null as any);

export default AppContext;
