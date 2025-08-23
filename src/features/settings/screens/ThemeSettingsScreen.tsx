import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate
} from 'react-native-reanimated';
import { useTheme, Theme } from '../../../contexts/ThemeContext';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { TYPOGRAPHY, SPACING } from '../../../constants/theme';

interface ThemeOption {
  key: Theme;
  title: string;
  description: string;
  icon: string;
}

export const ThemeSettingsScreen: React.FC = () => {
  const { theme, setTheme, colors, isDark } = useTheme();

  const themeOptions: ThemeOption[] = [
    {
      key: 'light',
      title: 'Light',
      description: 'Clean and bright interface',
      icon: '☀️'
    },
    {
      key: 'dark',
      title: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: '🌙'
    },
    {
      key: 'system',
      title: 'System',
      description: 'Follow your device settings',
      icon: '⚙️'
    }
  ];

  const previewAnimations = {
    light: useSharedValue(theme === 'light' ? 1 : 0),
    dark: useSharedValue(theme === 'dark' ? 1 : 0),
    system: useSharedValue(theme === 'system' ? 1 : 0),
  };

  React.useEffect(() => {
    themeOptions.forEach(option => {
      previewAnimations[option.key].value = withSpring(
        theme === option.key ? 1 : 0,
        { damping: 15 }
      );
    });
  }, [theme]);

  const ThemeOptionCard: React.FC<{ option: ThemeOption }> = ({ option }) => {
    const isSelected = theme === option.key;
    const scaleValue = previewAnimations[option.key];
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: interpolate(scaleValue.value, [0, 1], [0.98, 1]) }],
      borderColor: interpolate(
        scaleValue.value,
        [0, 1],
        [colors.border, colors.primary],
        'RGB'
      ),
    }));

    const getPreviewColors = (optionKey: Theme) => {
      switch (optionKey) {
        case 'light':
          return {
            background: '#FFFFFF',
            surface: '#F8FAFC',
            text: '#1F2937',
            accent: '#1976D2'
          };
        case 'dark':
          return {
            background: '#0F172A',
            surface: '#1E293B',
            text: '#F8FAFC',
            accent: '#64B5F6'
          };
        case 'system':
          return isDark ? {
            background: '#0F172A',
            surface: '#1E293B',
            text: '#F8FAFC',
            accent: '#64B5F6'
          } : {
            background: '#FFFFFF',
            surface: '#F8FAFC',
            text: '#1F2937',
            accent: '#1976D2'
          };
      }
    };

    const previewColors = getPreviewColors(option.key);

    return (
      <TouchableOpacity
        onPress={() => setTheme(option.key)}
        style={{ marginBottom: 16 }}
      >
        <Animated.View
          style={[
            animatedStyle,
            {
              backgroundColor: colors.surface,
              borderWidth: 2,
              borderRadius: 16,
              padding: 16,
            }
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View 
              style={{ 
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
                backgroundColor: isSelected ? colors.primary + '20' : colors.border + '40'
              }}
            >
              <Text style={{ fontSize: 24 }}>{option.icon}</Text>
            </View>
            
            <View style={{ flex: 1 }}>
              <Text 
                style={{ 
                  fontWeight: '600',
                  marginBottom: 4,
                  color: colors.textPrimary,
                  fontSize: TYPOGRAPHY.fontSizes.lg
                }}
              >
                {option.title}
              </Text>
              <Text 
                style={{ fontSize: 14, color: colors.textSecondary }}
              >
                {option.description}
              </Text>
            </View>
            
            {isSelected && (
              <View 
                style={{ 
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
              </View>
            )}
          </View>

          {/* Theme Preview */}
          <View 
            style={{ 
              height: 96,
              borderRadius: 8,
              padding: 12,
              backgroundColor: previewColors.background
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View 
                style={{ 
                  height: 12,
                  borderRadius: 6,
                  flex: 1,
                  marginRight: 8,
                  backgroundColor: previewColors.surface
                }}
              />
              <View 
                style={{ 
                  width: 32,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: previewColors.accent
                }}
              />
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <View 
                style={{ 
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: previewColors.accent
                }}
              />
              <View 
                style={{ 
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  marginTop: 4,
                  backgroundColor: previewColors.surface
                }}
              />
            </View>
            
            <View 
              style={{ 
                height: 24,
                borderRadius: 4,
                backgroundColor: previewColors.surface
              }}
            />
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView 
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Header */}
      <View 
        style={{ 
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderBottomWidth: 1,
          backgroundColor: colors.surface,
          borderBottomColor: colors.border
        }}
      >
        <Text 
          style={{ 
            fontWeight: 'bold',
            marginBottom: 8,
            color: colors.textPrimary,
            fontSize: TYPOGRAPHY.fontSizes['2xl']
          }}
        >
          Theme Settings
        </Text>
        <Text 
          style={{ fontSize: 14, color: colors.textSecondary }}
        >
          Customize your app's appearance
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 24 }}>
        {/* Quick Toggle */}
        <View 
          style={{ 
            padding: 16,
            borderRadius: 16,
            marginBottom: 24,
            backgroundColor: colors.surface
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text 
                style={{ 
                  fontWeight: '600',
                  marginBottom: 4,
                  color: colors.textPrimary,
                  fontSize: TYPOGRAPHY.fontSizes.base
                }}
              >
                Quick Toggle
              </Text>
              <Text 
                style={{ fontSize: 14, color: colors.textSecondary }}
              >
                Current: {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Text>
            </View>
            <ThemeToggle variant="switch" size="medium" showLabel={false} />
          </View>
        </View>

        {/* Theme Options */}
        <View style={{ marginBottom: 24 }}>
          <Text 
            style={{ 
              fontWeight: '600',
              marginBottom: 16,
              paddingHorizontal: 8,
              color: colors.textPrimary,
              fontSize: TYPOGRAPHY.fontSizes.lg
            }}
          >
            Choose Theme
          </Text>
          
          {themeOptions.map(option => (
            <ThemeOptionCard key={option.key} option={option} />
          ))}
        </View>

        {/* Additional Settings */}
        <View 
          style={{ 
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.surface
          }}
        >
          <Text 
            style={{ 
              fontWeight: '600',
              marginBottom: 12,
              color: colors.textPrimary,
              fontSize: TYPOGRAPHY.fontSizes.base
            }}
          >
            Advanced
          </Text>
          
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
              <View style={{ flex: 1 }}>
                <Text 
                  style={{ fontWeight: '500', color: colors.textPrimary }}
                >
                  High Contrast
                </Text>
                <Text 
                  style={{ fontSize: 14, color: colors.textSecondary }}
                >
                  Increase color contrast for better visibility
                </Text>
              </View>
              <ThemeToggle variant="switch" size="small" showLabel={false} />
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
              <View style={{ flex: 1 }}>
                <Text 
                  style={{ fontWeight: '500', color: colors.textPrimary }}
                >
                  Reduce Motion
                </Text>
                <Text 
                  style={{ fontSize: 14, color: colors.textSecondary }}
                >
                  Minimize animations and transitions
                </Text>
              </View>
              <ThemeToggle variant="switch" size="small" showLabel={false} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};