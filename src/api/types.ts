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

export interface SendRequestDTO {
  senderId: string;
  receiverId: string;
}

export interface ActionRequestDTO {
  requestId: string;
  userId: string;
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
  ethnicity?: string;
  englishLevel?: string;
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
  instagramUsername?: string;
  profile?: UserProfile;
  images?: UserImage[];
  payments?: Payment[];
  locations?: UserLocation[];
  termsAcceptance?: TermsAcceptance[];
  supports?: Support[];
  sentRequests?: ConnectionRequest[];
  receivedRequests?: ConnectionRequest[];
  notifications?: Notification[];
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

export interface UserLocation {
  id: number;
  user?: User;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  current?: boolean;
  createdAt?: string;
}

export interface ConnectionRequest {
  id: number;
  sender?: User;
  receiver?: User;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
}

export interface Notification {
  id: number;
  user?: User;
  message?: string;
  readStatus?: boolean;
  createdAt?: string;
}

export interface Payment {
  id: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  plan?: string;
  amount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: User;
}

export interface Support {
  id: number;
  user?: User;
  subject?: string;
  message?: string;
  status?: string;
  createdAt?: string;
}

export interface TermsAcceptance {
  id: number;
  user?: User;
  acceptedAt?: string;
}

// Matches the live /profile/me response exactly — this endpoint never
// returns gender/orientation/age/dob/lookingFor (confirmed against the
// deployed backend). Those values live in shared context/AsyncStorage,
// captured at the point the user actually entered them (registration,
// GenderOrientationScreen, DOBScreen, OnboardingMoreInfoScreen), not here.
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
  verifiedSelfie?: boolean;
  profileImageUrl?: string;
  images?: string[];
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
  pageable?: PageableObject;
  sort?: SortObject[];
}

export interface PageUserProfile {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: UserProfile[];
  number: number;
  numberOfElements: number;
  empty: boolean;
  pageable?: PageableObject;
  sort?: SortObject[];
}

export interface PageableObject {
  paged?: boolean;
  pageNumber?: number;
  pageSize?: number;
  offset?: number;
  sort?: SortObject[];
  unpaged?: boolean;
}

export interface SortObject {
  direction?: string;
  nullHandling?: string;
  ascending?: boolean;
  property?: string;
  ignoreCase?: boolean;
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

export interface SupportRequestDTO {
  userId: number;
  subject: string;
  message: string;
}

export interface ReportRequestDTO {
  byUserId: number;
  targetUserId: number;
  reason: string;
  message?: string;
}

export interface ResolveReportDTO {
  status: string;
}

export interface UserReportResponse {
  id: number;
  reportedUserId?: number;
  reportedById?: number;
  reason?: string;
  message?: string;
  createdAt?: string;
}

export interface SendOtpRequest {
  mobile: string;
}

export interface ResetPasswordRequest {
  mobile: string;
  otp: string;
  newPassword: string;
}

export interface MsgSendOtp {
  mobile: string;
  otp?: string;
}

export interface MsgVerifyOtp {
  userId: number;
  mobile: string;
  otp: string;
}

export interface Subscriber {
  id: number;
  userId?: string;
  price?: number;
  contactView?: number;
  type?: string;
  duration?: number;
  startDate?: string;
  endDate?: string;
  startTime?: LocalTime;
  endTime?: LocalTime;
  eventType?: string;
  subscriptionId?: string;
  cuponCode?: string;
  remainsDays?: number;
  description?: string;
  planType?: string;
  status?: string;
}

export interface LocalTime {
  hour?: number;
  minute?: number;
  second?: number;
  nano?: number;
}
