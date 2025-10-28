'use client';

import { useForm } from "react-hook-form";
import Loading from "./Loading";
import { useState, useRef } from "react";
import { Client } from "../Types";
import { toast } from "react-toastify";
import { fetchClient } from "../lib/fetchClient";

type NewBroadcastForm = {
    name: string;
    message: string;
    clientIds: string[];
    scheduledAt: Date;
    accountId: string;
}

const NewBroadcast = ({ onClose, reload, accountId, clients }: { onClose: () => void, reload: () => void, accountId: string, clients: Client[] }) => {
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<NewBroadcastForm>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Función para manejar "Seleccionar todos"
    const handleSelectAll = () => {
        const allClientIds = clients.map(client => client.id);
        setValue("clientIds", allClientIds);
    };

    // Función para manejar "Deseleccionar todos"
    const handleDeselectAll = () => {
        setValue("clientIds", []);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setSelectedFile(file || null);
        setUploadProgress(0);
    };

    const onSubmit = handleSubmit(async (data) => {
        setIsLoading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();

            const clientIdsToSend = Array.isArray(data.clientIds)
                ? data.clientIds
                : [data.clientIds]


            // Agregar datos del broadcast
            formData.append('name', data.name);
            formData.append('message', data.message);
            formData.append('accountId', accountId);
            formData.append('clientIds', JSON.stringify(clientIdsToSend));

            if (data.scheduledAt) {
                formData.append('scheduledAt', data.scheduledAt.toString());
            }

            // Agregar archivo si existe
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            // Usar fetchClient con tracking de progreso
            const response = await fetchClient.uploadWithProgress(
                '/broadcast',
                formData,
                (progress) => setUploadProgress(progress)
            );

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
            setUploadProgress(0);
        }
    });

    return (
        <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50">
            <form onSubmit={onSubmit} className="p-5 px-10 bg-white rounded-2xl border-2 border-verde max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h1 className="text-xl font-semibold">Nova Difusão</h1>
                <h1 className="text-sm text-gray-600">Os campos com * são obrigatórios</h1>

                <div className="flex flex-col gap-3 my-3">
                    {/* Nome da Difusão */}
                    <div className="flex flex-col gap-1">
                        <span>Nome da Difusão *</span>
                        <input
                            {...register("name", { required: "Campo obrigatório" })}
                            placeholder="Nome da difusão"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                            type="text"
                            disabled={isLoading}
                        />
                        {errors.name && (
                            <span className="text-red-400 text-sm">{errors.name.message}</span>
                        )}
                    </div>

                    {/* Mensagem */}
                    <div className="flex flex-col gap-1">
                        <span>Mensagem *</span>
                        <textarea
                            {...register("message", { required: "Campo obrigatório" })}
                            placeholder="Mensagem para enviar"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent h-24"
                            rows={4}
                            disabled={isLoading}
                        />
                        {errors.message && (
                            <span className="text-red-400 text-sm">{errors.message.message}</span>
                        )}
                    </div>

                    {/* Upload de Arquivo */}
                    <div className="flex flex-col gap-1">
                        <span>Arquivo Multimedia (Opcional)</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".png,.jpg,.jpeg,.gif,.mp4,.avi,.mov,.webm"
                            onChange={handleFileSelect}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500">
                            Formatos: PNG, JPG, JPEG, GIF, MP4, AVI, MOV, WEBM
                        </p>

                        {selectedFile && (
                            <div className="mt-2 p-3 border border-verde rounded-lg">
                                <p className="text-sm font-medium">Arquivo selecionado:</p>
                                <p className="text-sm text-gray-600">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {isLoading && uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-verde h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-center mt-1">
                                Subindo arquivo... {uploadProgress.toFixed(1)}%
                            </p>
                        </div>
                    )}

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
                                clients.map((client) => (
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
            </form>
            {isLoading && <Loading />}
        </div>
    );
};

export default NewBroadcast;