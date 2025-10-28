'use client';

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { fetchClient } from "../lib/fetchClient";
import { User } from "../Types";
import { toast } from "react-toastify";
import { FaExclamationCircle, FaSearch } from "react-icons/fa";
import Tooltip from "./Tooltip";

type NewAcocuntForm = {
    name: string;
    phone: string;
    apiKey: string;
    authorized: string[];
    phoneId: string;
};



const NewAccountModal = ({ onClose, reload }: { onClose: () => void, reload: () => void }) => {
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<NewAcocuntForm>();
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const onSubmit = handleSubmit(async (data) => {
        const response = await fetchClient.post('/account', data);
        const ans = await response.json();

        if (response.ok) {
            toast.success(ans.message);
            reload();
            onClose();
        } else toast.error(ans.message);
    });

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetchClient.get('/user/getAll');
            const ans = await response.json();
            if (response.ok) setUsers(ans.payload);
            else toast.error(ans.message);
        };
        fetchData();
    }, []);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserToggle = (userId: string) => {
        const newSelectedUsers = selectedUsers.includes(userId)
            ? selectedUsers.filter(id => id !== userId)
            : [...selectedUsers, userId];

        setSelectedUsers(newSelectedUsers);
        setValue('authorized', newSelectedUsers);
    };

    const selectAllUsers = () => {
        const allUserIds = users.map(user => user.id);
        setSelectedUsers(allUserIds);
        setValue('authorized', allUserIds);
    };

    const clearAllUsers = () => {
        setSelectedUsers([]);
        setValue('authorized', []);
    };

    return (
        <div className="fixed inset-0 bg-white/70 flex justify-center items-center">
            <form
                onSubmit={onSubmit}
                className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col gap-5 items-center border-2 border-verde"
            >
                <div className="flex gap-6">
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                            <span>Conta</span>
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
                            <span>Telemóvel</span>
                            <input
                                {...register("phone", {
                                    required: "Campo obrigatório",
                                    pattern: { value: /^\d{12}$/, message: 'Apenas números (12)' }
                                })}
                                placeholder="999999"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                                type="text"
                            />
                            {errors.phone && (
                                <span className="text-red-400 text-sm">{errors.phone.message}</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <span>Telemóvel ID</span>
                            <input
                                {...register("phoneId", {
                                    required: "Campo obrigatório",
                                    pattern: { value: /^\d+$/, message: 'Apenas números' }
                                })}
                                placeholder="999999"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                                type="text"
                            />
                            {errors.phoneId && (
                                <span className="text-red-400 text-sm">{errors.phoneId.message}</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <span>API Key</span>
                            <input
                                {...register("apiKey", {
                                    required: "Campo obrigatório",
                                })}
                                placeholder="API Key"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                                type="text"
                            />
                            {errors.apiKey && (
                                <span className="text-red-400 text-sm">{errors.apiKey.message}</span>
                            )}
                        </div>

                    </div>
                    <div className="space-y-5">
                        <div className='flex flex-col gap-3 h-full'>
                            <label className='flex gap-3 items-center'>
                                Utilizadores autorizados
                                <Tooltip text='Selecione os utilizadores que terão acesso a esta conta'>
                                    <FaExclamationCircle size={16} />
                                </Tooltip>
                            </label>

                            {/* Contador y controles */}
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-300">
                                    {selectedUsers.length} de {users.length} selecionados
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllUsers}
                                        className="text-xs bg-verde hover:bg-verde/80 px-2 py-1 rounded transition-colors"
                                    >
                                        Todos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAllUsers}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                                    >
                                        Limpar
                                    </button>
                                </div>
                            </div>

                            {/* Barra de búsqueda */}
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-3 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar utilizadores..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Lista de usuarios con checkboxes */}
                            <div className="border rounded p-3  h-64 overflow-y-auto">
                                <div className="space-y-2">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <button
                                                type="button"
                                                key={user.id}
                                                onClick={() => handleUserToggle(user.id)}
                                                className="flex w-52 items-center space-x-3 p-2 hover:bg-gray-200 rounded cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => handleUserToggle(user.id)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium">
                                                        {user.name} {user.lastname}
                                                    </div>
                                                    <div className="text-xs text-gray-400 truncate">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-400 py-4">
                                            Nenhum utilizador encontrado
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Campo oculto para react-hook-form */}
                            <input
                                type="hidden"
                                {...register('authorized', {
                                    required: 'Selecione pelo menos um utilizador',
                                    validate: value => value.length > 0 || 'Selecione pelo menos um utilizador'
                                })}
                            />

                            {errors.authorized && (
                                <span className="text-red-400 text-sm">{errors.authorized.message}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 text-white">
                    <button
                        className="px-6 py-3 font-semibold cursor-pointer rounded-2xl bg-verde hover:bg-verde/90"
                    >Submeter</button>
                    <button
                        className="px-6 py-3 font-semibold cursor-pointer rounded-2xl bg-gray-400 hover:bg-gray-400/90"
                        type="button"
                        onClick={onClose}
                    >Cancelar</button>
                </div>
            </form>
        </div>
    );
};

export default NewAccountModal;