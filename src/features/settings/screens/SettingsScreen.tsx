import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StatusBar, Switch } from 'react-native';
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
import { TYPOGRAPHY, SPACING } from '../../../constants/theme';
import { ProfileStackNavigationProp } from '../../../navigation/types';
import { SeasonStatusCard } from '../components/SeasonStatusCard';

interface SettingSection {
  id: string;
  title: string;
  icon: string;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  type: 'toggle' | 'button' | 'info';
  value?: boolean | string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export const SettingsScreen: React.FC = () => {
  const { colors, theme, setTheme, isDark } = useTheme();
  const navigation = useNavigation<ProfileStackNavigationProp>();

  // Local state for settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [matchReminders, setMatchReminders] = useState(true);
  const [leagueUpdates, setLeagueUpdates] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [dataUsage, setDataUsage] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  // Animation values
  const scrollY = useSharedValue(0);
  const headerHeight = 120;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scrollY.value = 0; // Reset scroll value
    };
  }, []);

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

  const handleClearCache = () => {
    Alert.alert(
      'Cancella Cache',
      'Sei sicuro di voler cancellare la cache dell\'app?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Cancella', style: 'destructive', onPress: () => {
          Alert.alert('Cache cancellata', 'La cache è stata cancellata con successo');
        }}
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert('Supporto', 'Email: support@scorekick.app\nTelefono: +39 123 456 7890');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'La Privacy Policy sarà disponibile presto');
  };

  const handleTermsOfService = () => {
    Alert.alert('Termini di Servizio', 'I Termini di Servizio saranno disponibili presto');
  };

  const settingSections: SettingSection[] = [
    {
      id: 'appearance',
      title: 'Aspetto',
      icon: '🎨',
      items: [
        {
          id: 'theme_selector',
          title: 'Seleziona Tema',
          description: 'Scegli l\'aspetto dell\'app',
          type: 'button',
          onPress: () => {
            Alert.alert(
              'Seleziona Tema',
              'Scegli il tema dell\'app',
              [
                {
                  text: '☀️ Chiaro',
                  onPress: () => setTheme('light')
                },
                {
                  text: '🌙 Scuro',
                  onPress: () => setTheme('dark')
                },
                {
                  text: '📱 Sistema',
                  onPress: () => setTheme('system')
                },
                {
                  text: 'Annulla',
                  style: 'cancel'
                }
              ]
            );
          }
        },
        {
          id: 'current_theme',
          title: 'Tema Attuale',
          type: 'info',
          value: `${theme === 'light' ? '☀️ Chiaro' : theme === 'dark' ? '🌙 Scuro' : '📱 Sistema'}`
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifiche',
      icon: '🔔',
      items: [
        {
          id: 'push_notifications',
          title: 'Notifiche Push',
          description: 'Ricevi notifiche push generali',
          type: 'toggle',
          value: pushNotifications,
          onToggle: setPushNotifications
        },
        {
          id: 'match_reminders',
          title: 'Promemoria Partite',
          description: 'Notifiche prima delle partite',
          type: 'toggle',
          value: matchReminders,
          onToggle: setMatchReminders
        },
        {
          id: 'league_updates',
          title: 'Aggiornamenti Lega',
          description: 'Notifiche su classifica e risultati',
          type: 'toggle',
          value: leagueUpdates,
          onToggle: setLeagueUpdates
        },
        {
          id: 'email_notifications',
          title: 'Email',
          description: 'Ricevi email di notifica',
          type: 'toggle',
          value: emailNotifications,
          onToggle: setEmailNotifications
        }
      ]
    },
    {
      id: 'data',
      title: 'Dati e Storage',
      icon: '💾',
      items: [
        {
          id: 'data_usage',
          title: 'Risparmio Dati',
          description: 'Riduci il consumo di dati mobili',
          type: 'toggle',
          value: dataUsage,
          onToggle: setDataUsage
        },
        {
          id: 'auto_sync',
          title: 'Sincronizzazione Auto',
          description: 'Sincronizza automaticamente i dati',
          type: 'toggle',
          value: autoSync,
          onToggle: setAutoSync
        },
        {
          id: 'clear_cache',
          title: 'Cancella Cache',
          description: 'Libera spazio di archiviazione',
          type: 'button',
          onPress: handleClearCache
        }
      ]
    },
    {
      id: 'support',
      title: 'Supporto e Informazioni',
      icon: '❓',
      items: [
        {
          id: 'contact_support',
          title: 'Contatta il Supporto',
          type: 'button',
          onPress: handleContactSupport
        },
        {
          id: 'privacy_policy',
          title: 'Privacy Policy',
          type: 'button',
          onPress: handlePrivacyPolicy
        },
        {
          id: 'terms',
          title: 'Termini di Servizio',
          type: 'button',
          onPress: handleTermsOfService
        },
        {
          id: 'version',
          title: 'Versione',
          type: 'info',
          value: '1.0.0'
        },
        {
          id: 'build',
          title: 'Build',
          type: 'info',
          value: '100'
        }
      ]
    }
  ];

  const SettingItemComponent: React.FC<{ item: SettingItem }> = ({ item }) => {
    const renderControl = () => {
      switch (item.type) {
        case 'toggle':
          return (
            <Switch
              value={item.value as boolean}
              onValueChange={item.onToggle}
              trackColor={{ 
                false: isDark ? colors.border : colors.borderLight, 
                true: colors.primary + (isDark ? '50' : '40')
              }}
              thumbColor={item.value ? colors.primary : (isDark ? colors.surface3 : colors.surface2)}
              ios_backgroundColor={isDark ? colors.border : colors.borderLight}
            />
          );
        case 'button':
          return (
            <View style={{ 
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: colors.primary + (isDark ? '25' : '15'),
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.primary + '40',
            }}>
              <Text style={{ 
                color: colors.primary,
                fontSize: TYPOGRAPHY.fontSizes.xs,
                fontWeight: TYPOGRAPHY.fontWeights.semibold,
              }}>
                ›
              </Text>
            </View>
          );
        case 'info':
          return (
            <Text style={{ 
              color: colors.textSecondary,
              fontSize: TYPOGRAPHY.fontSizes.sm,
              fontWeight: TYPOGRAPHY.fontWeights.medium,
            }}>
              {item.value}
            </Text>
          );
        default:
          return null;
      }
    };

    return (
      <TouchableOpacity
        onPress={item.onPress}
        disabled={!item.onPress}
        activeOpacity={item.onPress ? 0.7 : 1}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text 
            style={{ 
              color: colors.text,
              fontSize: TYPOGRAPHY.fontSizes.base,
              fontWeight: TYPOGRAPHY.fontWeights.medium,
              marginBottom: item.description ? 2 : 0,
            }}
          >
            {item.title}
          </Text>
          {item.description && (
            <Text 
              style={{ 
                color: colors.textSecondary,
                fontSize: TYPOGRAPHY.fontSizes.sm,
                lineHeight: 16,
              }}
            >
              {item.description}
            </Text>
          )}
        </View>
        
        <View style={{ marginLeft: 16 }}>
          {renderControl()}
        </View>
      </TouchableOpacity>
    );
  };

  const SettingSectionCard: React.FC<{ section: SettingSection }> = ({ section }) => (
    <View
      style={{
        backgroundColor: isDark ? colors.card : colors.surface,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: isDark ? 6 : 3,
        borderWidth: isDark ? 1 : 0,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      {/* Section Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: isDark ? colors.primary + '15' : colors.primary + '08',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <View 
          style={{ 
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isDark ? colors.primary + '35' : colors.primary + '20',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.primary + '50',
          }}
        >
          <Text style={{ fontSize: 16 }}>{section.icon}</Text>
        </View>
        
        <Text 
          style={{ 
            color: colors.text,
            fontSize: TYPOGRAPHY.fontSizes.lg,
            fontWeight: TYPOGRAPHY.fontWeights.semibold,
          }}
        >
          {section.title}
        </Text>
      </View>

      {/* Section Items */}
      {section.items.map((item, index) => (
        <View key={item.id}>
          <SettingItemComponent item={item} />
          {index === section.items.length - 1 && (
            <View style={{ height: 8 }} />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* Sticky Header */}
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
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
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
              marginRight: 16,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ 
              fontSize: 20, 
              color: '#FFFFFF', 
              fontWeight: 'normal',
              includeFontPadding: false,
              textAlignVertical: 'center',
              marginTop: -1,
            }}>‹</Text>
          </TouchableOpacity>
          
          <Text
            style={{
              fontSize: TYPOGRAPHY.fontSizes.lg,
              fontWeight: TYPOGRAPHY.fontWeights.semibold,
              color: '#FFFFFF',
              textShadowColor: `${colors.shadow}30`,
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}
          >
            Impostazioni
          </Text>
        </LinearGradient>
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
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
              <View style={{ paddingTop: StatusBar.currentHeight || 44 }}>
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
                      <View style={{
                        width: 24,
                        height: 24,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Text style={{ 
                          fontSize: 20, 
                          color: '#FFFFFF', 
                          fontWeight: 'normal',
                          includeFontPadding: false,
                          textAlignVertical: 'center',
                          marginTop: -1,
                        }}>‹</Text>
                      </View>
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
                      <Text style={{ fontSize: 18, color: '#FFFFFF' }}>⚙️</Text>
                    </View>
                  </View>

                  {/* Header Content */}
                  <View style={{ alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: TYPOGRAPHY.fontSizes['2xl'],
                        fontWeight: TYPOGRAPHY.fontWeights.bold,
                        color: '#FFFFFF',
                        textShadowColor: `${colors.shadow}30`,
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                        marginBottom: 8,
                        textAlign: 'center',
                      }}
                    >
                      Impostazioni
                    </Text>

                    <Text
                      style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: TYPOGRAPHY.fontSizes.base,
                        textAlign: 'center',
                        textShadowColor: `${colors.shadow}20`,
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 1,
                      }}
                    >
                      Gestisci le tue preferenze
                    </Text>
                  </View>
                </Animated.View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Content */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            {/* Season Status Card */}
            <SeasonStatusCard />
            
            {/* Settings Sections */}
            {settingSections.map(section => (
              <SettingSectionCard key={section.id} section={section} />
            ))}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
};