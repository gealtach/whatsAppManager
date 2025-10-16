// auth-context.tsx
'use client'

import { fetchClient } from '@/app/lib/fetchClient';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';

type UserType = {
    role: number;
}

type AuthContextType = {
    user: UserType | null;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Verificar autenticación al cargar la app
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Error checking auth:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // ✅ USAR useCallback PARA MEMOIZAR LAS FUNCIONES
    const login = useCallback(async (email: string, password: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            const ans = await response.json();

            if (response.status === 200) {
                setUser(ans.user);

                // ✅ INICIALIZAR CSRF DESPUÉS DEL LOGIN EXITOSO
                await fetchClient.initializeCSRF();

                return { success: true };
            } else {
                return { success: false, message: ans.message || 'Erro de credenciais' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            router.push('/');
        }
    }, [router]);

    // ✅ useMemo CON TODAS LAS DEPENDENCIAS
    const contextValue = useMemo(() => ({
        user,
        login,
        logout,
        loading
    }), [user, login, logout, loading]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return context;
};