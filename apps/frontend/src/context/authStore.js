import { create } from 'zustand'
import axios from 'axios'

const API_URL = '/api'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password })
      const { user, token, refreshToken } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      set({ user, token, refreshToken, isLoading: false })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  register: async (email, username, password, firstName, lastName) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        username,
        password,
        firstName,
        lastName
      })
      const { user, token, refreshToken } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      set({ user, token, refreshToken, isLoading: false })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  logout: async () => {
    try {
      const { refreshToken } = get()
      await axios.post(`${API_URL}/auth/logout`, { refreshToken })
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    delete axios.defaults.headers.common['Authorization']
    
    set({ user: null, token: null, refreshToken: null, error: null })
  },

  initialize: async () => {
    const token = localStorage.getItem('token')
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      try {
        const response = await axios.get(`${API_URL}/auth/me`)
        set({ user: response.data, token, refreshToken })
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        delete axios.defaults.headers.common['Authorization']
        set({ user: null, token: null, refreshToken: null })
      }
    }
  },

  updateProfile: async (updates) => {
    try {
      const response = await axios.put(`${API_URL}/auth/profile`, updates)
      set((state) => ({ user: { ...state.user, ...response.data } }))
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Update failed'
      return { success: false, error: message }
    }
  },

  setUser: (user) => set({ user }),
}))
