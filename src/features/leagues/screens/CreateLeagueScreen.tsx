import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateLeague } from '../hooks/useLeagues';
import { createLeagueSchema, type CreateLeagueFormData } from '../validation/schemas';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { LeaguesNavigationProp } from '../../../navigation/types';

export function CreateLeagueScreen() {
  const navigation = useNavigation<LeaguesNavigationProp>();
  const createLeagueMutation = useCreateLeague();
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<CreateLeagueFormData>({
    resolver: zodResolver(createLeagueSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
    },
  });

  const leagueName = watch('name');

  const onSubmit = async (data: CreateLeagueFormData) => {
    try {
      const newLeague = await createLeagueMutation.mutateAsync(data);
      
      Alert.alert(
        'League Created! 🎉',
        `Your league "${newLeague.name}" has been created successfully!\n\nInvite Code: ${newLeague.invite_code}\n\nShare this code with friends to invite them to join your league.`,
        [
          {
            text: 'Copy Code',
            onPress: () => {
              // TODO: Implement clipboard copy
              Alert.alert('Code Copied', `Invite code ${newLeague.invite_code} copied to clipboard!`);
            },
          },
          {
            text: 'View League',
            style: 'default',
            onPress: () => {
              reset();
              navigation.replace('LeagueDetails', { leagueId: newLeague.id });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Creation Failed',
        error instanceof Error ? error.message : 'Failed to create league. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleGoBack = () => {
    if (leagueName && leagueName.length > 0) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Button
            title="Cancel"
            onPress={handleGoBack}
            variant="outline"
            style={styles.cancelButton}
            disabled={createLeagueMutation.isPending}
          />
          <Text style={styles.headerTitle}>Create League</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 20, 40) }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroIcon}>🏆</Text>
            <Text style={styles.heroTitle}>Create Your League</Text>
            <Text style={styles.heroSubtitle}>
              Start your own prediction league and compete with friends on Serie A matches!
            </Text>
          </View>

          {/* How it Works */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>🎯 How it works:</Text>
            <View style={styles.stepsList}>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>Create your league with a unique name</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>Get a 6-character invite code to share</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>Invite friends and family to join</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>4</Text>
                <Text style={styles.stepText}>Compete to predict Serie A match results</Text>
              </View>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>League Details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>League Name *</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="e.g., Family League, Office Predictions..."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                    maxLength={100}
                    autoCapitalize="words"
                    autoCorrect={true}
                    returnKeyType="done"
                    onSubmitEditing={isValid ? handleSubmit(onSubmit) : undefined}
                  />
                )}
              />
              <View style={styles.inputHelp}>
                <Text style={styles.helpText}>
                  Choose a memorable name that represents your group
                </Text>
                <Text style={styles.characterCount}>
                  {leagueName?.length || 0}/100
                </Text>
              </View>
            </View>

            {/* Preview */}
            {leagueName && leagueName.length >= 3 && (
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>Preview:</Text>
                <View style={styles.previewCard}>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewLeagueName}>{leagueName}</Text>
                    <View style={styles.previewRole}>
                      <Text style={styles.roleIcon}>👑</Text>
                      <Text style={styles.roleText}>Creator</Text>
                    </View>
                  </View>
                  <Text style={styles.previewInfo}>
                    1 member • Code: ••••••
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Button
              title="Create League"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || createLeagueMutation.isPending}
              loading={createLeagueMutation.isPending}
              style={styles.createButton}
            />
            
            <Button
              title="Cancel"
              onPress={handleGoBack}
              variant="outline"
              style={styles.cancelButtonBottom}
              disabled={createLeagueMutation.isPending}
            />
          </View>

          {/* Pro Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Pro Tips:</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tip}>• Keep league names family-friendly</Text>
              <Text style={styles.tip}>• You can edit the name later in settings</Text>
              <Text style={styles.tip}>• Invite codes are permanent and unique</Text>
              <Text style={styles.tip}>• As creator, you'll have full admin rights</Text>
              <Text style={styles.tip}>• You can promote members to admin later</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    paddingHorizontal: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  stepsList: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRadius: 12,
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#1E40AF',
    lineHeight: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  inputHelp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  characterCount: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  previewSection: {
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  previewLeagueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  previewRole: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleIcon: {
    marginRight: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D97706',
  },
  previewInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionSection: {
    marginBottom: 24,
    gap: 12,
  },
  createButton: {
    marginBottom: 8,
  },
  cancelButtonBottom: {
    marginBottom: 8,
  },
  tipsSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  tipsList: {
    gap: 6,
  },
  tip: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});