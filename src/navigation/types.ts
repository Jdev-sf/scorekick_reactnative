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
  Matches: undefined;
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

export type MatchesStackParamList = {
  MatchesOverview: undefined;
  MatchDetails: { match: any; leagueId?: string };
};

export type ProfileStackParamList = {
  ProfileOverview: undefined;
  EditProfile: undefined;
  Statistics: undefined;
  Achievements: undefined;
  Settings: undefined;
  ThemeSettings: undefined;
};

export type RootNavigationProp = NavigationProp<RootStackParamList>;
export type AuthNavigationProp = NavigationProp<AuthStackParamList>;
export type MainTabNavigationProp = NavigationProp<MainTabParamList>;
export type LeaguesNavigationProp = NavigationProp<LeaguesStackParamList>;
export type MatchesNavigationProp = NavigationProp<MatchesStackParamList>;
export type ProfileNavigationProp = NavigationProp<ProfileStackParamList>;
export type ProfileStackNavigationProp = NavigationProp<ProfileStackParamList>;

// Combined type for main app navigation
export type MainNavigationProp = NavigationProp<LeaguesStackParamList & MatchesStackParamList & ProfileStackParamList>;