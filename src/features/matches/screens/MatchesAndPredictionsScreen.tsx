import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSelectedLeague } from '../../../contexts/SelectedLeagueContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { COLORS } from '../../../constants/theme';
import { MatchCalendar } from '../components/MatchCalendar';
import { SerieAStandings } from '../components/SerieAStandings';
import { SeasonProvider, useSeasonContext } from '../contexts/SeasonContext';
import { useSyncData } from '../hooks/useMatches';
import { NetworkStatusIndicator } from '../../../components/common/NetworkStatusIndicator';
import { OfflineNotice } from '../../../components/common/OfflineNotice';
import type { Match } from '../types';

type TabType = 'calendar' | 'predictions' | 'standings';

function MatchesAndPredictionsScreenContent() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { selectedLeague } = useSelectedLeague();
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0);
  const syncDataMutation = useSyncData();
  const { selectedSeason, getSeasonDisplay } = useSeasonContext();

  // Animated values for smooth transitions
  const scrollY = useSharedValue(0);
  const headerHeight = 120; // Approximate height of the main header

  // Animated scroll handler
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Animated styles for sticky header
  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [headerHeight * 0.5, headerHeight * 0.8],
      [0, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [headerHeight * 0.5, headerHeight * 0.8],
      [-20, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  }, [headerHeight]);

  // Animated styles for main header with parallax effect
  const mainHeaderStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, headerHeight],
      [0, -headerHeight * 0.3],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [0, headerHeight],
      [1, 0.9],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateY },
        { scale }
      ],
    };
  }, [headerHeight]);

  // Animated styles for header content
  const headerContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, headerHeight * 0.6],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  }, [headerHeight]);

  // Generate user initials for avatar
  const getUserInitials = () => {
    if (user?.display_name) {
      const nameParts = user.display_name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    
    if (user?.email) {
      const email = user.email;
      const parts = email.split('@')[0].split(/[._-]/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return email[0].toUpperCase();
    }
    
    return 'U';
  };

  // Check for initial tab parameter
  useEffect(() => {
    const params = route.params as any;
    if (params?.initialTab !== undefined) {
      setSelectedSegmentIndex(params.initialTab);
    }
  }, [route.params]);

  const segments = ['I Miei Pronostici', 'Classifica', 'Storico'];
  const compactSegments = ['📊', '🏆', '📈']; // Icons for sticky header

  // Auto-sync on component mount (one time only)
  useEffect(() => {
    const autoSync = async () => {
      try {
        console.log('[MatchesAndPredictionsScreen] Auto-syncing data...');
        await syncDataMutation.mutateAsync();
      } catch (error) {
        console.log('[MatchesAndPredictionsScreen] Auto-sync failed, will rely on cached data:', error);
        // Fail silently - users will still see cached data
      }
    };

    // Auto-sync only on first mount
    autoSync();
  }, []);

  const handleMatchPress = (match: Match) => {
    navigation.navigate('MatchDetails', { match });
  };

  const handleRefresh = async () => {
    try {
      console.log('[MatchesAndPredictionsScreen] Manual refresh triggered');
      await syncDataMutation.mutateAsync();
    } catch (error) {
      console.log('[MatchesAndPredictionsScreen] Refresh failed:', error);
      // Fail silently for better UX
    }
  };

  const renderTabContent = () => {
    switch (selectedSegmentIndex) {
      case 0:
        return (
          <View style={styles.tabContent}>
            <MatchCalendar 
              onMatchPress={handleMatchPress} 
              onRefresh={handleRefresh}
              refreshing={syncDataMutation.isPending}
            />
          </View>
        );
      case 1:
        return (
          <View style={styles.tabContent}>
            <SerieAStandings 
              onRefresh={handleRefresh}
              refreshing={syncDataMutation.isPending}
            />
          </View>
        );
      case 2:
        return (
          <View style={[styles.tabContent, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>
              Storico Pronostici
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
              Funzionalità in arrivo...
            </Text>
          </View>
        );
      default:
        return (
          <View style={styles.tabContent}>
            <MatchCalendar 
              onMatchPress={handleMatchPress} 
              onRefresh={handleRefresh}
              refreshing={syncDataMutation.isPending}
            />
          </View>
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NetworkStatusIndicator />
      <OfflineNotice 
        message="Limited connectivity. Match data may be outdated."
        onRetry={handleRefresh}
      />
      
      {/* Animated Sticky Header */}
      <Animated.View 
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 88,
            paddingTop: StatusBar.currentHeight || 44,
          },
          stickyHeaderStyle,
        ]}
      >
        <LinearGradient
          colors={[colors.primary, '#1565C0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ 
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View style={{ 
            flex: 1,
            paddingHorizontal: 16 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.4)',
              }}>
                <Text style={{ 
                  fontSize: 12, 
                  fontWeight: '700',
                  color: '#FFFFFF',
                }}>
                  {getUserInitials()}
                </Text>
              </View>
              <Text 
                style={{ 
                  fontSize: 16, 
                  fontWeight: '700', 
                  color: '#FFFFFF',
                  flex: 1,
                }}
                numberOfLines={1}
              >
                Pronostici
              </Text>
              {syncDataMutation.isPending && (
                <Text style={{ 
                  fontSize: 12, 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontStyle: 'italic' 
                }}>
                  Aggiornando...
                </Text>
              )}
            </View>
            
            <SegmentedControl
              values={compactSegments}
              selectedIndex={selectedSegmentIndex}
              onChange={(event) => {
                setSelectedSegmentIndex(event.nativeEvent.selectedSegmentIndex);
              }}
              style={{ height: 32 }}
              tintColor="#FFFFFF"
              backgroundColor="rgba(255, 255, 255, 0.2)"
              textColor="rgba(255, 255, 255, 0.8)"
              activeFontStyle={{ fontWeight: '600', color: colors.primary, fontSize: 14 }}
            />
          </View>
        </LinearGradient>
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }}>
        <Animated.ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          decelerationRate="fast"
          scrollEventThrottle={16}
          removeClippedSubviews={true}
          onScroll={scrollHandler}
          refreshControl={
            <RefreshControl
              refreshing={syncDataMutation.isPending}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Animated.View style={mainHeaderStyle}>
            <LinearGradient
              colors={[colors.primary, '#1565C0', colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ 
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
              }}
            >
              <SafeAreaView>
                <Animated.View 
                  style={[
                    { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 0 },
                    headerContentStyle
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 10,
                      borderWidth: 2,
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    }}>
                      <Text style={{ 
                        fontSize: 14, 
                        fontWeight: '700',
                        color: '#FFFFFF',
                        textShadowColor: 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 1,
                      }}>
                        {getUserInitials()}
                      </Text>
                    </View>
                    <Text 
                      style={{ 
                        fontSize: 24, 
                        fontWeight: '700', 
                        color: '#FFFFFF',
                        textShadowColor: 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}
                    >
                      Pronostici
                    </Text>
                  </View>
                  
                  <Text style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: 14,
                    marginBottom: 16,
                    textAlign: 'center',
                    textShadowColor: 'rgba(0, 0, 0, 0.2)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 1,
                  }}>
                    {selectedSegmentIndex === 0 && selectedLeague ? selectedLeague.name :
                     selectedSegmentIndex === 1 ? `Serie A ${selectedSeason ? getSeasonDisplay(selectedSeason) : '2024-25'}` :
                     'Storico pronostici'}
                  </Text>
                  
                  <SegmentedControl
                    values={segments}
                    selectedIndex={selectedSegmentIndex}
                    onChange={(event) => {
                      setSelectedSegmentIndex(event.nativeEvent.selectedSegmentIndex);
                    }}
                    style={{ height: 36 }}
                    tintColor="#FFFFFF"
                    backgroundColor="rgba(255, 255, 255, 0.2)"
                    textColor="rgba(255, 255, 255, 0.8)"
                    activeFontStyle={{ fontWeight: '600', color: COLORS.primary }}
                  />
                </Animated.View>
              </SafeAreaView>
            </LinearGradient>
          </Animated.View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            {renderTabContent()}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function MatchesAndPredictionsScreen() {
  return (
    <SeasonProvider autoSelectCurrent={true}>
      <MatchesAndPredictionsScreenContent />
    </SeasonProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  syncStatus: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  segmentedControl: {
    height: 32,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20, // Ridotto da 120 a 20
  },
});