import { useState, useEffect, useCallback } from 'react';
import { SeasonService } from '../services/seasonService';
import type { Season, SeasonContext } from '../types';

interface UseSeasonsReturn {
  // State
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

/**
 * Hook for managing season state and selection
 * Handles loading seasons, current season detection, and season switching
 */
export function useSeasons(): UseSeasonsReturn {
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all seasons and set current season
   */
  const loadSeasons = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [seasons, activeSeason] = await Promise.all([
        SeasonService.getAllSeasons(),
        SeasonService.getCurrentSeason(),
      ]);

      setAvailableSeasons(seasons);
      setCurrentSeason(activeSeason);
      
      // If no season is selected, default to current season
      if (!selectedSeason && activeSeason) {
        setSelectedSeason(activeSeason);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load seasons';
      setError(errorMessage);
      console.error('Error loading seasons:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSeason]);

  /**
   * Select a specific season
   */
  const selectSeason = useCallback((season: Season | null) => {
    setSelectedSeason(season);
  }, []);

  /**
   * Refresh seasons data
   */
  const refreshSeasons = useCallback(async () => {
    await loadSeasons();
  }, [loadSeasons]);

  /**
   * Reset selection to current season
   */
  const resetToCurrentSeason = useCallback(() => {
    setSelectedSeason(currentSeason);
  }, [currentSeason]);

  /**
   * Get display string for a season
   */
  const getSeasonDisplay = useCallback((season: Season) => {
    return SeasonService.formatSeasonDisplay(season);
  }, []);

  // Computed values
  const isCurrentSeasonSelected = selectedSeason?.id === currentSeason?.id;

  // Load seasons on mount
  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);

  return {
    // State
    currentSeason,
    selectedSeason,
    availableSeasons,
    isLoading,
    error,
    
    // Actions
    selectSeason,
    refreshSeasons,
    resetToCurrentSeason,
    
    // Utilities
    isCurrentSeasonSelected,
    getSeasonDisplay,
  };
}

/**
 * Hook for getting season context in a standardized format
 */
export function useSeasonContext(): SeasonContext {
  const { currentSeason, selectedSeason, availableSeasons, isLoading } = useSeasons();

  return {
    currentSeason,
    selectedSeason,
    availableSeasons,
    isLoadingSeasons: isLoading,
  };
}

/**
 * Hook for working with a specific season's data
 */
export function useSeasonData(seasonId?: string) {
  const [season, setSeason] = useState<Season | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSeason = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const seasonData = await SeasonService.getSeasonById(id);
      setSeason(seasonData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load season';
      setError(errorMessage);
      setSeason(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (seasonId) {
      loadSeason(seasonId);
    } else {
      setSeason(null);
    }
  }, [seasonId, loadSeason]);

  return {
    season,
    isLoading,
    error,
    reload: seasonId ? () => loadSeason(seasonId) : undefined,
  };
}