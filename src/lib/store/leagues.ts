import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { League, LeagueWithMembers } from '../../types';

interface LeaguesStore {
  leagues: League[];
  currentLeague: LeagueWithMembers | null;
  loading: boolean;
  
  setLeagues: (leagues: League[]) => void;
  setCurrentLeague: (league: LeagueWithMembers | null) => void;
  setLoading: (loading: boolean) => void;
  addLeague: (league: League) => void;
  removeLeague: (leagueId: string) => void;
  updateLeague: (leagueId: string, updates: Partial<League>) => void;
  clearLeagues: () => void;
}

export const useLeaguesStore = create<LeaguesStore>()(
  subscribeWithSelector((set, get) => ({
    leagues: [],
    currentLeague: null,
    loading: false,
    
    setLeagues: (leagues) => set({ leagues }),
    setCurrentLeague: (league) => set({ currentLeague: league }),
    setLoading: (loading) => set({ loading }),
    
    addLeague: (league) => set((state) => ({
      leagues: [...state.leagues, league]
    })),
    
    removeLeague: (leagueId) => set((state) => ({
      leagues: state.leagues.filter(l => l.id !== leagueId),
      currentLeague: state.currentLeague?.id === leagueId ? null : state.currentLeague
    })),
    
    updateLeague: (leagueId, updates) => set((state) => ({
      leagues: state.leagues.map(l => 
        l.id === leagueId ? { ...l, ...updates } : l
      )
    })),
    
    clearLeagues: () => set({ 
      leagues: [], 
      currentLeague: null, 
      loading: false 
    }),
  }))
);