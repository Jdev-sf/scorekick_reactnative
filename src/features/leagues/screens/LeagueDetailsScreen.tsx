import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLeagueDetails } from '../hooks/useLeagues';
import { useLeaguePermissions } from '../hooks/useLeaguePermissions';
import { LeagueStandings } from '../components/LeagueStandings';
import { LeagueStatsSummary } from '../components/LeagueStatsSummary';
import { PermissionGate, CreatorOnly, AdminOnly } from '../components/PermissionGate';
import { Button } from '../../../components/ui/Button';
import { getRoleInfo } from '../utils/permissions';
import type { LeaguesNavigationProp } from '../../../navigation/types';

type RouteParams = {
  leagueId: string;
};

type TabType = 'overview' | 'standings' | 'members' | 'settings';

export function LeagueDetailsScreen() {
  const navigation = useNavigation<LeaguesNavigationProp>();
  const route = useRoute();
  const { leagueId } = route.params as RouteParams;
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const { data: league, isLoading, error } = useLeagueDetails(leagueId);
  const { permissions, userRole, isCreator, isAdmin } = useLeaguePermissions(leagueId);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'standings', label: 'Standings', icon: '🏆' },
    { key: 'members', label: 'Members', icon: '👥' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleInviteMembers = () => {
    if (!league) return;
    
    Alert.alert(
      'Invite Code',
      `Share this code with friends to invite them to your league: ${league.invite_code}`,
      [
        { text: 'Copy Code', onPress: () => {/* Copy to clipboard */} },
        { text: 'Share', onPress: () => {/* Share functionality */} },
        { text: 'Close' },
      ]
    );
  };

  const handleLeaveLeague = () => {
    Alert.alert(
      'Leave League',
      'Are you sure you want to leave this league? You will lose access to all league data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => {/* Leave league */} },
      ]
    );
  };

  const handleDeleteLeague = () => {
    Alert.alert(
      'Delete League',
      'Are you sure you want to delete this league? This action cannot be undone and all data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {/* Delete league */} },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading league details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !league) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load league details</Text>
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
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <PermissionGate leagueId={leagueId} permission="canInviteMembers">
          <Button
            title="Invite Members"
            onPress={handleInviteMembers}
            style={styles.actionButton}
          />
        </PermissionGate>

        <Button
          title="View All Standings"
          onPress={() => setActiveTab('standings')}
          variant="outline"
          style={styles.actionButton}
        />

        <AdminOnly leagueId={leagueId}>
          <Button
            title="Manage Members"
            onPress={() => setActiveTab('members')}
            variant="outline"
            style={styles.actionButton}
          />
        </AdminOnly>
      </View>

      <View style={styles.leagueInfoSection}>
        <Text style={styles.sectionTitle}>League Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Invite Code:</Text>
            <Text style={styles.infoValue}>{league.invite_code}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Members:</Text>
            <Text style={styles.infoValue}>{league.members?.length || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Your Role:</Text>
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
        <Text style={styles.sectionTitle}>League Members</Text>
        {league.members?.map((member) => {
          const memberRoleInfo = getRoleInfo(member.role as any);
          return (
            <View key={member.user_id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.user?.display_name || 'Unknown User'}
                </Text>
                <View style={styles.memberRole}>
                  <Text style={styles.roleIcon}>{memberRoleInfo.icon}</Text>
                  <Text style={[styles.roleText, { color: memberRoleInfo.color }]}>
                    {memberRoleInfo.label}
                  </Text>
                </View>
              </View>
              <View style={styles.memberStats}>
                <Text style={styles.memberPoints}>{member.total_points} pts</Text>
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
        <Text style={styles.sectionTitle}>League Settings</Text>
        
        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupTitle}>Actions</Text>
          
          <PermissionGate leagueId={leagueId} permission="canLeaveLeague">
            <TouchableOpacity style={styles.settingsItem} onPress={handleLeaveLeague}>
              <Text style={styles.settingsItemText}>Leave League</Text>
              <Text style={styles.settingsItemIcon}>🚪</Text>
            </TouchableOpacity>
          </PermissionGate>

          <CreatorOnly leagueId={leagueId}>
            <TouchableOpacity style={styles.settingsItem} onPress={handleDeleteLeague}>
              <Text style={[styles.settingsItemText, styles.dangerText]}>Delete League</Text>
              <Text style={styles.settingsItemIcon}>🗑️</Text>
            </TouchableOpacity>
          </CreatorOnly>
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'standings': return renderStandings();
      case 'members': return renderMembers();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{league.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(tab.key as TabType)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.activeTabLabel,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom + 60, 80) }]}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    color: '#3B82F6',
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 50,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  activeTabLabel: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
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
    borderBottomColor: '#F3F4F6',
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
    borderBottomColor: '#F3F4F6',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsItemText: {
    fontSize: 16,
    color: '#111827',
  },
  dangerText: {
    color: '#DC2626',
  },
  settingsItemIcon: {
    fontSize: 16,
  },
});