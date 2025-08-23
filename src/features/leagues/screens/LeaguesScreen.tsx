import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { COLORS } from '../../../constants/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useUserLeagues } from '../hooks/useLeagues';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/hooks/useAuth';
import type { LeaguesNavigationProp } from '../../../navigation/types';

export function LeaguesScreen() {
  const navigation = useNavigation<LeaguesNavigationProp>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { data: leagues, isLoading, error, refetch } = useUserLeagues();
  const insets = useSafeAreaInsets();
  
  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerGradient: {
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerContent: {
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    primaryButton: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    gradientButton: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      borderRadius: 16,
    },
    primaryButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    secondaryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    loadingText: {
      marginTop: 16,
      color: colors.textSecondary,
    },
    errorText: {
      color: colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
      paddingBottom: 100,
      gap: 20,
    },
    emptyState: {
      backgroundColor: colors.card,
      padding: 32,
      borderRadius: 20,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 12,
      elevation: isDark ? 8 : 6,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 40,
    },
    emptyStateIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      color: colors.text,
    },
    emptyStateText: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      color: colors.textSecondary,
    },
    leaguesList: {
      gap: 16,
    },
    leagueCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 12,
      elevation: isDark ? 8 : 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    leagueCardContent: {
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    leagueIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary + (isDark ? '25' : '15'),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.primary + '40',
    },
    leagueInfo: {
      flex: 1,
    },
    leagueName: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      color: colors.text,
    },
    leagueMetrics: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    metricItem: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    metricValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    metricLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    statusBadge: {
      backgroundColor: colors.success + (isDark ? '25' : '15'),
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.success + '40',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.success,
    },
    chevron: {
      fontSize: 24,
      color: colors.textSecondary,
      marginLeft: 8,
    },
  });

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

  const handleCreateLeague = () => {
    navigation.navigate('CreateLeague');
  };

  const handleJoinLeague = () => {
    navigation.navigate('JoinLeague');
  };

  const handleLeaguePress = (leagueId: string) => {
    navigation.navigate('LeagueDetails', { leagueId });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your leagues...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Failed to load leagues: {error.message}
          </Text>
          <Button
            title="Try Again"
            onPress={() => refetch()}
          />
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
                  fontSize: 18, 
                  fontWeight: '700', 
                  color: '#FFFFFF',
                  textShadowColor: 'rgba(0, 0, 0, 0.3)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}
              >
                Le tue leghe
              </Text>
            </View>
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
                      Le tue leghe
                    </Text>
                  </View>
                  
                  <Text style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: 14,
                    marginBottom: 12,
                    textShadowColor: 'rgba(0, 0, 0, 0.2)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 1,
                  }}>
                    Gestisci e partecipa alle competizioni
                  </Text>
                  
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity 
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        overflow: 'hidden',
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      }} 
                      onPress={handleCreateLeague}
                    >
                      <LinearGradient
                        colors={['#FFFFFF', '#F8FAFC']}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{
                          color: colors.primary,
                          fontSize: 14,
                          fontWeight: '600',
                        }}>🎯 Crea Lega</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      }}
                      onPress={handleJoinLeague}
                    >
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: '600',
                      }}>🤝 Unisciti</Text>
                    </TouchableOpacity>
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
          {!leagues || leagues.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🏆</Text>
              <Text style={styles.emptyStateTitle}>
                Nessuna lega ancora
              </Text>
              <Text style={styles.emptyStateText}>
                Crea la tua prima lega o unisciti a una esistente per iniziare a sfidare i tuoi amici!
              </Text>
            </View>
          ) : (
            <View style={styles.leaguesList}>
              {leagues.map((league) => (
                <TouchableOpacity
                  key={league.id}
                  style={styles.leagueCard}
                  onPress={() => handleLeaguePress(league.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.leagueCardContent}>
                    <View style={styles.leagueIcon}>
                      <Text style={{ fontSize: 24 }}>🏆</Text>
                    </View>
                    <View style={styles.leagueInfo}>
                      <Text style={styles.leagueName}>
                        {league.name}
                      </Text>
                      <View style={styles.leagueMetrics}>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricValue}>{league._count?.count || 0}</Text>
                          <Text style={styles.metricLabel}>membri</Text>
                        </View>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>Attiva</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

