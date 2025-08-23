import React from 'react';
import { TouchableOpacity, Text, View, AccessibilityRole, AccessibilityState } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence 
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING } from '../../constants/theme';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  testID?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  testID,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Handle press animation
  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  // Loading animation
  React.useEffect(() => {
    if (loading) {
      opacity.value = withSequence(
        withSpring(0.6, { damping: 15 }),
        withSpring(1, { damping: 15 })
      );
    }
  }, [loading]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  // Style configurations
  const sizeConfig = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: TYPOGRAPHY.fontSizes.sm,
      minHeight: 32,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontSize: TYPOGRAPHY.fontSizes.base,
      minHeight: 44, // Minimum touch target size for accessibility
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      fontSize: TYPOGRAPHY.fontSizes.lg,
      minHeight: 56,
    },
  };

  const variantConfig = {
    primary: {
      backgroundColor: colors.primary,
      textColor: '#FFFFFF',
      borderColor: colors.primary,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: colors.secondary,
      textColor: '#FFFFFF',
      borderColor: colors.secondary,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 2,
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: colors.primary,
      borderColor: 'transparent',
      borderWidth: 0,
    },
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  const getAccessibilityLabel = () => {
    if (accessibilityLabel) return accessibilityLabel;
    if (loading) return `${title}, loading`;
    if (disabled) return `${title}, disabled`;
    return title;
  };

  const getAccessibilityHint = () => {
    if (accessibilityHint) return accessibilityHint;
    if (disabled) return 'This button is currently disabled';
    if (loading) return 'Please wait while the action completes';
    return `Activates ${title}`;
  };

  const getAccessibilityState = (): AccessibilityState => {
    return {
      disabled,
      busy: loading,
      ...accessibilityState,
    };
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={getAccessibilityHint()}
      accessibilityState={getAccessibilityState()}
      testID={testID}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            backgroundColor: currentVariant.backgroundColor,
            borderColor: currentVariant.borderColor,
            borderWidth: currentVariant.borderWidth,
            borderRadius: 12,
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
            minHeight: currentSize.minHeight,
            width: fullWidth ? '100%' : 'auto',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }
        ]}
      >
        {/* Loading indicator */}
        {loading && (
          <View style={{ marginRight: 8 }}>
            <Text 
              style={{ 
                color: currentVariant.textColor,
                fontSize: currentSize.fontSize 
              }}
            >
              ⏳
            </Text>
          </View>
        )}

        {/* Left icon */}
        {icon && iconPosition === 'left' && !loading && (
          <Text 
            style={{ 
              color: currentVariant.textColor,
              fontSize: currentSize.fontSize,
              marginRight: 8
            }}
          >
            {icon}
          </Text>
        )}

        {/* Button text */}
        <Text
          style={{
            color: currentVariant.textColor,
            fontSize: currentSize.fontSize,
            fontWeight: '600',
            textAlign: 'center',
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {title}
        </Text>

        {/* Right icon */}
        {icon && iconPosition === 'right' && !loading && (
          <Text 
            style={{ 
              color: currentVariant.textColor,
              fontSize: currentSize.fontSize,
              marginLeft: 8 
            }}
          >
            {icon}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};