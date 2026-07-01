export interface RegisterRequest {
  name: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  gender: string;
}

export interface LoginRequest {
  mobile: string;
  password: string;
}

export interface SendRequestDTO {
  senderId: number;
  receiverId: number;
}

export interface ActionRequestDTO {
  requestId: number;
  userId: number;
}

export interface GenderOrientationRequest {
  userId: string;
  gender: string;
  orientation: string;
}

export interface ProfileRequestDTO {
  displayName?: string;
  gender?: string;
  orientation?: string;
  age?: number;
  bio?: string;
  password?: string;
  name?: string;
  mobile?: string;
  dob?: string;
  language?: string;
  appearance?: string;
  bodyType?: string;
  height?: number;
  englishLevel?: string;
  ethnicity?: string;
  lookingFor?: string;
  smoke?: string;
  drink?: string;
}

export interface UpdateBasicDTO {
  userId: string;
  name?: string;
  displayName?: string;
  bio?: string;
  age?: number;
}

export interface UpdateDetailsDTO {
  userId: string;
  language?: string;
  bodyType?: string;
  appearance?: string;
  height?: number;
}

export interface UpdatePreferencesDTO {
  userId: string;
  lookingFor?: string;
  smoke?: string;
  drink?: string;
}

export interface UserFilterRequest {
  userId: string;
  search?: string;
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  bodyType?: string[];
  appearance?: string[];
  language?: string[];
  englishLevel?: string[];
  ethnicity?: string[];
  lookingFor?: string[];
  gender?: string[];
  smoke?: boolean;
  drink?: boolean;
  maxDistanceKm?: number;
  worldwide?: boolean;
  onlyOnline?: boolean;
  page?: number;
  size?: number;
}

export interface SearchFilterRequest {
  name?: string;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  language?: string;
  ethnicity?: string;
  smoke?: string;
  drink?: string;
  sortBy?: string;
}

export interface UserProfile {
  id: number;
  name?: string;
  mobile?: string;
  password?: string;
  role?: string;
  displayName?: string;
  gender?: string;
  orientation?: string;
  age?: number;
  bio?: string;
  dob?: string;
  profileImageUrl?: string;
  language?: string;
  appearance?: string;
  bodyType?: string;
  height?: number;
  englishLevel?: string;
  ethnicity?: string;
  lookingFor?: string;
  smoke?: string;
  drink?: string;
  verifiedSelfie?: boolean;
  currentCity?: string;
  currentState?: string;
  currentCountry?: string;
  currentLat?: number;
  currentLng?: number;
  online?: boolean;
  lastSeen?: string;
  createdAt?: string;
  selfieVerified?: boolean;
  images?: string[];
  email?: string;
}

export interface User {
  id: number;
  userId?: string;
  name?: string;
  mobile?: string;
  password?: string;
  role?: string;
  isDeleted?: boolean;
  telegramUsername?: string;
  profile?: UserProfile;
  images?: UserImage[];
}

export interface UserImage {
  id: number;
  imageUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt?: string;
  profile?: boolean;
}

export interface ConnectionRequest {
  id: number;
  sender?: User;
  receiver?: User;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileResponse {
  id: number;
  name?: string;
  displayName?: string;
  email?: string;
  bio?: string;
  language?: string;
  appearance?: string;
  bodyType?: string;
  height?: number;
  englishLevel?: string;
  ethnicity?: string;
  smoke?: string;
  drink?: string;
  lookingFor?: string;
  verifiedSelfie?: boolean;
  profileImageUrl?: string;
  images?: string[];
  gender?: string;
}

export interface UserSearchResponse {
  name?: string;
  age?: number;
  currentCity?: string;
  bio?: string;
  profileImageUrl?: string;
}

export interface PageUser {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: User[];
  number: number;
  numberOfElements: number;
  empty: boolean;
}

export interface LocationRequest {
  userId: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}

export interface HomeResponse {
  data: User[];
  count: number;
  status: boolean;
}

export interface LoginResponse {
  token?: string;
  userId?: string;
  ID?: number;
  username?: string;
  name?: string;
  mobile?: string;
  gender?: string;
  profileImageUrl?: string;
  sessionId?: string;
  success?: boolean;
  message?: string;
}
