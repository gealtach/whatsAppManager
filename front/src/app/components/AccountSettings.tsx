'use client';

import { ChangeEvent, useState } from "react";
import { Account } from "../Types";
import Tooltip from "./Tooltip";
import { FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import Loading from "./Loading";
import { fetchClient } from "../lib/fetchClient";

interface ValidationErrors {
    name?: string;
    phone?: string;
    apiKey?: string;
    wabaId?: string;
    phoneId?: string;
}

const AccountSettings = ({ selectedAccount, updateAccount }: { selectedAccount: Account, updateAccount: () => void }) => {
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const validateField = (field: keyof Account, value: string | null | undefined): string => {
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

            case 'apiKey':
                if (stringValue.trim() === '') {
                    return 'API_KEY é obrigatório';
                }
                return '';

            case 'wabaId':
                if (stringValue.trim() === '') {
                    return 'WABA_ID é obrigatório';
                }
                return '';
            case 'phoneId':
                if (stringValue.trim() === '') {
                    return 'PHONE_ID é obrigatório';
                }
                return '';

            default:
                return '';
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>, field: keyof Account) => {
        const { value } = e.target;

        setEditingAccount(prev =>
            prev ? { ...prev, [field]: value } : null
        );

        const error = validateField(field, value);
        setValidationErrors(prev => ({
            ...prev, [field]: error
        }));
    };

    const validateAllFields = (): boolean => {
        if (!editingAccount) return false;

        const errors: ValidationErrors = {};
        let isValid = true;

        const nameError = validateField('name', editingAccount.name);
        if (nameError) {
            errors.name = nameError;
            isValid = false;
        };

        const phoneError = validateField('phone', editingAccount.phone);
        if (phoneError) {
            errors.phone = phoneError;
            isValid = false;
        };

        const apiKeyError = validateField('apiKey', editingAccount.apiKey);
        if (apiKeyError) {
            errors.apiKey = apiKeyError;
            isValid = false;
        };

        const wabaError = validateField('wabaId', editingAccount.wabaId);
        if (wabaError) {
            errors.wabaId = wabaError;
            isValid = false;
        };

        const phoneIdError = validateField('phoneId', editingAccount.phoneId);
        if (phoneIdError) {
            errors.phoneId = phoneIdError;
            isValid = false;
        };

        setValidationErrors(errors);

        return isValid;
    };

    const startEditing = (account: Account) => {
        setEditingAccount(account);
        setValidationErrors({});
    };

    const cancelEditing = () => {
        setEditingAccount(null);
        setValidationErrors({});
    }

    const onSubmit = async () => {
        if (!editingAccount) return;
        const isValid = validateAllFields();
        if (!isValid) {
            toast.warning('Por favor, corrija os erros antes de salvar');
            return;
        };

        try {
            setIsLoading(true);
            const response = await fetchClient.put("/account", editingAccount);
            const ans = await response.json();
            if (response.ok) {
                toast.success(ans.message);
                updateAccount();
            } else throw new Error(ans.message);
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
            else toast.error('Erro desconhecido');
        } finally { setIsLoading(false); }
    };

    return (
        <div>
            <div className="flex gap-3">
                {!editingAccount && <button
                    onClick={() => startEditing(selectedAccount)}
                    className="flex items-center px-6 py-2 text-white hover:bg-verde/90 cursor-pointer bg-verde rounded-2xl">
                    <Tooltip text="Alterar as credenciais pode fazer com que a conta deixe de enviar mensagens.">Editar <FaEdit className="mx-2" size={20} /></Tooltip>
                </button>
                }
                {
                    editingAccount &&
                    <>
                        <button
                            onClick={onSubmit}
                            className="flex items-center px-6 py-2 text-white hover:bg-verde/90 cursor-pointer bg-verde rounded-2xl">
                            Submeter
                        </button>
                        <button
                            onClick={cancelEditing}
                            className="flex items-center px-6 py-2 text-white hover:bg-gray-400/90 cursor-pointer bg-gray-400 rounded-2xl">
                            Cancelar
                        </button>
                    </>
                }
            </div>
            <div className="space-y-3 my-5">
                <h1 className="flex"><span className="w-32">Nome: </span>{editingAccount ?
                    <div>
                        <input
                            value={editingAccount.name}
                            onChange={(e) => handleChange(e, 'name')}
                            className="p-2 ring-2 ring-verde rounded focus:outline-0 focus:ring-3" />
                        {validationErrors.name && (
                            <span className="text-red-500 text-xs block mt-1">
                                {validationErrors.name}
                            </span>
                        )}
                    </div> :
                    selectedAccount.name}</h1>
                <h1 className="flex"><span className="w-32">Telemóvel: </span>{editingAccount ?
                    <div>
                        <input
                            value={editingAccount.phone}
                            onChange={(e) => handleChange(e, 'phone')}
                            className="p-2 ring-2 ring-verde rounded focus:outline-0 focus:ring-3" />
                        {validationErrors.phone && (
                            <span className="text-red-500 text-xs block mt-1">
                                {validationErrors.phone}
                            </span>
                        )}
                    </div> :
                    selectedAccount.phone}</h1>
                <h1 className="flex"><span className="w-32">API_KEY: </span>{editingAccount ?
                    <div>
                        <input
                            value={editingAccount.apiKey}
                            onChange={(e) => handleChange(e, 'apiKey')}
                            className="p-2 ring-2 ring-verde rounded focus:outline-0 focus:ring-3" />
                        {validationErrors.apiKey && (
                            <span className="text-red-500 text-xs block mt-1">
                                {validationErrors.apiKey}
                            </span>
                        )}
                    </div>
                    :
                    <Tooltip text={selectedAccount.apiKey}>
                        {selectedAccount.apiKey.slice(0, 15)}...
                    </Tooltip>
                }
                </h1>
                <h1 className="flex"><span className="w-32">WABA_ID: </span>{editingAccount ?
                    <div>
                        <input
                            value={editingAccount.wabaId}
                            onChange={(e) => handleChange(e, 'wabaId')}
                            className="p-2 ring-2 ring-verde rounded focus:outline-0 focus:ring-3" />
                        {validationErrors.wabaId && (
                            <span className="text-red-500 text-xs block mt-1">
                                {validationErrors.wabaId}
                            </span>
                        )}
                    </div> :
                    selectedAccount.wabaId}</h1>
                <h1 className="flex"><span className="w-32">PHONE_ID: </span>{editingAccount ?
                    <div>
                        <input
                            value={editingAccount.phoneId}
                            onChange={(e) => handleChange(e, 'phoneId')}
                            className="p-2 ring-2 ring-verde rounded focus:outline-0 focus:ring-3" />
                        {validationErrors.phoneId && (
                            <span className="text-red-500 text-xs block mt-1">
                                {validationErrors.phoneId}
                            </span>
                        )}
                    </div> :
                    selectedAccount.phoneId}</h1>
            </div>
            {isLoading && <Loading />}
        </div>
    );
};

export default AccountSettings;