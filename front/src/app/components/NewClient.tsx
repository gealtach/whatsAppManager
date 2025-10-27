'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Loading from "./Loading";
import { fetchClient } from "../lib/fetchClient";

type NewClientForm = {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    accountId: string
}

const NewClient = ({ onClose, accountId, reload }: { onClose: () => void, reload: () => void, accountId: string }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<NewClientForm>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const onSubmit = handleSubmit(async (data) => {
        data.accountId = accountId;
        try {
            setIsLoading(true);
            const response = await fetchClient.post('/client', data);
            const ans = await response.json();
            if (response.ok) {
                toast.success(ans.message);
                reload();
                onClose();
            } else toast.error(ans.message);
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
            else toast.error('Erro desconhecido');
        } finally { setIsLoading(false); }
    });
    return (
        <div className="fixed inset-0 bg-white/70 flex items-center justify-center">
            <form onSubmit={onSubmit} className="p-5 px-10 bg-white rounded-2xl border-2 border-verde">
                <h1 className="text-xl font-semibold">Novo Cliente</h1>
                <h1 className="text-sm text-gray-600">Os campos com * são obrigatórios</h1>
                <div className="flex flex-col gap-3 my-3">
                    <div className="flex flex-col gap-1">
                        <span>Conta *</span>
                        <input
                            {...register("name", {
                                required: "Campo obrigatório",
                            })}
                            placeholder="Nome da conta"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                            type="text"
                        />
                        {errors.name && (
                            <span className="text-red-400 text-sm">{errors.name.message}</span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <span>Telemóvel *</span>
                        <input
                            {...register("phone", {
                                required: "Campo obrigatório",
                                pattern: { value: /^\d{9}$/, message: 'Apenas números (9)' }
                            })}
                            placeholder="999999999"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                            type="text"
                        />
                        {errors.phone && (
                            <span className="text-red-400 text-sm">{errors.phone.message}</span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <span>Email</span>
                        <input
                            {...register('email', {
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Email inválido'
                                }
                            })}
                            placeholder="Email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                            type="text"
                        />
                        {errors.email && (
                            <span className="text-red-400 text-sm">{errors.email.message}</span>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <span>Notas</span>
                        <input
                            {...register("notes", {
                            })}
                            placeholder="Notas da conta"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                            type="text"
                        />
                    </div>
                </div>
                <div className="flex gap-3 text-white font-semibold">
                    <button
                        className="px-4 py-2 cursor-pointer rounded-2xl bg-verde hover:bg-verde/90"
                    >Submeter</button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 cursor-pointer rounded-2xl bg-gray-400 hover:bg-gray-400/90"
                    >Cancelar</button>
                </div>
            </form>
            {isLoading && <Loading />}
        </div>
    );
};

export default NewClient;