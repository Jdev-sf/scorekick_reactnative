import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { COLORS } from '../../../constants/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSelectedLeague } from '../../../contexts/SelectedLeagueContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { useUserLeagues, useLeagueStandings, useUserStats, useUpcomingMatches } from '../hooks/useHomeData';
import { CompactLeaderboard } from '../components/CompactLeaderboard';
import { DropdownLeagueSelector } from '../components/DropdownLeagueSelector';
import { CompactMatchesList } from '../components/CompactMatchesList';
import { ImprovedCompactSerieAStandings } from '../components/ImprovedCompactSerieAStandings';

export const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { selectedLeague, setSelectedLeague, isLoading: isLoadingSelectedLeague } = useSelectedLeague();
  const { data: userLeagues = [], isLoading: isLoadingLeagues } = useUserLeagues();
  const { data: leagueStandings = [] } = useLeagueStandings(selectedLeague?.id);
  const { data: userStats } = useUserStats();
  const { data: upcomingMatches = [] } = useUpcomingMatches(); // Next matches
  
  const [currentRound, setCurrentRound] = useState(1);
  
  // Animated values for smooth transitions
  const scrollY = useSharedValue(0);
  const headerHeight = 110; // Approximate height of the main header (avatar version)
  
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

  // Auto-select first league if none selected
  useEffect(() => {
    if (!isLoadingSelectedLeague && !selectedLeague && userLeagues.length > 0) {
      setSelectedLeague(userLeagues[0]);
    }
  }, [isLoadingSelectedLeague, selectedLeague, userLeagues, setSelectedLeague]);

  // For now, use global stats (will be enhanced with per-league stats later)
  const selectedLeagueStats = userStats;

  const handleRoundChange = (round: number) => {
    setCurrentRound(round);
    // Here you would typically fetch matches for the selected round
  };

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

  if (isLoadingLeagues || isLoadingSelectedLeague) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 16 }}>
            Caricamento leghe...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (userLeagues.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: colors.textPrimary,
            textAlign: 'center',
            marginBottom: 8
          }}>
            Nessuna Lega
          </Text>
          <Text style={{ 
            color: colors.textSecondary,
            textAlign: 'center'
          }}>
            Non fai ancora parte di nessuna lega. Unisciti o crea una nuova lega per iniziare!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            paddingHorizontal: 16 
          }}>
              <Text 
                style={{ 
                  fontSize: 18, 
                  fontWeight: '700', 
                  color: '#FFFFFF',
                  textShadowColor: 'rgba(0, 0, 0, 0.3)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}
              >
                ScoreKick
              </Text>
              
              {selectedLeague && (
                <View style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                }}>
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: '600'
                  }}>
                    {selectedLeague.name}
                  </Text>
                </View>
              )}
          </View>
        </LinearGradient>
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }}>
        <Animated.ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          decelerationRate="fast"
          scrollEventThrottle={16}
          removeClippedSubviews={true}
          onScroll={scrollHandler}
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
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
                      ScoreKick
                    </Text>
                  </View>
                  
                  <View style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    overflow: 'hidden',
                  }}>
                    <View style={{ width: '100%' }}>
                      <DropdownLeagueSelector
                        leagues={userLeagues}
                        selectedLeague={selectedLeague}
                        onLeagueSelect={setSelectedLeague}
                        userPosition={leagueStandings.find((s: any) => s.is_current_user)?.position}
                        userPoints={selectedLeagueStats?.totalPoints}
                      />
                    </View>
                  </View>
                </Animated.View>
              </SafeAreaView>
            </LinearGradient>
          </Animated.View>

          {/* Content */}
          <View style={{ 
          padding: 20,
          paddingTop: 20,
          gap: 20,
        }}>
          {/* Quick Stats Card */}
          <View 
            style={{ 
              borderRadius: 20,
              padding: 20,
              backgroundColor: colors.surface,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 6,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.secondary,
                marginRight: 8,
              }} />
              <Text 
                style={{ 
                  fontSize: 18, 
                  fontWeight: '600', 
                  color: colors.textPrimary,
                  flex: 1,
                }}
              >
                {selectedLeague?.name || 'Seleziona una lega'}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ 
                alignItems: 'center',
                backgroundColor: colors.primary + '10',
                borderRadius: 12,
                padding: 12,
                flex: 1,
                marginRight: 8,
              }}>
                <Text 
                  style={{ 
                    fontSize: 28, 
                    fontWeight: '700',
                    color: colors.primary,
                    marginBottom: 4,
                  }}
                >
                  {selectedLeagueStats?.totalPoints || 0}
                </Text>
                <Text 
                  style={{ 
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: '500',
                  }}
                >
                  Punti
                </Text>
              </View>
              
              <View style={{ 
                alignItems: 'center',
                backgroundColor: colors.success + '10',
                borderRadius: 12,
                padding: 12,
                flex: 1,
                marginHorizontal: 4,
              }}>
                <Text 
                  style={{ 
                    fontSize: 28, 
                    fontWeight: '700',
                    color: colors.success,
                    marginBottom: 4,
                  }}
                >
                  {leagueStandings.find((s: any) => s.is_current_user)?.position || '-'}°
                </Text>
                <Text 
                  style={{ 
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: '500',
                  }}
                >
                  Posizione
                </Text>
              </View>
              
              <View style={{ 
                alignItems: 'center',
                backgroundColor: colors.warning + '10',
                borderRadius: 12,
                padding: 12,
                flex: 1,
                marginLeft: 8,
              }}>
                <Text 
                  style={{ 
                    fontSize: 28, 
                    fontWeight: '700',
                    color: colors.warning,
                    marginBottom: 4,
                  }}
                >
                  {selectedLeagueStats?.accuracyPercentage?.toFixed(0) || '0'}%
                </Text>
                <Text 
                  style={{ 
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontWeight: '500',
                  }}
                >
                  Accuratezza
                </Text>
              </View>
            </View>
          </View>

          {/* Compact Matches List */}
          <CompactMatchesList
            initialRound={currentRound}
            onRoundChange={handleRoundChange}
          />

          {/* Compact Leaderboard */}
          <CompactLeaderboard
            standings={leagueStandings}
            leagueName={selectedLeague?.name}
            userStats={selectedLeagueStats ? {
              totalPoints: selectedLeagueStats.totalPoints,
              accuracyPercentage: selectedLeagueStats.accuracyPercentage,
              totalPredictions: selectedLeagueStats.totalPredictions,
              correctPredictions: selectedLeagueStats.totalExactPredictions || 0
            } : undefined}
          />

          {/* Improved Serie A Standings */}
          <ImprovedCompactSerieAStandings />
        </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
};