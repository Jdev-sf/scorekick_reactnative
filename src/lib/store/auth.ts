import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { User } from '../../types';
import { AuthState } from '../../types';

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setSession: (session: any) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set) => ({
    user: null,
    session: null,
    loading: true,
    
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ loading }),
    clearAuth: () => set({ user: null, session: null, loading: false }),
  }))
);