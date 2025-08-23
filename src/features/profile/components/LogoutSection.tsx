import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { storage } from '../../../lib/storage/asyncStorage';
import { TYPOGRAPHY } from '../../../constants/theme';

export const LogoutSection: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Conferma Logout',
      'Sei sicuro di voler uscire dall\'app? Dovrai effettuare nuovamente il login.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Clear all cached data
      await storage.clearAll();
      
      // Sign out from auth
      await signOut();
      
      // Navigate to login (this should be handled by auth context)
      // navigation.reset({
      //   index: 0,
      //   routes: [{ name: 'Login' }],
      // });
      
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert(
        'Errore Logout',
        'Si è verificato un errore durante il logout. Riprova.'
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Svuota Cache',
      'Questa azione rimuoverà tutti i dati salvati localmente (impostazioni, cache, ecc.). Vuoi continuare?',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Svuota',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear only non-essential data, keep auth tokens
              const keysToKeep = ['auth_token', 'refresh_token', 'user_session'];
              const allKeys = await storage.getAllKeys();
              
              for (const key of allKeys) {
                if (!keysToKeep.includes(key)) {
                  await storage.delete(key);
                }
              }
              
              Alert.alert('Successo', 'Cache svuotata con successo.');
            } catch (error) {
              console.error('Failed to clear cache:', error);
              Alert.alert('Errore', 'Impossibile svuotare la cache.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ marginHorizontal: 24, gap: 16 }}>
      {/* Clear Cache Button */}
      <TouchableOpacity
        onPress={handleClearCache}
        style={{ padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}
      >
        <Text style={{ fontSize: 18, marginRight: 8 }}>🗑️</Text>
        <Text 
          style={{ 
            fontWeight: '500',
            color: colors.textPrimary,
            fontSize: TYPOGRAPHY.fontSizes.base
          }}
        >
          Svuota Cache
        </Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        disabled={isLoggingOut}
        style={{ 
          padding: 16,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.error,
          opacity: isLoggingOut ? 0.6 : 1
        }}
      >
        <Text style={{ fontSize: 18, marginRight: 8 }}>🚪</Text>
        <Text 
          style={{ fontWeight: 'bold', color: 'white', fontSize: TYPOGRAPHY.fontSizes.base }}
        >
          {isLoggingOut ? 'Disconnessione...' : 'Logout'}
        </Text>
      </TouchableOpacity>

      {/* Warning Text */}
      <Text 
        style={{ fontSize: 12, textAlign: 'center', paddingHorizontal: 16, color: colors.textSecondary }}
      >
        Il logout cancellerà tutti i dati salvati localmente. Assicurati che le tue previsioni siano sincronizzate.
      </Text>
    </View>
  );
};