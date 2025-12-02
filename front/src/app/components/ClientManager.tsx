'use client';

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Account, Client } from "../Types";
import { toast } from "react-toastify";
import { fetchClient } from "../lib/fetchClient";
import Loading from "./Loading";
import NewClient from "./NewClient";
import { FaEdit, FaSave } from "react-icons/fa";
import Pagination from "./Pagination";
import { TbCancel } from "react-icons/tb";

// Interface para los errores de validación
interface ValidationErrors {
    name?: string;
    phone?: string;
    email?: string;
}

const ClientManager = ({ selectedAccount }: { selectedAccount: Account }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [newClientModal, setNewClientModal] = useState<boolean>(false);
    const [aux, setAux] = useState<boolean>(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetchClient.get(`/client/${selectedAccount.id}`);
            const ans = await response.json();
            if (response.ok) setClients(ans.payload);
            else toast.error(ans.message);
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
            else toast.error('Erro desconhecido');
        } finally { setIsLoading(false); }
    }, [selectedAccount.id]);

    const validateField = (field: keyof Client, value: string | null | undefined): string => {
        // Convertir a string vacío si es null o undefined
        const stringValue = String(value || '');

        switch (field) {
            case 'name':
                if (stringValue.trim() === '') {
                    return 'Nome é obrigatório';
                }
                return '';

            case 'phone':
                if (stringValue.trim() === '') {
                    return 'Telemóvel é obrigatório';
                }
                if (!/^\d{12}$/.test(stringValue)) {
                    return 'Apenas números (12)';
                }
                return '';

            case 'email':
                if (stringValue.trim() !== '' && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(stringValue)) {
                    return 'Email inválido';
                }
                return '';

            default:
                return '';
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>, field: keyof Client) => {
        const { value } = e.target;

        setEditingClient(prev =>
            prev ? { ...prev, [field]: value } : null
        );

        // Validar el campo en tiempo real
        const error = validateField(field, value);
        setValidationErrors(prev => ({
            ...prev,
            [field]: error
        }));
    };

    const validateAllFields = (): boolean => {
        if (!editingClient) return false;

        const errors: ValidationErrors = {};
        let isValid = true;

        // Validar name
        const nameError = validateField('name', editingClient.name);
        if (nameError) {
            errors.name = nameError;
            isValid = false;
        }

        // Validar phone
        const phoneError = validateField('phone', editingClient.phone);
        if (phoneError) {
            errors.phone = phoneError;
            isValid = false;
        }

        // Validar email
        const emailError = validateField('email', editingClient.email);
        if (emailError) {
            errors.email = emailError;
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    // Limpiar errores cuando se cancela la edición
    const cancelEditing = () => {
        setEditingClient(null);
        setValidationErrors({});
    };

    // Limpiar errores cuando se inicia una nueva edición
    const startEditing = (client: Client) => {
        setEditingClient(client);
        setValidationErrors({});
    };

    const updateClient = async () => {
        if (!editingClient) return;
        const isValid = validateAllFields();
        if (!isValid) {
            toast.warning('Por favor, corrija os erros antes de salvar');
            return;
        };
        try {
            setIsLoading(true);
            const response = await fetchClient.put(`/client/${editingClient.id}`, editingClient);
            const ans = await response.json();
            if (response.ok) {
                toast.success(ans.message);
                setAux(!aux);
                setEditingClient(null);
            } else throw new Error(ans.message);
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
            else toast.error('Erro desconhecido');
        } finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData, aux]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                    Clientes - {selectedAccount.name}
                </h2>
                <button
                    onClick={() => setNewClientModal(true)}
                    className="bg-verde font-semibold cursor-pointer text-white px-4 py-2 rounded-2xl hover:bg-verde/80"
                >
                    Novo Cliente
                </button>
            </div>
            <Pagination
                data={clients}
                filterFields={['name']}
                itemsPerPage={10}>
                {({
                    currentItems,
                    PaginationInfo, PaginationControls,
                    BottomPaginationControls,
                    FilterComponent
                }) => (
                    <>
                        <div className="my-3">
                            {FilterComponent}
                        </div>
                        <div className="flex justify-between items-center p-2 bg-verde">
                            {PaginationInfo}
                            {PaginationControls}
                        </div>
                        <div className="bg-background rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Nome
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Telemóvel
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Notas
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            <FaEdit size={20} />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-background divide-y divide-gray-200">
                                    {
                                        currentItems.length > 0 ?
                                            currentItems.map((client) => (
                                                <tr key={client.id} className="hover:bg-gray-50">
                                                    {
                                                        editingClient?.id === client.id ?
                                                            <>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <input
                                                                        className={`p-2 ring-2 rounded focus:outline-0 focus:ring-3 ${validationErrors.name
                                                                            ? 'ring-red-500'
                                                                            : 'ring-verde'
                                                                            }`}
                                                                        value={editingClient.name}
                                                                        onChange={(e) => handleChange(e, 'name')}
                                                                    />
                                                                    {validationErrors.name && (
                                                                        <span className="text-red-500 text-xs block mt-1">
                                                                            {validationErrors.name}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <input
                                                                        className={`p-2 ring-2 rounded focus:outline-0 focus:ring-3 ${validationErrors.phone
                                                                            ? 'ring-red-500'
                                                                            : 'ring-verde'
                                                                            }`}
                                                                        value={editingClient.phone}
                                                                        onChange={(e) => handleChange(e, 'phone')}
                                                                    />
                                                                    {validationErrors.phone && (
                                                                        <span className="text-red-500 text-xs block mt-1">
                                                                            {validationErrors.phone}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <input
                                                                        className={`p-2 ring-2 rounded focus:outline-0 focus:ring-3 ${validationErrors.email
                                                                            ? 'ring-red-500'
                                                                            : 'ring-verde'
                                                                            }`}
                                                                        value={editingClient.email}
                                                                        onChange={(e) => handleChange(e, 'email')}
                                                                    />
                                                                    {validationErrors.email && (
                                                                        <span className="text-red-500 text-xs block mt-1">
                                                                            {validationErrors.email}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <input
                                                                        className="p-2 ring-2 ring-verde rounded focus:outline-0 focus:ring-3"
                                                                        value={editingClient.notes}
                                                                        onChange={(e) => handleChange(e, 'notes')}
                                                                    />
                                                                </td>
                                                                <td className="px-2 py-4 space-x-2">
                                                                    <button onClick={cancelEditing}
                                                                        className="hover:text-red-500 cursor-pointer">
                                                                        <TbCancel size={20} />
                                                                    </button>
                                                                    <button onClick={updateClient}
                                                                        className="hover:text-verde cursor-pointer">
                                                                        <FaSave size={20} />
                                                                    </button>
                                                                </td>
                                                            </> :
                                                            <>
                                                                <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">{client.phone}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">{client.email}</td>
                                                                <td className="px-6 py-4">{client.notes}</td>
                                                                <td className="px-6 py-4">
                                                                    <button onClick={() => startEditing(client)}
                                                                        className="hover:text-verde cursor-pointer">
                                                                        <FaEdit size={20} />
                                                                    </button>
                                                                </td>
                                                            </>
                                                    }

                                                </tr>
                                            )) :
                                            <tr className="text-gray-500 text-center">
                                                <td
                                                    className="py-2"
                                                    colSpan={5}>Não há clientes para apresentar</td>
                                            </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                        {BottomPaginationControls}
                    </>
                )}
            </Pagination>

            {isLoading && <Loading />}
            {newClientModal &&
                <NewClient
                    onClose={() => setNewClientModal(false)}
                    reload={() => setAux(!aux)}
                    accountId={selectedAccount.id} />}
        </div>
    );
};

export default ClientManager;