'use client';

import { useEffect, useState } from "react";
import { fetchClient } from "../lib/fetchClient";
import { toast } from "react-toastify";
import Loading from "./Loading";
import NewAccountModal from "./NewAccountModal";
import { Account } from "../Types";

const AccountManager = ({ onAccountSelect }: { onAccountSelect: (a: Account) => void }) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [aux, setAux] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [newAccountModal, setNewAccountModal] = useState<boolean>(false);

    const handleClick = (account: Account) => {
        onAccountSelect(account);
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await fetchClient.get('/account');
                const ans = await response.json();
                if (response.ok) setAccounts(ans.payload);
                else toast.error(ans.message);
            } catch (error) {
                if (error instanceof Error) toast.error(error.message);
                else toast.error('Erro desconhecido');
            } finally { setIsLoading(false); }
        };
        fetchData();
    }, [aux]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Gestão de Contas</h2>
                <button
                    onClick={() => setNewAccountModal(true)}
                    className="bg-verde font-semibold cursor-pointer text-white px-4 py-2 rounded-2xl hover:bg-verde/80"
                >
                    Nova Conta
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((account) => (
                    <button
                        key={account.id}
                        onClick={() => handleClick(account)}
                        className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-md text-left"
                    >
                        <h3 className="font-bold text-lg">{account.name}</h3>
                        <p className="text-gray-600">{account.phone}</p>
                        <div className="mt-4 flex justify-between text-sm text-gray-500">
                            <span>{account.clients?.length || 0} clientes</span>
                            <span>{account.broadcasts?.length || 0} difusiones</span>
                        </div>
                    </button>
                ))}
            </div>

            {accounts.length === 0 && !isLoading && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No hay cuentas registradas</p>
                </div>
            )}

            {newAccountModal && (
                <NewAccountModal
                    onClose={() => setNewAccountModal(false)}
                    reload={() => setAux(!aux)}
                />
            )}
            {isLoading && <Loading />}
        </div>
    );
};

export default AccountManager;