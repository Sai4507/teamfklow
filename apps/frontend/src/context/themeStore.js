import { create } from 'zustand'

export const useThemeStore = create((set) => {
  const savedTheme = localStorage.getItem('theme') || 'light'

  return {
    theme: savedTheme,
    
    setTheme: (theme) => {
      localStorage.setItem('theme', theme)
      set({ theme })
    },
    
    toggleTheme: () => {
      set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light'
        localStorage.setItem('theme', newTheme)
        return { theme: newTheme }
      })
    }
  }
})
