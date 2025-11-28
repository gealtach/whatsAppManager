// components/NewBroadcast.tsx
'use client';

import { useForm } from "react-hook-form";
import Loading from "./Loading";
import { useState, useEffect } from "react";
import { Client, MessageTemplate } from "../Types";
import { toast } from "react-toastify";
import { fetchClient } from "../lib/fetchClient";
import TemplateViewer from "./TemplateViewer";
import ComponentBuilder, { FieldValidation, WhatsAppComponent } from "../lib/componentBuilder";

type NewBroadcastForm = {
    templateName: string;
    clientIds: string[];
    scheduledAt: Date;
}

export interface RequiredField {
    id: string;
    componentType: 'header' | 'body' | 'button';
    componentIndex?: number;
    parameterType: string;
    subType?: string;
    label: string;
    placeholder: string;
    required: boolean;
    validation?: FieldValidation;
    hint?: string;
}

export interface TemplateAnalysis {
    name: string;
    language: string;
    requiredFields: RequiredField[];
    componentsTemplate: WhatsAppComponent[];
    metadata: {
        category: string;
        hasHeader: boolean;
        headerFormat?: string;
        bodyParameterCount: number;
        buttonCount: number
    };
}

interface UserInputValues {
    [key: string]: string | number;
}

const NewBroadcast = ({
    onClose,
    reload,
    accountId,
    clients,
    templates,
    modelos,
}: {
    onClose: () => void,
    reload: () => void,
    accountId: string,
    clients: Client[],
    templates: MessageTemplate[],
    modelos: TemplateAnalysis[],
}) => {
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<NewBroadcastForm>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | undefined>(undefined);
    const [selectedModel, setSelectedModel] = useState<TemplateAnalysis | undefined>(undefined);
    const [userInputValues, setUserInputValues] = useState<UserInputValues>({});

    // Handler para los inputs dinámicos
    const handleInputChange = (fieldId: string, value: string | number) => {
        setUserInputValues(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    // Función para manejar "Seleccionar todos"
    const handleSelectAll = () => {
        const allClientIds = clients.filter(c => c.isActive).map(client => client.id);
        setValue("clientIds", allClientIds);
    };

    // Función para manejar "Deseleccionar todos"
    const handleDeselectAll = () => {
        setValue("clientIds", []);
    };

    const templateName = watch('templateName');

    useEffect(() => {
        if (templateName !== '') {
            const selected = templates.find(t => t.name === templateName);
            const selectedAnalysis = modelos.find(m => m.name === templateName);

            setSelectedTemplate(selected);
            setSelectedModel(selectedAnalysis);

            // Limpiar inputs cuando cambia el template
            setUserInputValues({});
        }
    }, [templates, templateName, modelos]);

    const onSubmit = handleSubmit(async (data) => {
        setIsLoading(true);

        try {
            if (!selectedModel) {
                toast.error('Modelo não selecionado');
                return;
            }

            // Validar campos requeridos
            const validation = ComponentBuilder.validateRequiredFields(
                selectedModel.requiredFields,
                userInputValues
            );

            if (!validation.valid) {
                for (const error of validation.errors) {
                    toast.error(error);
                }
                return;
            }

            // Construir el objeto de components
            const components = ComponentBuilder.buildComponents(
                selectedModel.requiredFields,
                userInputValues,
                selectedModel.componentsTemplate,
            );

            console.log('Components construidos:', components);

            // Construir el objeto template completo
            const templateObject = {
                name: selectedModel.name,
                language: {
                    code: selectedModel.language
                },
                components
            };

            console.log('Template object final:', templateObject);

            // Normalizar clientIds
            let clientIds = data.clientIds;
            if (typeof clientIds === 'string') {
                clientIds = [clientIds];
            }

            // Enviar datos al backend
            const requestData = {
                accountId,
                templateName: selectedModel.name,
                templateLanguage: selectedModel.language,
                template: templateObject,
                clientIds,
                scheduledAt: data.scheduledAt || null,
            };

            console.log('Request data:', requestData);

            const response = await fetchClient.post('/broadcast', requestData);
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

    return (
        <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50">
            <form onSubmit={onSubmit} className="p-5 px-10 gap-10 bg-white flex items-start rounded-2xl border-2 border-verde mx-5 w-full max-h-[90vh] overflow-y-auto">

                {/* Columna 1: Vista previa del template */}
                <div className="w-1/4">
                    {selectedTemplate && (
                        <div className="sticky top-0">
                            <h3 className="font-semibold mb-2">Vista Previa</h3>
                            <TemplateViewer template={selectedTemplate} />
                        </div>
                    )}
                </div>

                {/* Columna 2: Configuración básica */}
                <div className="w-1/4">
                    <h1 className="text-xl font-semibold">Nova Difusão</h1>
                    <p className="text-sm text-gray-600">Os campos com * são obrigatórios</p>

                    <div className="flex flex-col gap-3 my-3">
                        {/* Selector de Modelo */}
                        <div className="flex flex-col gap-1">
                            <span className="font-medium">Modelo *</span>
                            <select
                                {...register('templateName', {
                                    required: 'Campo obrigatório'
                                })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                                defaultValue=""
                            >
                                <option value="" disabled>Seleciona um modelo</option>
                                {templates.map((t, i) => (
                                    <option key={`${i}-${t.name}`} value={t.name}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                            {errors.templateName && (
                                <span className="text-red-400 text-sm">{errors.templateName.message}</span>
                            )}
                        </div>

                        {/* Data Agendada */}
                        <div className="flex flex-col gap-1">
                            <span className="font-medium">Agendar para (Opcional)</span>
                            <input
                                {...register("scheduledAt")}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                                type="datetime-local"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Seleção de Clientes */}
                        <div className="flex flex-col gap-1">
                            <span className="font-medium">Selecionar Clientes *</span>

                            {clients.length > 0 && (
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        disabled={isLoading}
                                        className="px-3 py-1 text-sm bg-verde text-white rounded-lg hover:bg-verde/90 disabled:bg-gray-400"
                                    >
                                        Todos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeselectAll}
                                        disabled={isLoading}
                                        className="px-3 py-1 text-sm bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:bg-gray-300"
                                    >
                                        Nenhum
                                    </button>
                                </div>
                            )}

                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                                {clients.length > 0 ? (
                                    clients.filter(c => c.isActive).map((client) => (
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
                            {isLoading ? 'Criando...' : 'Criar Difusão'}
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

                {/* Columna 3: Inputs dinámicos del template */}
                <div className="w-1/4 flex flex-col gap-3">
                    <h3 className="font-semibold">Parâmetros do Template</h3>

                    {selectedModel && selectedModel.requiredFields.length > 0 ? (
                        selectedModel.requiredFields.map((field) => {
                            const renderInputField = () => {
                                if (field.parameterType === 'date_time') {
                                    return (
                                        <input
                                            type="datetime-local"
                                            placeholder={field.placeholder}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                                            value={userInputValues[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            required={field.required}
                                        />
                                    );
                                }

                                if (field.parameterType === 'currency') {
                                    return (
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder={field.placeholder}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                                            value={userInputValues[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            required={field.required}
                                        />
                                    );
                                }

                                // Para image, video, document usa tipo url, para otros texto
                                const inputType = ['image', 'video', 'document'].includes(field.parameterType)
                                    ? 'url'
                                    : 'text';

                                return (
                                    <input
                                        type={inputType}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                                        value={userInputValues[field.id] || ''}
                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        required={field.required}
                                        maxLength={field.validation?.maxLength}
                                    />
                                );
                            };

                            return (
                                <div key={field.id} className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">
                                        {field.label}
                                        {field.required && <span className="text-red-500"> *</span>}
                                    </label>

                                    {/* Hint si existe */}
                                    {field.hint && (
                                        <p className="text-xs text-gray-500 mb-1">{field.hint}</p>
                                    )}

                                    {/* Renderizar el input correspondiente */}
                                    {renderInputField()}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-gray-500">
                            {selectedModel ? 'Este template não requer parâmetros' : 'Selecione um template'}
                        </p>
                    )}
                </div>

                {/* Columna 4: Metadata e info */}
                <div className="w-1/4">
                    {selectedModel && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2">Informações do Template</h3>
                            <div className="text-sm space-y-1">
                                <p><strong>Nome:</strong> {selectedModel.name}</p>
                                <p><strong>Idioma:</strong> {selectedModel.language}</p>
                                <p><strong>Categoria:</strong> {selectedModel.metadata.category}</p>
                                {selectedModel.metadata.hasHeader && (
                                    <p><strong>Header:</strong> {selectedModel.metadata.headerFormat}</p>
                                )}
                                {selectedModel.metadata.bodyParameterCount > 0 && (
                                    <p><strong>Parâmetros Body:</strong> {selectedModel.metadata.bodyParameterCount}</p>
                                )}
                                {selectedModel.metadata.buttonCount > 0 && (
                                    <p><strong>Botões:</strong> {selectedModel.metadata.buttonCount}</p>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            </form>

            {isLoading && <Loading />}
        </div>
    );
};

export default NewBroadcast;