// components/ProtectedPage.tsx
'use client';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from './Loading';

interface ProtectedPageProps {
    children: React.ReactNode;
    allowedRoles?: number | number[];
    redirectPath?: string;
}

export const ProtectedPage = ({
    children,
    allowedRoles,
    redirectPath = '/unauthorized'
}: ProtectedPageProps) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            // Si hay roles específicos requeridos
            if (allowedRoles !== undefined) {
                const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

                if (!rolesArray.includes(user.role)) {
                    router.push(redirectPath);
                    return;
                }
            }
        } else if (!loading && !user) {
            // No autenticado
            router.push('/');
        }
    }, [user, loading, router, allowedRoles, redirectPath]);

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        return null;
    }

    // Verificar roles si se especificaron
    if (allowedRoles !== undefined) {
        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (!rolesArray.includes(user.role)) {
            return null;
        }
    }

    return <>{children}</>;
};