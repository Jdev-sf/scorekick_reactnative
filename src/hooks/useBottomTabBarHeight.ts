import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hook per ottenere l'altezza dinamica della bottom tab bar
 * Calcolo ESATTO basato su MainNavigator.tsx configuration
 */
export function useBottomTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  
  return useMemo(() => {
    // Replica ESATTA della configurazione in MainNavigator.tsx
    // height: Math.max(60 + insets.bottom, 60)
    return Math.max(60 + insets.bottom, 60);
  }, [insets.bottom]);
}

/**
 * Hook OTTIMIZZATO per padding bottom nei contenuti scrollabili
 * Calcola il padding MINIMO necessario per visibilità completa
 */
export function useOptimalBottomPadding(desiredMargin: number = 16): number {
  const insets = useSafeAreaInsets();
  
  return useMemo(() => {
    // STRATEGIA OTTIMIZZATA:
    // Solo l'altezza effettiva del tab bar + margin desiderato
    // Evita doppio conteggio del safe area
    
    const baseTabBarHeight = 60; // Altezza base senza safe area
    const effectiveHeight = Math.max(baseTabBarHeight + insets.bottom, 60);
    
    // Debug info (rimuovere in produzione)
    if (__DEV__) {
      console.log('🔧 Optimal Bottom Padding Debug:', {
        'Safe Area Bottom': insets.bottom,
        'Base Tab Height': baseTabBarHeight,
        'Effective Tab Height': effectiveHeight,
        'Desired Margin': desiredMargin,
        'Total Padding': effectiveHeight + desiredMargin,
        'Platform': Platform.OS
      });
    }
    
    return effectiveHeight + desiredMargin;
  }, [insets.bottom, desiredMargin]);
}

/**
 * Hook per calcoli super-precisi con target specifici per piattaforma
 * Usa valori empiricamente testati per risultati perfetti
 */
export function usePreciseBottomPadding(): number {
  const insets = useSafeAreaInsets();
  
  return useMemo(() => {
    // VALORI TARGET OTTIMALI:
    // iPhone SE (no safe area): 60 + 0 + 16 = 76px
    // iPhone X+ (with safe area): 60 + 34 + 16 = 110px  
    // Android standard: 60 + 0 + 16 = 76px
    
    const margin = 16;
    const baseHeight = 60;
    
    const result = baseHeight + insets.bottom + margin;
    
    if (__DEV__) {
      console.log('📐 Precise Bottom Padding:', {
        calculation: `${baseHeight} + ${insets.bottom} + ${margin} = ${result}px`,
        device_type: insets.bottom > 0 ? 'With Safe Area' : 'Standard',
        platform: Platform.OS
      });
    }
    
    return result;
  }, [insets.bottom]);
}

/**
 * DEPRECATED: Manteniamo per backward compatibility
 * Usa useOptimalBottomPadding() o usePreciseBottomPadding() invece
 */
export function useScrollContentPadding(extraMargin: number = 16): number {
  return useOptimalBottomPadding(extraMargin);
}