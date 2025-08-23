import React from 'react';
import { View, Text, TouchableOpacity, AccessibilityRole } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccessibility } from '../../hooks/useAccessibility';
import { TYPOGRAPHY, SPACING } from '../../constants/theme';

interface AccessibleCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  badge?: string | number;
  onPress?: () => void;
  disabled?: boolean;
  
  // Content slots
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  semanticDescription?: string;
  
  // Styling
  variant?: 'default' | 'highlighted' | 'subtle';
  padding?: 'none' | 'small' | 'medium' | 'large';
  testID?: string;
}

export const AccessibleCard: React.FC<AccessibleCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  badge,
  onPress,
  disabled = false,
  leftContent,
  rightContent,
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  semanticDescription,
  variant = 'default',
  padding = 'medium',
  testID,
}) => {
  const { colors } = useTheme();
  const { 
    getAccessibleFontSize, 
    getAccessibleSpacing,
    isAccessibilityServiceEnabled,
    shouldReduceMotion 
  } = useAccessibility();
  
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (!shouldReduceMotion()) {
      scale.value = withSpring(0.98, { damping: 15 });
    }
  };

  const handlePressOut = () => {
    if (!shouldReduceMotion()) {
      scale.value = withSpring(1, { damping: 15 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  const variantStyles = {
    default: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
    },
    highlighted: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
      borderWidth: 2,
    },
    subtle: {
      backgroundColor: colors.background,
      borderColor: colors.borderLight,
      borderWidth: 1,
    },
  };

  const paddingStyles = {
    none: { padding: 0 },
    small: { padding: getAccessibleSpacing(8) },
    medium: { padding: getAccessibleSpacing(16) },
    large: { padding: getAccessibleSpacing(24) },
  };

  const getAccessibilityLabel = () => {
    if (accessibilityLabel) return accessibilityLabel;
    
    let label = title;
    if (subtitle) label += `, ${subtitle}`;
    if (badge) label += `, ${badge}`;
    if (semanticDescription) label += `. ${semanticDescription}`;
    
    return label;
  };

  const getAccessibilityHint = () => {
    if (accessibilityHint) return accessibilityHint;
    if (onPress && !disabled) return 'Tap to view details';
    return undefined;
  };

  const CardContent = () => (
    <>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {/* Left content or icon */}
          {leftContent || (icon && (
            <View 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginRight: 12,
                backgroundColor: colors.primary + '20' 
              }}
            >
              <Text 
                style={{ fontSize: getAccessibleFontSize(18) }}
                accessible={false}
              >
                {icon}
              </Text>
            </View>
          ))}
          
          {/* Title and subtitle */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: getAccessibleFontSize(TYPOGRAPHY.fontSizes.base),
                fontWeight: '600',
                lineHeight: getAccessibleFontSize(TYPOGRAPHY.fontSizes.base) * 1.3,
              }}
              numberOfLines={2}
              accessible={false}
            >
              {title}
            </Text>
            
            {subtitle && (
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: getAccessibleFontSize(TYPOGRAPHY.fontSizes.sm),
                  lineHeight: getAccessibleFontSize(TYPOGRAPHY.fontSizes.sm) * 1.3,
                  marginTop: 2,
                }}
                numberOfLines={1}
                accessible={false}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        
        {/* Right content or badge */}
        {rightContent || (badge && (
          <View 
            style={{ 
              paddingHorizontal: 8, 
              paddingVertical: 4, 
              borderRadius: 20, 
              marginLeft: 8,
              backgroundColor: colors.primary + '20' 
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: getAccessibleFontSize(TYPOGRAPHY.fontSizes.xs),
                fontWeight: '600',
              }}
              accessible={false}
            >
              {badge}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Description */}
      {description && (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: getAccessibleFontSize(TYPOGRAPHY.fontSizes.sm),
            lineHeight: getAccessibleFontSize(TYPOGRAPHY.fontSizes.sm) * 1.4,
            marginBottom: children ? getAccessibleSpacing(12) : 0,
          }}
          accessible={false}
        >
          {description}
        </Text>
      )}
      
      {/* Custom children */}
      {children}
    </>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessible={true}
        accessibilityRole={accessibilityRole || 'button'}
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint={getAccessibilityHint()}
        accessibilityState={{ disabled }}
        testID={testID}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            animatedStyle,
            variantStyles[variant],
            paddingStyles[padding],
            {
              borderRadius: 12,
              minHeight: isAccessibilityServiceEnabled() ? 64 : 'auto',
            }
          ]}
        >
          <CardContent />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        animatedStyle,
        variantStyles[variant],
        paddingStyles[padding],
        {
          borderRadius: 12,
        }
      ]}
      accessible={true}
      accessibilityRole={accessibilityRole || 'text'}
      accessibilityLabel={getAccessibilityLabel()}
      testID={testID}
    >
      <CardContent />
    </Animated.View>
  );
};