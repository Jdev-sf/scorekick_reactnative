import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList, LeaguesStackParamList, MatchesStackParamList, PredictionsStackParamList, ProfileStackParamList } from './types';

// League screens
import { LeaguesScreen } from '../features/leagues/screens/LeaguesScreen';
import { CreateLeagueScreen } from '../features/leagues/screens/CreateLeagueScreen';
import { JoinLeagueScreen } from '../features/leagues/screens/JoinLeagueScreen';
import { LeagueDetailsScreen } from '../features/leagues/screens/LeagueDetailsScreen';

// Match screens
import { MatchesScreen } from '../features/matches/screens/MatchesScreen';
import { MatchDetailsScreen } from '../features/matches/screens/MatchDetailsScreen';

// Placeholder screens - will be implemented later
const HomeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Home Screen</Text>
  </View>
);
const PredictionsListScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Predictions List Screen</Text>
  </View>
);
const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Profile Screen</Text>
  </View>
);

const LeaguesStack = createStackNavigator<LeaguesStackParamList>();
const MatchesStack = createStackNavigator<MatchesStackParamList>();
const PredictionsStack = createStackNavigator<PredictionsStackParamList>();
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
    <MatchesStack.Screen name="MatchesOverview" component={MatchesScreen} />
    <MatchesStack.Screen name="MatchDetails" component={MatchDetailsScreen} />
  </MatchesStack.Navigator>
);

const PredictionsNavigator = () => (
  <PredictionsStack.Navigator screenOptions={{ headerShown: false }}>
    <PredictionsStack.Screen name="PredictionsList" component={PredictionsListScreen} />
  </PredictionsStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileOverview" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

const MainTab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: Math.max(insets.bottom, 5),
          paddingTop: 5,
          height: Math.max(60 + insets.bottom, 60),
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>🏠</Text>,
        }}
      />
      <MainTab.Screen 
        name="Matches" 
        component={MatchesNavigator}
        options={{
          tabBarLabel: 'Partite',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>⚽</Text>,
        }}
      />
      <MainTab.Screen 
        name="Predictions" 
        component={PredictionsNavigator}
        options={{
          tabBarLabel: 'Pronostici',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>🎯</Text>,
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