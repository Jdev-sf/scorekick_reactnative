import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../lib/storage/asyncStorage';
import type { League } from '../features/leagues/types';

interface SelectedLeagueContextType {
  selectedLeague: League | null;
  setSelectedLeague: (league: League | null) => void;
  isLoading: boolean;
}

const SelectedLeagueContext = createContext<SelectedLeagueContextType | undefined>(undefined);

interface SelectedLeagueProviderProps {
  children: ReactNode;
}

const SELECTED_LEAGUE_KEY = 'selected_league';

export const SelectedLeagueProvider: React.FC<SelectedLeagueProviderProps> = ({ children }) => {
  const [selectedLeague, setSelectedLeagueState] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load selected league from storage on mount
  useEffect(() => {
    const loadSelectedLeague = async () => {
      try {
        const storedLeague = await storage.getString(SELECTED_LEAGUE_KEY);
        if (storedLeague) {
          setSelectedLeagueState(JSON.parse(storedLeague));
        }
      } catch (error) {
        console.error('Failed to load selected league:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSelectedLeague();
  }, []);

  // Update selected league and persist to storage
  const setSelectedLeague = (league: League | null) => {
    setSelectedLeagueState(league);
    
    // Persist asynchronously without blocking state update
    const persistLeague = async () => {
      try {
        if (league) {
          await storage.set(SELECTED_LEAGUE_KEY, JSON.stringify(league));
        } else {
          await storage.delete(SELECTED_LEAGUE_KEY);
        }
      } catch (error) {
        console.error('Failed to save selected league:', error);
      }
    };
    
    persistLeague();
  };

  return (
    <SelectedLeagueContext.Provider 
      value={{ selectedLeague, setSelectedLeague, isLoading }}
    >
      {children}
    </SelectedLeagueContext.Provider>
  );
};

export const useSelectedLeague = () => {
  const context = useContext(SelectedLeagueContext);
  if (context === undefined) {
    throw new Error('useSelectedLeague must be used within a SelectedLeagueProvider');
  }
  return context;
};