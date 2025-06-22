import React, { createContext, useContext, useEffect } from 'react';
import { useSeasons } from '../hooks/useSeasons';
import type { Season } from '../types';

interface SeasonContextType {
  // Current state
  currentSeason: Season | null;
  selectedSeason: Season | null;
  availableSeasons: Season[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  selectSeason: (season: Season | null) => void;
  refreshSeasons: () => Promise<void>;
  resetToCurrentSeason: () => void;
  
  // Utilities
  isCurrentSeasonSelected: boolean;
  getSeasonDisplay: (season: Season) => string;
}

const SeasonContext = createContext<SeasonContextType | null>(null);

interface SeasonProviderProps {
  children: React.ReactNode;
  autoSelectCurrent?: boolean; // Auto-select current season on mount
}

export function SeasonProvider({ 
  children, 
  autoSelectCurrent = true 
}: SeasonProviderProps) {
  const seasonsHook = useSeasons();
  
  // Auto-select current season when it loads (if no season is selected)
  useEffect(() => {
    if (
      autoSelectCurrent && 
      seasonsHook.currentSeason && 
      !seasonsHook.selectedSeason
    ) {
      seasonsHook.selectSeason(seasonsHook.currentSeason);
    }
  }, [
    seasonsHook.currentSeason, 
    seasonsHook.selectedSeason, 
    autoSelectCurrent,
    seasonsHook.selectSeason
  ]);

  return (
    <SeasonContext.Provider value={seasonsHook}>
      {children}
    </SeasonContext.Provider>
  );
}

/**
 * Hook to access season context
 * Must be used within a SeasonProvider
 */
export function useSeasonContext(): SeasonContextType {
  const context = useContext(SeasonContext);
  
  if (!context) {
    throw new Error('useSeasonContext must be used within a SeasonProvider');
  }
  
  return context;
}

/**
 * Hook to get the currently selected season ID
 * Returns null if no season is selected
 */
export function useSelectedSeasonId(): string | null {
  const { selectedSeason } = useSeasonContext();
  return selectedSeason?.id || null;
}

/**
 * Hook to check if the current season is selected
 */
export function useIsCurrentSeasonSelected(): boolean {
  const { isCurrentSeasonSelected } = useSeasonContext();
  return isCurrentSeasonSelected;
}

/**
 * Hook to get season-aware query options
 * Automatically includes the selected season in query keys
 */
export function useSeasonQueryOptions<T extends any[]>(
  baseQueryKey: T
): T & [string | null] {
  const selectedSeasonId = useSelectedSeasonId();
  return [...baseQueryKey, selectedSeasonId] as T & [string | null];
}

/**
 * HOC to wrap a component with SeasonProvider
 */
export function withSeasonProvider<P extends object>(
  Component: React.ComponentType<P>,
  providerProps?: Omit<SeasonProviderProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <SeasonProvider {...providerProps}>
        <Component {...props} />
      </SeasonProvider>
    );
  };
}