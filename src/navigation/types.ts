import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Navigator
export type AuthStackParamList = {
  LanguageSelection: undefined;
  Splash: undefined;
  Intro: undefined;
  Register: undefined;
  PhoneVerification: {
    userId: string;
    phone: string;
  };
  EmailVerification: {
    userId: string;
    email: string;
  };
  Login: undefined;
};

// Onboarding Navigator
export type OnboardingStackParamList = {
  SetupChoice: undefined;
  VoiceSetup: undefined;
  ManualSetup: undefined;
  Welcome: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Dashboard: undefined;
  FamilyMatches: undefined;
  FriendMatches: undefined;
  Communities: undefined;
  Profile: undefined;
};

// Main Stack Navigator (includes tabs and other screens)
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  MatchDetails: {
    matchId: string;
    matchType: 'family' | 'friend';
  };
  CommunityDetails: {
    communityId: string;
  };
  Chat: {
    conversationId: string;
    otherUser: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  AIAssistant: undefined;
  Settings: undefined;
  Notifications: undefined;
  CreateCommunity: undefined;
  ConnectSocial: undefined;
  PrivacySettings: undefined;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

// Navigation prop types
export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: any;
  route: { params: RootStackParamList[T] };
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = {
  navigation: any;
  route: { params: AuthStackParamList[T] };
};

export type OnboardingStackScreenProps<T extends keyof OnboardingStackParamList> = {
  navigation: any;
  route: { params: OnboardingStackParamList[T] };
};

export type MainStackScreenProps<T extends keyof MainStackParamList> = {
  navigation: any;
  route: { params: MainStackParamList[T] };
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = {
  navigation: any;
  route: { params: MainTabParamList[T] };
};