import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLeagueDetails } from '../hooks/useLeagues';
import { useLeaguePermissions } from '../hooks/useLeaguePermissions';
import { useAuth } from '../../auth/hooks/useAuth';
import { LeagueStandings } from '../components/LeagueStandings';
import { LeagueStatsSummary } from '../components/LeagueStatsSummary';
import { PermissionGate, CreatorOnly, AdminOnly } from '../components/PermissionGate';
import { Button } from '../../../components/ui/Button';
import { getRoleInfo } from '../utils/permissions';

interface RouteParams {
  leagueId: string;
}

type TabType = 'overview' | 'standings' | 'members' | 'settings';

export function LeagueDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { leagueId } = route.params as RouteParams;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Animated values for smooth transitions
  const scrollY = useSharedValue(0);
  const headerHeight = 140;

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

    return {
      opacity,
    };
  });

  // Animated styles for main header
  const mainHeaderStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, headerHeight],
      [0, -headerHeight * 0.3],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

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
  });

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
  
  const { data: league, isLoading, error } = useLeagueDetails(leagueId);
  const { permissions, userRole, isCreator, isAdmin } = useLeaguePermissions(leagueId);

  const compactSegments = ['📊', '🏆', '👥', '⚙️'];
  
  const handleSegmentChange = (index: number) => {
    setSelectedSegmentIndex(index);
    const tabKeys: TabType[] = ['overview', 'standings', 'members', 'settings'];
    setActiveTab(tabKeys[index]);
  };

  const handleInviteMembers = () => {
    if (!league) return;
    
    Alert.alert(
      'Invite Members',
      `Share this invite code: ${league.invite_code}`,
      [{ text: 'OK' }]
    );
  };

  const handleLeaveLeague = () => {
    Alert.alert(
      'Leave League',
      'Are you sure you want to leave this league?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => {
          // Handle leave league
          navigation.goBack();
        }}
      ]
    );
  };

  const handleDeleteLeague = () => {
    Alert.alert(
      'Delete League',
      'Are you sure you want to delete this league? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // Handle delete league
          navigation.goBack();
        }}
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading league details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !league) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>Failed to load league details</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const roleInfo = userRole ? getRoleInfo(userRole) : null;

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      <LeagueStatsSummary leagueId={leagueId} />
      
      <View style={styles.quickActionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        
        <PermissionGate leagueId={leagueId} permission="canInviteMembers">
          <Button
            title="Invite Members"
            onPress={handleInviteMembers}
            style={styles.actionButton}
          />
        </PermissionGate>

        <Button
          title="View All Standings"
          onPress={() => handleSegmentChange(1)}
          variant="outline"
          style={styles.actionButton}
        />

        <AdminOnly leagueId={leagueId}>
          <Button
            title="Manage Members"
            onPress={() => handleSegmentChange(2)}
            variant="outline"
            style={styles.actionButton}
          />
        </AdminOnly>
      </View>

      <View style={styles.leagueInfoSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>League Information</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Invite Code:</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{league.invite_code}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Members:</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{league.members?.length || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Your Role:</Text>
            <View style={styles.roleContainer}>
              <Text style={styles.roleIcon}>{roleInfo?.icon}</Text>
              <Text style={[styles.infoValue, { color: roleInfo?.color }]}>
                {roleInfo?.label}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderStandings = () => (
    <LeagueStandings leagueId={leagueId} showUserHighlight={true} />
  );

  const renderMembers = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.membersSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>League Members</Text>
        {league.members?.map((member) => {
          const memberRoleInfo = getRoleInfo(member.role as any);
          return (
            <View key={member.user_id} style={[styles.memberCard, { backgroundColor: colors.surface }]}>
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                  {member.user?.display_name || 'Unknown User'}
                </Text>
                <View style={styles.memberRole}>
                  <Text style={styles.roleIcon}>{memberRoleInfo?.icon}</Text>
                  <Text style={[styles.roleText, { color: memberRoleInfo?.color }]}>
                    {memberRoleInfo?.label}
                  </Text>
                </View>
              </View>
              <View style={styles.memberStats}>
                <Text style={[styles.memberPoints, { color: colors.textPrimary }]}>{member.total_points} pts</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.settingsSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>League Settings</Text>
        
        <View style={styles.settingsGroup}>
          <Text style={[styles.settingsGroupTitle, { color: colors.textSecondary }]}>Actions</Text>
          
          <PermissionGate leagueId={leagueId} permission="canLeaveLeague">
            <TouchableOpacity style={[styles.settingsItem, { backgroundColor: colors.surface }]} onPress={handleLeaveLeague}>
              <Text style={[styles.settingsItemText, { color: colors.textPrimary }]}>Leave League</Text>
              <Text style={styles.settingsItemIcon}>🚪</Text>
            </TouchableOpacity>
          </PermissionGate>

          <CreatorOnly leagueId={leagueId}>
            <TouchableOpacity style={[styles.settingsItem, { backgroundColor: colors.surface }]} onPress={handleDeleteLeague}>
              <Text style={[styles.settingsItemText, { color: colors.error }]}>Delete League</Text>
              <Text style={styles.settingsItemIcon}>🗑️</Text>
            </TouchableOpacity>
          </CreatorOnly>
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (selectedSegmentIndex) {
      case 0: return renderOverview();
      case 1: return renderStandings();
      case 2: return renderMembers();
      case 3: return renderSettings();
      default: return renderOverview();
    }
  };

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
            flex: 1,
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
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={{
                  marginRight: 12,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 20, color: '#FFFFFF', fontWeight: 'normal' }}>‹</Text>
              </TouchableOpacity>
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
                {league?.name}
              </Text>
            </View>
            
            <SegmentedControl
              values={compactSegments}
              selectedIndex={selectedSegmentIndex}
              onChange={(event) => {
                handleSegmentChange(event.nativeEvent.selectedSegmentIndex);
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
          contentContainerStyle={{ paddingBottom: 120 }}
          onScroll={scrollHandler}
        >
          {/* Main Header */}
          <Animated.View style={mainHeaderStyle}>
            <LinearGradient
              colors={[colors.primary, '#1565C0', colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <SafeAreaView>
                <Animated.View
                  style={[
                    {
                      paddingHorizontal: 20,
                      paddingTop: 0,
                      paddingBottom: 24,
                    },
                    headerContentStyle,
                  ]}
                >
                  {/* Back Button */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <TouchableOpacity
                      onPress={() => navigation.goBack()}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ 
                        fontSize: 20, 
                        color: '#FFFFFF', 
                        fontWeight: 'normal',
                      }}>‹</Text>
                    </TouchableOpacity>
                    
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    }}>
                      <Text style={{ fontSize: 18, color: '#FFFFFF' }}>🏆</Text>
                    </View>
                  </View>

                  {/* Header Content */}
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
                      {league?.name}
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
                    Dettagli della lega
                  </Text>
                  
                  <SegmentedControl
                    values={['📊 Panoramica', '🏆 Classifica', '👥 Membri', '⚙️ Impostazioni']}
                    selectedIndex={selectedSegmentIndex}
                    onChange={(event) => {
                      handleSegmentChange(event.nativeEvent.selectedSegmentIndex);
                    }}
                    style={{ height: 36 }}
                    tintColor="#FFFFFF"
                    backgroundColor="rgba(255, 255, 255, 0.2)"
                    textColor="rgba(255, 255, 255, 0.8)"
                    activeFontStyle={{ fontWeight: '600', color: colors.primary }}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  quickActionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  leagueInfoSection: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIcon: {
    marginRight: 4,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  membersSection: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  memberRole: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberStats: {
    alignItems: 'flex-end',
  },
  memberPoints: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  settingsSection: {
    padding: 16,
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
  },
  settingsGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingsItemText: {
    fontSize: 16,
    color: '#111827',
  },
  settingsItemIcon: {
    fontSize: 16,
  },
});