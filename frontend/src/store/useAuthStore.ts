import { create } from 'zustand'
import { UserProfile, loginWithEmail, registerWithEmail, logoutUser, fetchMe } from '../services/api'

interface AuthState {
  isAuthenticated: boolean
  isInitializing: boolean
  user: UserProfile | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, agency_name: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isInitializing: true,
  user: null,

  login: async (email: string, password: string) => {
    const user = await loginWithEmail(email, password)
    set({ isAuthenticated: true, user })
  },

  register: async (email: string, password: string, agency_name: string) => {
    const user = await registerWithEmail(email, password, agency_name)
    set({ isAuthenticated: true, user })
  },

  logout: async () => {
    try {
      await logoutUser()
    } catch (e) {
      console.error('Logout failed on backend:', e)
    }
    set({ isAuthenticated: false, user: null })
  },

  checkAuth: async () => {
    try {
      const user = await fetchMe()
      set({ isAuthenticated: true, user, isInitializing: false })
    } catch {
      set({ isAuthenticated: false, user: null, isInitializing: false })
    }
  },
}))
