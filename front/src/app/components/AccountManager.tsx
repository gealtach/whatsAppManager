'use client';

import { useState } from "react";
import NewAccountModal from "./NewAccountModal";
import { Account } from "../Types";

const AccountManager = ({ onAccountSelect, accounts, reload }: { onAccountSelect: (a: Account) => void, accounts: Account[], reload: () => void }) => {
    const [newAccountModal, setNewAccountModal] = useState<boolean>(false);

    const handleClick = (account: Account) => {
        onAccountSelect(account);
    };

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
                        className="bg-background rounded-2xl border shadow p-6 cursor-pointer hover:shadow-md text-left relative overflow-hidden transition-all duration-300 before:absolute before:inset-0 before:bg-verde/30 before:transform before:-translate-x-full before:transition-transform before:duration-300 before:ease-out hover:before:translate-x-0"
                    >
                        <h3 className="font-bold text-foreground text-lg">{account.name}</h3>
                        <p className="text-gray-600">{account.phone}</p>
                        <div className="mt-4 flex justify-between text-sm text-gray-500">
                            <span>{account.clients?.length || 0} clientes</span>
                            <span>{account.broadcasts?.length || 0} difusiones</span>
                        </div>
                    </button>
                ))}
            </div>

            {accounts.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No hay cuentas registradas</p>
                </div>
            )}

            {newAccountModal && (
                <NewAccountModal
                    onClose={() => setNewAccountModal(false)}
                    reload={reload}
                />
            )}
        </div>
    );
};

export default AccountManager;