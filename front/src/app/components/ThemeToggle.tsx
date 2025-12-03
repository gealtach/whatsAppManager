'use client'

import { useTheme } from '@/context/ThemeContext'
import { FaMoon, FaSun } from 'react-icons/fa6'

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="relative inline-flex h-8 w-16 items-center rounded-full bg-gray-300 dark:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Toggle theme"
        >
            {/* Bolita deslizante */}
            <span
                className={`inline-flex items-center justify-center h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${theme === 'dark' ? 'translate-x-8' : 'translate-x-0.5'
                    }`}
            >
                {theme === 'dark' ? (
                    <FaMoon className="text-indigo-600" size={16} />
                ) : (
                    <FaSun className="text-yellow-500" size={16} />
                )}
            </span>

            {/* Iconos de fondo (opcional, para más claridad) */}
            <span className="absolute left-2 flex items-center pointer-events-none">
                <FaSun className={`text-yellow-400 transition-opacity duration-300 ${theme === 'dark' ? 'opacity-0' : 'opacity-100'}`} size={14} />
            </span>
            <span className="absolute right-2 flex items-center pointer-events-none">
                <FaMoon className={`text-gray-200 transition-opacity duration-300 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} size={14} />
            </span>
        </button>
    )
}