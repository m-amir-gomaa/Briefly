import { create } from 'zustand';

interface AuthState {
  token: string | null;
  agencyName: string | null;
  setAuth: (token: string, agencyName: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null, // Start with no token. In a real app, check localStorage.
  agencyName: null,
  setAuth: (token, agencyName) => set({ token, agencyName }),
  logout: () => set({ token: null, agencyName: null }),
}));
