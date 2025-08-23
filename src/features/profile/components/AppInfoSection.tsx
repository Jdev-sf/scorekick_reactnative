import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { TYPOGRAPHY } from '../../../constants/theme';

export const AppInfoSection: React.FC = () => {
  const { colors } = useTheme();

  const handleLinkPress = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Errore', `Impossibile aprire ${title}`);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
      Alert.alert('Errore', `Impossibile aprire ${title}`);
    }
  };

  const infoItems = [
    {
      id: 'support',
      icon: '🆘',
      title: 'Supporto e Feedback',
      description: 'Contattaci per aiuto o suggerimenti',
      onPress: () => handleLinkPress('mailto:support@scorekick.app?subject=Supporto ScoreKick', 'Supporto'),
    },
    {
      id: 'privacy',
      icon: '🔒',
      title: 'Privacy Policy',
      description: 'Leggi come proteggiamo i tuoi dati',
      onPress: () => handleLinkPress('https://scorekick.app/privacy', 'Privacy Policy'),
    },
    {
      id: 'terms',
      icon: '📋',
      title: 'Termini di Servizio',
      description: 'Condizioni di utilizzo dell\'app',
      onPress: () => handleLinkPress('https://scorekick.app/terms', 'Termini di Servizio'),
    },
  ];

  // Get app version from package.json or environment
  const appVersion = '1.0.0'; // This would typically come from app configuration

  return (
    <View 
      className="mx-6 rounded-2xl overflow-hidden"
      style={{ backgroundColor: colors.surface }}
    >
      {/* Header */}
      <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
        <Text 
          className="font-bold"
          style={{ 
            color: colors.textPrimary,
            fontSize: TYPOGRAPHY.fontSizes.lg
          }}
        >
          Informazioni App
        </Text>
        <Text 
          className="text-sm mt-1"
          style={{ color: colors.textSecondary }}
        >
          Supporto, privacy e condizioni di utilizzo
        </Text>
      </View>

      {/* Info Items */}
      <View className="p-4 space-y-1">
        {infoItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={item.onPress}
            className="flex-row items-center p-3 rounded-xl"
            style={{ backgroundColor: colors.background + '50' }}
          >
            <Text className="text-xl mr-3">{item.icon}</Text>
            
            <View className="flex-1">
              <Text 
                className="font-medium"
                style={{ 
                  color: colors.textPrimary,
                  fontSize: TYPOGRAPHY.fontSizes.base
                }}
              >
                {item.title}
              </Text>
              <Text 
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                {item.description}
              </Text>
            </View>
            
            <Text 
              className="text-lg"
              style={{ color: colors.textSecondary }}
            >
              ›
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* App Version */}
      <View 
        className="p-4 border-t"
        style={{ 
          borderTopColor: colors.border,
          backgroundColor: colors.background + '30'
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            Versione App
          </Text>
          <Text 
            className="font-medium"
            style={{ color: colors.textPrimary }}
          >
            {appVersion}
          </Text>
        </View>
        
        <Text 
          className="text-xs mt-2 text-center"
          style={{ color: colors.textSecondary }}
        >
          © 2024 ScoreKick. Tutti i diritti riservati.
        </Text>
      </View>
    </View>
  );
};