import { User, SearchFilterRequest } from '../../api/types';

export type RootParamList = {
  Register: undefined;
  Privacy: undefined;
  Home: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  DisplayName: undefined;
  GenderOrientation: undefined;
  DOB: undefined;
  UploadImage: undefined;
  SearchSettings: undefined;
  BottomTabs: undefined;
  ProfileSettingsScreen: undefined;
  ViewMyProfileScreen: { userId?: number; userUserId?: string; userData?: User } | undefined;
  OtpVerification: { sessionId: string; mobile: string };
  Notifications: undefined;
  PrivacyStatus: undefined;
  SupportTickets: undefined;
  SearchResults: { filters: SearchFilterRequest };
  SelfieVerification: undefined;
};
