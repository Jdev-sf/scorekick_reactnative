import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { storage } from '../../../lib/storage/asyncStorage';
import { TYPOGRAPHY } from '../../../constants/theme';

export const QuickSettingsCard: React.FC = () => {
  const { colors } = useTheme();
  
  // Initialize settings from storage
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const pushValue = await storage.getBoolean('push_notifications');
        const emailValue = await storage.getBoolean('email_notifications');
        const soundValue = await storage.getBoolean('sound_enabled');
        
        setPushNotifications(pushValue ?? true);
        setEmailNotifications(emailValue ?? false);
        setSoundEnabled(soundValue ?? true);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  const handlePushNotificationsToggle = async (value: boolean) => {
    try {
      setPushNotifications(value);
      await storage.set('push_notifications', value);
      
      if (value) {
        // Request notification permissions if enabling
        // This would typically integrate with expo-notifications
        console.log('Requesting notification permissions...');
      }
    } catch (error) {
      console.error('Failed to update push notifications setting:', error);
      Alert.alert('Errore', 'Impossibile aggiornare le impostazioni delle notifiche.');
      setPushNotifications(!value);
    }
  };

  const handleEmailNotificationsToggle = async (value: boolean) => {
    try {
      setEmailNotifications(value);
      await storage.set('email_notifications', value);
    } catch (error) {
      console.error('Failed to update email notifications setting:', error);
      Alert.alert('Errore', 'Impossibile aggiornare le impostazioni email.');
      setEmailNotifications(!value);
    }
  };

  const handleSoundToggle = async (value: boolean) => {
    try {
      setSoundEnabled(value);
      await storage.set('sound_enabled', value);
    } catch (error) {
      console.error('Failed to update sound setting:', error);
      Alert.alert('Errore', 'Impossibile aggiornare le impostazioni audio.');
      setSoundEnabled(!value);
    }
  };

  const settingsItems = [
    {
      id: 'push_notifications',
      icon: '🔔',
      title: 'Notifiche Push',
      description: 'Ricevi notifiche per nuovi match e risultati',
      value: pushNotifications,
      onToggle: handlePushNotificationsToggle,
    },
    {
      id: 'email_notifications', 
      icon: '📧',
      title: 'Notifiche Email',
      description: 'Ricevi riepiloghi settimanali via email',
      value: emailNotifications,
      onToggle: handleEmailNotificationsToggle,
    },
    {
      id: 'sound_enabled',
      icon: '🔊',
      title: 'Suoni App',
      description: 'Riproduci suoni per azioni e notifiche',
      value: soundEnabled,
      onToggle: handleSoundToggle,
    },
  ];

  return (
    <View 
      style={{ marginHorizontal: 24, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface }}
    >
      {/* Header */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text 
          style={{ 
            fontWeight: 'bold',
            color: colors.textPrimary,
            fontSize: TYPOGRAPHY.fontSizes.lg
          }}
        >
          Impostazioni Rapide
        </Text>
        <Text 
          style={{ fontSize: 14, marginTop: 4, color: colors.textSecondary }}
        >
          Modifica velocemente le preferenze principali
        </Text>
      </View>

      {/* Settings List */}
      <View style={{ padding: 16, gap: 16 }}>
        {/* Theme Toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>🌓</Text>
            <View style={{ flex: 1 }}>
              <Text 
                style={{ 
                  fontWeight: '500',
                  color: colors.textPrimary,
                  fontSize: TYPOGRAPHY.fontSizes.base
                }}
              >
                Tema App
              </Text>
              <Text 
                style={{ fontSize: 14, color: colors.textSecondary }}
              >
                Chiaro, scuro o automatico
              </Text>
            </View>
          </View>
          <ThemeToggle variant="switch" size="medium" showLabel={false} />
        </View>

        {/* Dynamic Settings */}
        {settingsItems.map((item) => (
          <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 20, marginRight: 12 }}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text 
                  style={{ 
                    fontWeight: '500',
                    color: colors.textPrimary,
                    fontSize: TYPOGRAPHY.fontSizes.base
                  }}
                >
                  {item.title}
                </Text>
                <Text 
                  style={{ fontSize: 14, color: colors.textSecondary }}
                >
                  {item.description}
                </Text>
              </View>
            </View>
            
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ 
                false: colors.border, 
                true: colors.primary + '80' 
              }}
              thumbColor={item.value ? colors.primary : colors.background}
              ios_backgroundColor={colors.border}
            />
          </View>
        ))}
      </View>

      {/* Additional Info */}
      <View 
        style={{ 
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background + '50'
        }}
      >
        <Text 
          style={{ fontSize: 12, textAlign: 'center', color: colors.textSecondary }}
        >
          Le modifiche vengono salvate automaticamente
        </Text>
      </View>
    </View>
  );
};