// Login.tsx
'use client';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

type LoginForm = {
    email: string;
    password: string;
}

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
    const { login } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const onSubmit = handleSubmit(async (data) => {
        setLoading(true);
        setError('');

        try {
            // Usa SOLO la función del contexto
            const result = await login(data.email, data.password);

            if (result.success) {
                router.push('/dashboard');
            } else {
                toast.error(result.message || 'Erro de credenciais');
            }
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
            else toast.error('Erro desconhecido');
        } finally {
            setLoading(false);
        }
    });

    return (
        <div>
            <form
                onSubmit={onSubmit}
                className='flex flex-col border justify-center items-center p-10 gap-5 w-fit bg-green-300 rounded-2xl'>
                <h1 className="text-2xl font-bold mb-4">Iniciar sessão</h1>

                <div className='flex flex-col gap-3 w-full'>
                    <span>Email</span>
                    <input
                        {...register('email', {
                            required: 'Campo obligatorio',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Email inválido'
                            }
                        })}
                        placeholder='Email'
                        className='border rounded p-2 w-64'
                        type="email"
                    />
                    {errors.email && <span className='text-red-600 text-sm'>{errors.email.message}</span>}
                </div>

                <div className='flex flex-col gap-3 w-full'>
                    <span>Palavra-passe</span>
                    <input
                        {...register('password', {
                            required: 'Campo obligatorio',
                            minLength: {
                                value: 6,
                                message: 'Mínimo 6 caracteres'
                            }
                        })}
                        placeholder='*****'
                        className='border rounded p-2 w-64'
                        type="password"
                    />
                    {errors.password && <span className='text-red-600 text-sm'>{errors.password.message}</span>}
                </div>

                <div className='flex gap-2'>
                    <button
                        type="submit"
                        className='bg-purple-500 px-6 py-2 rounded-2xl hover:bg-purple-600 cursor-pointer w-full transition-colors disabled:bg-purple-300'
                        disabled={loading}
                    >
                        {loading ? 'A entrar...' : 'Entrar'}
                    </button>
                </div>

                {error && <span className='text-red-600 text-sm'>{error}</span>}
            </form>
        </div>
    )
}

export default Login;