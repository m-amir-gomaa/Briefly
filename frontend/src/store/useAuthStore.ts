import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  user: {
    id: string
    email: string
    agencyName: string
  } | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

/**
 * Auth store — stub for hackathon.
 * In production, this would handle JWT tokens, refresh flows, etc.
 */
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: true, // Auto-authenticated for hackathon demo
  user: {
    id: 'demo-user-id',
    email: 'demo@briefly.ai',
    agencyName: 'Demo Agency',
  },

  login: async (_email: string, _password: string) => {
    // Stub: always succeeds
    set({
      isAuthenticated: true,
      user: {
        id: 'demo-user-id',
        email: 'demo@briefly.ai',
        agencyName: 'Demo Agency',
      },
    })
  },

  logout: () => {
    set({ isAuthenticated: false, user: null })
  },
}))
