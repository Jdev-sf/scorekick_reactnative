import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { ProfileService } from '../services/profileService';
import { TYPOGRAPHY } from '../../../constants/theme';

export const UserInfoCard: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await ProfileService.updateProfile(user.id, {
        display_name: displayName.trim(),
      });
      
      setIsEditing(false);
      Alert.alert('Successo', 'Profilo aggiornato con successo!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Errore', 'Impossibile aggiornare il profilo. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user?.user_metadata?.display_name || '');
    setIsEditing(false);
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

  return (
    <View 
      style={{ marginHorizontal: 24, padding: 24, borderRadius: 16, backgroundColor: colors.surface }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {/* Avatar */}
        <View 
          style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary + '20' }}
        >
          {user?.user_metadata?.avatar_url ? (
            <Text style={{ fontSize: 24 }}>👤</Text>
          ) : (
            <Text 
              style={{ 
                fontWeight: 'bold',
                color: colors.primary,
                fontSize: TYPOGRAPHY.fontSizes.xl
              }}
            >
              {getInitials(displayName || user?.email || 'U')}
            </Text>
          )}
        </View>

        {/* User Info */}
        <View style={{ flex: 1 }}>
          {isEditing ? (
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nome visualizzato"
              style={{ 
                fontWeight: '600',
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                color: colors.textPrimary,
                fontSize: TYPOGRAPHY.fontSizes.lg,
                backgroundColor: colors.background,
                borderColor: colors.border
              }}
              autoFocus
            />
          ) : (
            <Text 
              style={{ 
                fontWeight: '600',
                color: colors.textPrimary,
                fontSize: TYPOGRAPHY.fontSizes.lg
              }}
            >
              {displayName || 'Nessun nome'}
            </Text>
          )}
          
          <Text 
            style={{ fontSize: 14, marginTop: 4, color: colors.textSecondary }}
          >
            {user?.email}
          </Text>
          
          <Text 
            style={{ fontSize: 12, marginTop: 8, color: colors.textSecondary }}
          >
            Membro dal {formatJoinDate(user?.created_at || '')}
          </Text>
        </View>

        {/* Edit Button */}
        <View style={{ gap: 8 }}>
          {isEditing ? (
            <>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isLoading}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.success }}
              >
                <Text 
                  style={{ fontWeight: '500', color: 'white', fontSize: 12 }}
                >
                  {isLoading ? '...' : 'Salva'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleCancel}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface }}
              >
                <Text 
                  style={{ fontWeight: '500', fontSize: 12, color: colors.textSecondary }}
                >
                  Annulla
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleEditToggle}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary + '20' }}
            >
              <Text 
                style={{ fontWeight: '500', fontSize: 12, color: colors.primary }}
              >
                Modifica
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};