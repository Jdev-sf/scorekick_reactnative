import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MainTabParamList, LeaguesStackParamList, PredictionsStackParamList, ProfileStackParamList } from './types';

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
const LeaguesListScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Leagues List Screen</Text>
  </View>
);
const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Profile Screen</Text>
  </View>
);

const LeaguesStack = createStackNavigator<LeaguesStackParamList>();
const PredictionsStack = createStackNavigator<PredictionsStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

const LeaguesNavigator = () => (
  <LeaguesStack.Navigator screenOptions={{ headerShown: false }}>
    <LeaguesStack.Screen name="LeaguesList" component={LeaguesListScreen} />
  </LeaguesStack.Navigator>
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
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          height: 60,
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
        name="Predictions" 
        component={PredictionsNavigator}
        options={{
          tabBarLabel: 'Pronostici',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>⚽</Text>,
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