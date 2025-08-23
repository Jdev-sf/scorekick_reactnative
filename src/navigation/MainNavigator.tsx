import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { MainTabParamList, LeaguesStackParamList, MatchesStackParamList, ProfileStackParamList } from './types';
import { COLORS } from '../constants/theme';

// League screens
import { LeaguesScreen } from '../features/leagues/screens/LeaguesScreen';
import { CreateLeagueScreen } from '../features/leagues/screens/CreateLeagueScreen';
import { JoinLeagueScreen } from '../features/leagues/screens/JoinLeagueScreen';
import { LeagueDetailsScreen } from '../features/leagues/screens/LeagueDetailsScreen';

// Match screens
import { MatchesAndPredictionsScreen } from '../features/matches/screens/MatchesAndPredictionsScreen';
import { MatchDetailsScreen } from '../features/matches/screens/MatchDetailsScreen';

// Import implemented screens
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { ThemeSettingsScreen } from '../features/settings/screens/ThemeSettingsScreen';

const LeaguesStack = createStackNavigator<LeaguesStackParamList>();
const MatchesStack = createStackNavigator<MatchesStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

const LeaguesNavigator = () => (
  <LeaguesStack.Navigator screenOptions={{ headerShown: false }}>
    <LeaguesStack.Screen name="LeaguesList" component={LeaguesScreen} />
    <LeaguesStack.Screen name="CreateLeague" component={CreateLeagueScreen} />
    <LeaguesStack.Screen name="JoinLeague" component={JoinLeagueScreen} />
    <LeaguesStack.Screen name="LeagueDetails" component={LeagueDetailsScreen} />
  </LeaguesStack.Navigator>
);

const MatchesNavigator = () => (
  <MatchesStack.Navigator screenOptions={{ headerShown: false }}>
    <MatchesStack.Screen name="MatchesOverview" component={MatchesAndPredictionsScreen} />
    <MatchesStack.Screen name="MatchDetails" component={MatchDetailsScreen} />
  </MatchesStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileOverview" component={ProfileScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
  </ProfileStack.Navigator>
);

const MainTab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 12,
          height: Math.max(70 + insets.bottom, 70),
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size - 2 }}>🏟️</Text>,
        }}
      />
      <MainTab.Screen 
        name="Matches" 
        component={MatchesNavigator}
        options={{
          tabBarLabel: 'Pronostici',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size - 2 }}>⚽</Text>,
        }}
      />
      <MainTab.Screen 
        name="Leagues" 
        component={LeaguesNavigator}
        options={{
          tabBarLabel: 'Leghe',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>🏆</Text>,
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profilo',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>👤</Text>,
        }}
      />
    </MainTab.Navigator>
  );
};