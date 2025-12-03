'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  readonly children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Usar useCallback para memoizar toggleTheme
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme]) // Dependencia de theme

  // Cargar el tema: primero localStorage, luego preferencias del sistema
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme | null

    // Si hay tema guardado, usarlo
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else {
      // Si no hay tema guardado, usar preferencias del sistema
      // Usar globalThis en lugar de window para mayor compatibilidad
      const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches
      const systemTheme = prefersDark ? 'dark' : 'light'
      setTheme(systemTheme)

      if (systemTheme === 'dark') {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  // Memorizar el valor del contexto
  const contextValue = useMemo(() => ({
    theme,
    toggleTheme
  }), [theme, toggleTheme])

  // Evitar flash de contenido sin estilo
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
  }
  return context
}