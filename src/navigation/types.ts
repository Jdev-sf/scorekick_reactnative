import { NavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Predictions: undefined;
  Leagues: undefined;
  Profile: undefined;
};

export type LeaguesStackParamList = {
  LeaguesList: undefined;
  LeagueDetails: { leagueId: string };
  CreateLeague: undefined;
  JoinLeague: undefined;
  LeagueSettings: { leagueId: string };
};

export type PredictionsStackParamList = {
  PredictionsList: undefined;
  PredictionDetails: { matchId: string; leagueId: string };
  MatchDetails: { matchId: string };
};

export type ProfileStackParamList = {
  ProfileOverview: undefined;
  EditProfile: undefined;
  Statistics: undefined;
  Achievements: undefined;
  Settings: undefined;
};

export type RootNavigationProp = NavigationProp<RootStackParamList>;
export type AuthNavigationProp = NavigationProp<AuthStackParamList>;
export type MainTabNavigationProp = NavigationProp<MainTabParamList>;
export type LeaguesNavigationProp = NavigationProp<LeaguesStackParamList>;
export type PredictionsNavigationProp = NavigationProp<PredictionsStackParamList>;
export type ProfileNavigationProp = NavigationProp<ProfileStackParamList>;

// Combined type for main app navigation
export type MainNavigationProp = NavigationProp<LeaguesStackParamList & PredictionsStackParamList & ProfileStackParamList>;