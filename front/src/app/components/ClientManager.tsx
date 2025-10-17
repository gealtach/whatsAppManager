'use client';

import { useEffect, useState } from "react";
import { Account, Client } from "../Types";
import { toast } from "react-toastify";
import { fetchClient } from "../lib/fetchClient";
import Loading from "./Loading";

const ClientManager = ({ selectedAccount }: { selectedAccount: Account }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
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
        };
        if (selectedAccount.id) fetchData();
    }, [selectedAccount.id]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                    Clientes - {selectedAccount.name}
                </h2>
                <button
                    className="bg-verde font-semibold cursor-pointer text-white px-4 py-2 rounded-2xl hover:bg-verde/80"
                >
                    Novo Cliente
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
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
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {
                            clients.length > 0 ?
                                clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{client.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{client.email}</td>
                                        <td className="px-6 py-4">{client.notes}</td>
                                    </tr>
                                )) :
                                <tr className="text-gray-500 text-center">
                                    <td
                                        className="py-2"
                                        colSpan={4}>Não há clientes para apresentar</td>
                                </tr>
                        }
                    </tbody>
                </table>
            </div>

            {isLoading && <Loading />}
        </div>
    );
};

export default ClientManager;