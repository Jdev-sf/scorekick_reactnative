import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { COLORS } from '../../../constants/theme';
import { useUserStats } from '../../home/hooks/useHomeData';
import { useAchievements } from '../../achievements/hooks/useAchievements';
import { ProfileStackNavigationProp } from '../../../navigation/types';

export const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const navigation = useNavigation<ProfileStackNavigationProp>();
  const { data: userStats, isLoading: statsLoading } = useUserStats();
  const { userAchievements, isLoading: achievementsLoading } = useAchievements({ 
    autoCheck: false // Disabilita auto-check per evitare errori
  });
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Animated values for smooth transitions
  const scrollY = useSharedValue(0);
  const headerHeight = 110; // Approximate height of the main header

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

  const handleLogout = () => {
    Alert.alert(
      'Conferma Logout',
      'Sei sicuro di voler uscire dall\'app?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Errore', 'Impossibile effettuare il logout');
            } finally {
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  };


  // Generate user initials for avatar (consistent with other screens)
  const getUserInitials = () => {
    if (user?.user_metadata?.display_name) {
      const nameParts = user.user_metadata.display_name.trim().split(/\s+/);
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // Show earned achievements (first 3)
  const earnedAchievements = (userAchievements || []).slice(0, 3);
  
  if (statsLoading || achievementsLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 16 }}>
            Caricamento profilo...
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                }}
              >
                Profilo
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Settings')}
              style={{ 
                padding: 6, 
                borderRadius: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              <Text style={{ fontSize: 16 }}>⚙️</Text>
            </TouchableOpacity>
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
                {/* Settings button in top right corner */}
                <Animated.View 
                  style={[
                    { 
                      position: 'absolute',
                      top: 10,
                      right: 20,
                      zIndex: 10,
                    },
                    headerContentStyle
                  ]}
                >
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('Settings')}
                    style={{ 
                      padding: 8, 
                      borderRadius: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <Text style={{ fontSize: 18, color: '#FFFFFF' }}>⚙️</Text>
                  </TouchableOpacity>
                </Animated.View>
                
                <Animated.View 
                  style={[
                    { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 0 },
                    headerContentStyle
                  ]}
                >
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <View style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 16,
                      borderWidth: 3,
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    }}>
                      <Text style={{ 
                        fontSize: 28, 
                        fontWeight: '700',
                        color: '#FFFFFF',
                        textShadowColor: 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
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
                        marginBottom: 4,
                        textAlign: 'center',
                      }}
                    >
                      {user?.user_metadata?.display_name || 'Nome Utente'}
                    </Text>
                    
                    <Text style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: 16,
                      marginBottom: 4,
                      textAlign: 'center',
                      textShadowColor: 'rgba(0, 0, 0, 0.2)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 1,
                    }}>
                      {user?.email}
                    </Text>
                    
                    <Text style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: 14,
                      textAlign: 'center',
                      textShadowColor: 'rgba(0, 0, 0, 0.2)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 1,
                    }}>
                      Membro dal {formatJoinDate(user?.created_at || '')}
                    </Text>
                  </View>
                </Animated.View>
              </SafeAreaView>
            </LinearGradient>
          </Animated.View>

          {/* Content */}
          <View style={{ 
            padding: 20,
            paddingTop: 20,
          }}>
        <View style={{ gap: 24 }}>
          {/* Stats Overview */}
          <View 
            style={{ 
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}
          >
            <Text 
              style={{ 
                fontSize: 18, 
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: 16
              }}
            >
              Statistiche Generali
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <View 
                style={{ 
                  flex: 1,
                  minWidth: '45%',
                  padding: 12,
                  backgroundColor: colors.primary + '10',
                  borderRadius: 8,
                  alignItems: 'center'
                }}
              >
                <Text 
                  style={{ 
                    fontSize: 24, 
                    fontWeight: 'bold',
                    color: colors.primary
                  }}
                >
                  {userStats?.totalPoints || 0}
                </Text>
                <Text 
                  style={{ 
                    fontSize: 14,
                    color: colors.textSecondary
                  }}
                >
                  Punti Totali
                </Text>
              </View>
              
              <View 
                style={{ 
                  flex: 1,
                  minWidth: '45%',
                  padding: 12,
                  backgroundColor: colors.success + '10',
                  borderRadius: 8,
                  alignItems: 'center'
                }}
              >
                <Text 
                  style={{ 
                    fontSize: 24, 
                    fontWeight: 'bold',
                    color: colors.success
                  }}
                >
                  {userStats?.totalExactPredictions || 0}
                </Text>
                <Text 
                  style={{ 
                    fontSize: 14,
                    color: colors.textSecondary
                  }}
                >
                  Risultati Esatti
                </Text>
              </View>
              
              <View 
                style={{ 
                  flex: 1,
                  minWidth: '45%',
                  padding: 12,
                  backgroundColor: colors.warning + '10',
                  borderRadius: 8,
                  alignItems: 'center'
                }}
              >
                <Text 
                  style={{ 
                    fontSize: 24, 
                    fontWeight: 'bold',
                    color: colors.warning
                  }}
                >
                  {userStats?.accuracyPercentage?.toFixed(0) || 0}%
                </Text>
                <Text 
                  style={{ 
                    fontSize: 14,
                    color: colors.textSecondary
                  }}
                >
                  Accuratezza
                </Text>
              </View>
              
              <View 
                style={{ 
                  flex: 1,
                  minWidth: '45%',
                  padding: 12,
                  backgroundColor: colors.secondary + '10',
                  borderRadius: 8,
                  alignItems: 'center'
                }}
              >
                <Text 
                  style={{ 
                    fontSize: 24, 
                    fontWeight: 'bold',
                    color: colors.secondary
                  }}
                >
                  {userStats?.activeLeagues || 0}
                </Text>
                <Text 
                  style={{ 
                    fontSize: 14,
                    color: colors.textSecondary
                  }}
                >
                  Leghe Attive
                </Text>
              </View>
            </View>
          </View>

          {/* Achievements */}
          <View 
            style={{ 
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}
          >
            <Text 
              style={{ 
                fontSize: 18, 
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: 16
              }}
            >
              Achievement
            </Text>
            <View style={{ gap: 12 }}>
              {earnedAchievements.length > 0 ? (
                earnedAchievements.map((userAchievement: any) => (
                  <View 
                    key={userAchievement.achievement_id}
                    style={{ 
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      backgroundColor: colors.warning + '10',
                      borderRadius: 8
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>
                      {userAchievement.achievement.icon || '🏆'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text 
                        style={{ 
                          fontWeight: '500',
                          color: colors.textPrimary
                        }}
                      >
                        {userAchievement.achievement.name}
                      </Text>
                      <Text 
                        style={{ 
                          fontSize: 14,
                          color: colors.textSecondary
                        }}
                      >
                        {userAchievement.achievement.description}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text 
                  style={{ 
                    textAlign: 'center',
                    color: colors.textSecondary,
                    padding: 16
                  }}
                >
                  Nessun achievement sbloccato ancora
                </Text>
              )}
            </View>
          </View>


          {/* Logout */}
          <View 
            style={{ 
              backgroundColor: colors.surface,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}
          >
            <TouchableOpacity 
              style={{ 
                padding: 16,
                alignItems: 'center'
              }}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <Text 
                style={{ 
                  color: colors.error,
                  fontWeight: '500',
                  opacity: isLoggingOut ? 0.6 : 1
                }}
              >
                {isLoggingOut ? 'Disconnessione...' : 'Logout'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
};

