import { User } from '../../api/types';

export type RootParamList = {
  Register: undefined;
  Privacy: undefined;
  Home: undefined;
  Login: { pendingOtpUserId?: string; pendingOtpMobile?: string } | undefined;
  ForgotPassword: undefined;
  DisplayName: undefined;
  GenderOrientation: undefined;
  DOB: undefined;
  UploadImage: undefined;
  AboutProfile: undefined;
  ConnectTelegram: undefined;
  SearchSettings: undefined;
  BottomTabs: undefined;
  ProfileSettingsScreen: undefined;
  ViewMyProfileScreen: { userId?: number; userUserId?: string; userData?: User } | undefined;
  OtpVerification: { sessionId: string; mobile: string };
};
