import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../lib/storage/asyncStorage';
import { COLORS } from '../constants/theme';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeColors {
  // Primary colors
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Background colors
  background: string;
  surface: string;
  card: string;
  surfaceVariant: string;
  surface1: string;
  surface2: string;
  surface3: string;
  surface4: string;
  surface5: string;
  
  // Text colors
  text: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Shadow color
  shadow: string;
  
  // Status colors
  online: string;
  away: string;
  busy: string;
  offline: string;
  
  // Achievement colors
  achievement: {
    milestone: string;
    accuracy: string;
    streak: string;
    participation: string;
    special: string;
  };
  
  // Gradient colors
  gradients: {
    primary: string[];
    secondary: string[];
    success: string[];
    warning: string[];
    error: string[];
  };
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const lightColors: ThemeColors = {
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  success: COLORS.success,
  warning: COLORS.warning,
  error: COLORS.error,
  info: COLORS.info,
  
  background: COLORS.background,
  surface: COLORS.surface,
  card: '#FFFFFF',
  surfaceVariant: COLORS.gray50,
  surface1: COLORS.gray50,
  surface2: COLORS.gray100,
  surface3: COLORS.gray200,
  surface4: COLORS.gray300,
  surface5: COLORS.gray400,
  
  text: COLORS.textPrimary,
  textPrimary: COLORS.textPrimary,
  textSecondary: COLORS.textSecondary,
  textTertiary: COLORS.gray400,
  textDisabled: COLORS.gray300,
  
  border: COLORS.gray200,
  borderLight: COLORS.gray100,
  shadow: '#000',
  
  online: '#10B981',
  away: '#F59E0B',
  busy: '#EF4444',
  offline: '#6B7280',
  
  achievement: {
    milestone: COLORS.primary,
    accuracy: COLORS.success,
    streak: COLORS.warning,
    participation: COLORS.secondary,
    special: '#9C27B0',
  },
  
  gradients: {
    primary: [COLORS.primary, '#1565C0'],
    secondary: [COLORS.secondary, '#00695C'],
    success: [COLORS.success, '#388E3C'],
    warning: [COLORS.warning, '#F57C00'],
    error: [COLORS.error, '#D32F2F'],
  },
};

const darkColors: ThemeColors = {
  primary: '#BB86FC',        // Material Design 3 primary
  secondary: '#03DAC6',      // Material Design 3 secondary
  success: '#4CAF50',        // Material Design 3 success
  warning: '#FF9800',        // Material Design 3 warning
  error: '#CF6679',          // Material Design 3 error
  info: '#2196F3',           // Material Design 3 info
  
  background: COLORS.backgroundDark,
  surface: COLORS.surfaceDark,
  card: COLORS.surface2Dark, // Elevated surface for better contrast
  surfaceVariant: COLORS.surface1Dark,
  surface1: COLORS.surface1Dark,
  surface2: COLORS.surface2Dark,
  surface3: COLORS.surface3Dark,
  surface4: COLORS.surface4Dark,
  surface5: COLORS.surface5Dark,
  
  text: COLORS.textPrimaryDark,
  textPrimary: COLORS.textPrimaryDark,
  textSecondary: COLORS.textSecondaryDark,
  textTertiary: COLORS.textTertiaryDark,
  textDisabled: 'rgba(255, 255, 255, 0.38)',
  
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  shadow: '#000',
  
  online: '#34D399',
  away: '#FBBF24',
  busy: '#F87171',
  offline: '#9CA3AF',
  
  achievement: {
    milestone: '#BB86FC',
    accuracy: '#4CAF50',
    streak: '#FF9800',
    participation: '#03DAC6',
    special: '#E1BEE7',
  },
  
  gradients: {
    primary: ['#BB86FC', '#9C27B0'],
    secondary: ['#03DAC6', '#00BCD4'],
    success: ['#4CAF50', '#388E3C'],
    warning: ['#FF9800', '#F57C00'],
    error: ['#CF6679', '#D32F2F'],
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  
  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await storage.getString('theme') as Theme;
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    };
    loadTheme();
  }, []);

  // Determine current theme
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Persist asynchronously without blocking state update
    const persistTheme = async () => {
      try {
        await storage.set('theme', newTheme);
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    };
    
    persistTheme();
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme-aware component props
export interface ThemedComponentProps {
  theme?: 'light' | 'dark';
  colors?: Partial<ThemeColors>;
}

// Higher-order component for theme-aware components
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & ThemedComponentProps>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { colors, isDark } = useTheme();
    return (
      <Component
        {...(props as any)}
        ref={ref}
        theme={isDark ? 'dark' : 'light'}
        colors={colors}
      />
    );
  });
};

// Utility functions for theme-aware styling
export const getThemedStyle = (lightStyle: any, darkStyle: any, isDark: boolean) => {
  return isDark ? darkStyle : lightStyle;
};

export const getThemedColor = (lightColor: string, darkColor: string, isDark: boolean) => {
  return isDark ? darkColor : lightColor;
};