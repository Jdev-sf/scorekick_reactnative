import React, { useState } from 'react';
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
import { useJoinLeague } from '../hooks/useLeagues';
import { joinLeagueSchema, type JoinLeagueFormData } from '../validation/schemas';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { LeaguesNavigationProp } from '../../../navigation/types';

export function JoinLeagueScreen() {
  const navigation = useNavigation<LeaguesNavigationProp>();
  const joinLeagueMutation = useJoinLeague();
  const insets = useSafeAreaInsets();
  const [previewLeague, setPreviewLeague] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<JoinLeagueFormData>({
    resolver: zodResolver(joinLeagueSchema),
    mode: 'onChange',
    defaultValues: {
      inviteCode: '',
    },
  });

  const inviteCode = watch('inviteCode');

  const formatInviteCode = (code: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleaned = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    // Limit to 6 characters
    return cleaned.slice(0, 6);
  };

  const onSubmit = async (data: JoinLeagueFormData) => {
    try {
      const member = await joinLeagueMutation.mutateAsync(data);
      
      // Extract league info from the member response
      const leagueName = Array.isArray(member.league) 
        ? (member.league as any)[0]?.name 
        : (member.league as any)?.name || 'League';
      
      Alert.alert(
        'Successfully Joined! 🎉',
        `Welcome to "${leagueName}"!\n\nYou can now start making predictions and compete with other members.`,
        [
          {
            text: 'View League',
            style: 'default',
            onPress: () => {
              reset();
              navigation.replace('LeagueDetails', { leagueId: member.league_id });
            },
          },
          {
            text: 'Go to Leagues',
            onPress: () => {
              reset();
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Join Failed',
        error instanceof Error ? error.message : 'Failed to join league. Please check your invite code and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleGoBack = () => {
    if (inviteCode && inviteCode.length > 0) {
      Alert.alert(
        'Discard Changes?',
        'You have entered an invite code. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Generate preview when code is complete
  React.useEffect(() => {
    if (inviteCode && inviteCode.length === 6) {
      setPreviewLeague(`League ${inviteCode}`);
    } else {
      setPreviewLeague(null);
    }
  }, [inviteCode]);

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
            disabled={joinLeagueMutation.isPending}
          />
          <Text style={styles.headerTitle}>Join League</Text>
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
            <Text style={styles.heroIcon}>🎯</Text>
            <Text style={styles.heroTitle}>Join a League</Text>
            <Text style={styles.heroSubtitle}>
              Enter a 6-character invite code to join an existing prediction league!
            </Text>
          </View>

          {/* How it Works */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>🎮 How to join:</Text>
            <View style={styles.stepsList}>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>Get an invite code from a league creator</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>Enter the 6-character code below</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>Join instantly and start predicting</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>4</Text>
                <Text style={styles.stepText}>Compete with other members on Serie A</Text>
              </View>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Enter Invite Code</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Invite Code *</Text>
              <Controller
                control={control}
                name="inviteCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="ABC123"
                    value={value}
                    onChangeText={(text) => {
                      const formatted = formatInviteCode(text);
                      onChange(formatted);
                    }}
                    onBlur={onBlur}
                    error={errors.inviteCode?.message}
                    maxLength={6}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={isValid ? handleSubmit(onSubmit) : undefined}
                    style={styles.codeInput}
                  />
                )}
              />
              <View style={styles.inputHelp}>
                <Text style={styles.helpText}>
                  Code format: 6 uppercase letters and numbers (e.g., ABC123)
                </Text>
                <Text style={styles.characterCount}>
                  {inviteCode?.length || 0}/6
                </Text>
              </View>
            </View>

            {/* Code Format Examples */}
            <View style={styles.examplesSection}>
              <Text style={styles.examplesTitle}>Valid code examples:</Text>
              <View style={styles.examplesList}>
                <Text style={styles.exampleCode}>FAMILY</Text>
                <Text style={styles.exampleCode}>ABC123</Text>
                <Text style={styles.exampleCode}>WORK99</Text>
                <Text style={styles.exampleCode}>FUN2024</Text>
              </View>
            </View>

            {/* Preview */}
            {previewLeague && inviteCode && inviteCode.length === 6 && (
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>Ready to join:</Text>
                <View style={styles.previewCard}>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewCodeLabel}>Code:</Text>
                    <Text style={styles.previewCode}>{inviteCode}</Text>
                  </View>
                  <Text style={styles.previewInfo}>
                    You'll join as a Member with prediction access
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Button
              title="Join League"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || joinLeagueMutation.isPending}
              loading={joinLeagueMutation.isPending}
              style={styles.joinButton}
            />
            
            <Button
              title="Cancel"
              onPress={handleGoBack}
              variant="outline"
              style={styles.cancelButtonBottom}
              disabled={joinLeagueMutation.isPending}
            />
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>❓ Need help?</Text>
            <View style={styles.helpList}>
              <Text style={styles.helpItem}>• Ask the league creator for their invite code</Text>
              <Text style={styles.helpItem}>• Code must be exactly 6 characters</Text>
              <Text style={styles.helpItem}>• Codes are case-insensitive (we'll convert for you)</Text>
              <Text style={styles.helpItem}>• You can only join each league once</Text>
              <Text style={styles.helpItem}>• Create your own league if you can't find one to join</Text>
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
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#A7F3D0',
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
    backgroundColor: '#10B981',
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
    color: '#065F46',
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
  codeInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    letterSpacing: 2,
    textAlign: 'center',
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
  examplesSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  examplesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleCode: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
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
    alignItems: 'center',
    marginBottom: 8,
  },
  previewCodeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  previewCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  previewInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionSection: {
    marginBottom: 24,
    gap: 12,
  },
  joinButton: {
    marginBottom: 8,
  },
  cancelButtonBottom: {
    marginBottom: 8,
  },
  helpSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  helpList: {
    gap: 6,
  },
  helpItem: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});