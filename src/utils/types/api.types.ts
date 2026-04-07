/**
 * API Types generated from Swagger Schema
 */

export interface User {
  id: number;
  name: string;
  mobile: string;
  password?: string;
  role?: string;
  isDeleted?: boolean;
  telegramUsername?: string;
  profile?: UserProfile;
  payments?: Payment[];
  subscriptions?: Subscription;
}

export interface UserProfile {
  id: number;
  displayName?: string;
  gender?: string;
  orientation?: string;
  age?: number;
  bio?: string;
  dob?: string; // format: date
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
  selfieVerified?: boolean;
  currentCity?: string;
  currentState?: string;
  currentCountry?: string;
  currentLat?: number;
  currentLng?: number;
  online?: boolean;
  lastSeen?: string; // format: date-time
  createdAt?: string; // format: date-time
}

export interface UserFilterRequest {
  userId?: number;
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
  minAge?: number;
  maxAge?: number;
  language?: string;
  ethnicity?: string;
  smoke?: string;
  drink?: string;
  sortBy?: string;
}

export interface RegisterRequest {
  name: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  otp: string;
}

export interface LoginRequest {
  mobile: string;
  password: string;
}

export interface ProfileRequestDTO {
  displayName?: string;
  gender?: string;
  orientation?: string;
  age?: number;
  bio?: string;
  dob?: string; // example: "2002-05-15"
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

export interface ConnectionRequest {
  id: number;
  sender: User;
  receiver: User;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: number;
  plan: string;
  active: boolean;
  startDate: string;
  endDate: string;
  user?: User;
}

export interface Payment {
  id: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  plan: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface UserLocation {
  id: number;
  userId: number;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  current?: boolean;
  createdAt?: string;
}

export interface ActionRequestDTO {
  requestId: number;
  userId: number;
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

export interface ProfileResponse extends Partial<UserProfile> {
  id: number;
  name: string;
  email?: string;
  images?: string[];
}
