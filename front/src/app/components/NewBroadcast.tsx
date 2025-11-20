'use client';

import { useForm } from "react-hook-form";
import Loading from "./Loading";
import { useState, useEffect, useCallback } from "react";
import { Client, MessageTemplate } from "../Types";
import { toast } from "react-toastify";
import { fetchClient } from "../lib/fetchClient";
import TemplateViewer from "./TemplateViewer";

type NewBroadcastForm = {
    templateName: string;
    clientIds: string[];
    scheduledAt: Date;
    accountId: string;
}

const NewBroadcast = ({ onClose, reload, accountId, clients }: { onClose: () => void, reload: () => void, accountId: string, clients: Client[] }) => {
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<NewBroadcastForm>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | undefined>(undefined);

    // Función para manejar "Seleccionar todos"
    const handleSelectAll = () => {
        const allClientIds = clients.map(client => client.id);
        setValue("clientIds", allClientIds);
    };

    // Función para manejar "Deseleccionar todos"
    const handleDeselectAll = () => {
        setValue("clientIds", []);
    };

    const template = watch('templateName');

    useEffect(() => {
        if (template !== '') {
            const selected = templates.find(t => t.name === template);
            setSelectedTemplate(selected);
        }
    }, [templates, template]);

    const onSubmit = handleSubmit(async (data) => {
        setIsLoading(true);
        if (typeof data.clientIds === 'string') {
            data.clientIds = [data.clientIds]
        }

        try {
            data.accountId = accountId;
            const response = await fetchClient.post('/broadcast', data);

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || 'Difusão criada com sucesso!');
                reload();
                onClose();
            } else {
                toast.error(result.message || 'Erro ao criar difusão');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar difusão: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
        } finally {
            setIsLoading(false);
        }
    });

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetchClient.get(`/template/${accountId}`);
            const ans = await response.json();
            if (response.ok) setTemplates(ans.payload);
            else throw new Error(ans.message);
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
            else toast.error('Erro desconhecido');
        } finally { setIsLoading(false); }
    }, [accountId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50">
            <form onSubmit={onSubmit} className="p-5 px-10 gap-10 bg-white flex items-center rounded-2xl border-2 border-verde max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="w-1/2">
                    {
                        selectedTemplate &&
                        <TemplateViewer template={selectedTemplate}></TemplateViewer>
                    }
                </div>
                <div className="w-1/2">
                    <h1 className="text-xl font-semibold">Nova Difusão</h1>
                    <h1 className="text-sm text-gray-600">Os campos com * são obrigatórios</h1>

                    <div className="flex flex-col gap-3 my-3">
                        <div className="flex flex-col gap-1">
                            <span>Modelo</span>
                            <select
                                {...register('templateName', {
                                    required: 'Campo obrigatório'
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                                defaultValue={""}
                            >
                                <option value="" disabled>Seleciona um modelo</option>
                                {
                                    templates.map((t, i) => (
                                        <option key={`${i}-${t.name}`} value={t.name}>{t.name}</option>
                                    ))
                                }
                            </select>
                            {errors.templateName && (
                                <span className="text-red-400 text-sm">{errors.templateName.message}</span>
                            )}
                        </div>

                        {/* Data Agendada */}
                        <div className="flex flex-col gap-1">
                            <span>Agendar para (Opcional)</span>
                            <input
                                {...register("scheduledAt")}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                                type="datetime-local"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Seleção de Clientes */}
                        <div className="flex flex-col gap-1">
                            <span>Selecionar Clientes *</span>

                            {/* Botones para Seleccionar/Deseleccionar Todos */}
                            {clients.length > 0 && (
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        disabled={isLoading}
                                        className="px-3 py-1 text-sm bg-verde text-white rounded-lg hover:bg-verde/90 disabled:bg-gray-400"
                                    >
                                        Selecionar Todos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeselectAll}
                                        disabled={isLoading}
                                        className="px-3 py-1 text-sm bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:bg-gray-300"
                                    >
                                        Deselecionar Todos
                                    </button>
                                </div>
                            )}

                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                                {clients.length > 0 ? (
                                    clients.filter(c => c.isActive === true).map((client) => (
                                        <label key={client.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                            <input
                                                {...register("clientIds", {
                                                    required: "Selecione pelo menos um cliente"
                                                })}
                                                type="checkbox"
                                                value={client.id}
                                                className="rounded text-verde focus:ring-verde"
                                                disabled={isLoading}
                                            />
                                            <span className="text-sm">
                                                {client.name} - {client.phone}
                                            </span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        Nenhum cliente disponível
                                    </p>
                                )}
                            </div>
                            {errors.clientIds && (
                                <span className="text-red-400 text-sm">{errors.clientIds.message}</span>
                            )}
                        </div>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3 text-white font-semibold">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 cursor-pointer rounded-2xl bg-verde hover:bg-verde/90 disabled:bg-gray-400 flex-1"
                        >
                            {isLoading ? 'Criando Difusão...' : 'Criar Difusão'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 cursor-pointer rounded-2xl bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </form>
            {isLoading && <Loading />}
        </div>
    );
};

export default NewBroadcast;