'use client';

import { useEffect, useState } from "react";
import { Account, Broadcast, Client } from "../Types";
import { fetchClient } from "../lib/fetchClient";
import { toast } from "react-toastify";
import Loading from "./Loading";
import NewBroadcast from "./NewBroadcast";

const BroadcastManager = ({ selectedAccount }: { selectedAccount: Account }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [newBroadcastModal, setNewBroadcastModal] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [aux, setAux] = useState<boolean>(false);

    const sendBroadcast = async (broadcastId: string) => {
        try {
            setIsLoading(true);
            const response = await fetchClient.post(`/whatsapp/send/${broadcastId}`);
            const ans = await response.json();
            if (response.ok) {
                toast.success(ans.message);
                setAux(!aux);
            } else toast.error(ans.message);
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
            else toast.error('Erro desconhecido');
        } finally { setIsLoading(false); }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [clientResponse, broadcastResponse] = await Promise.all([
                    fetchClient.get(`/client/${selectedAccount.id}`),
                    fetchClient.get(`/broadcast/${selectedAccount.id}`)
                ]);

                const [clientAns, broadcastAns] = await Promise.all([
                    clientResponse.json(),
                    broadcastResponse.json()
                ]);
                console.log(broadcastAns)

                if (clientResponse.ok) setClients(clientAns.payload);
                else toast.error(clientAns.message);

                if (broadcastResponse.ok) setBroadcasts(broadcastAns.payload);
                else toast.error(broadcastAns.message);
            } catch (error) {
                if (error instanceof Error) toast.error(error.message);
                else toast.error('Erro desconhecido');
            } finally { setIsLoading(false); }
        };
        fetchData();
    }, [selectedAccount.id, aux]);
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                    Difussões - {selectedAccount.name}
                </h2>
                <button
                    onClick={() => setNewBroadcastModal(true)}
                    className="bg-verde font-semibold cursor-pointer text-white px-4 py-2 rounded-2xl hover:bg-verde/80"
                >
                    Nova Difussão
                </button>
            </div>
            <div className="space-y-4">
                {broadcasts.map((broadcast) => (
                    <div key={broadcast.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">{broadcast.name}</h3>
                                <p className="text-gray-600 mt-2">{broadcast.message}</p>
                                <div className="mt-2 text-sm text-gray-500">
                                    <span>Destinatarios: {broadcast.recipients.length}</span>
                                    <span className="ml-4">Estado: {broadcast.status}</span>
                                    {broadcast.sentAt && (
                                        <span className="ml-4">
                                            Enviado: {new Date(broadcast.sentAt).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <div><a
                                    className="text-blue-500 underline"
                                    target="_blank"
                                    href={broadcast.complement}>Link</a></div>
                            </div>
                            {broadcast.status === 'PENDING' && (
                                <button
                                    onClick={() => sendBroadcast(broadcast.id)}
                                    className="bg-verde text-white px-4 py-2 rounded-2xl font-semibold cursor-pointer hover:bg-verde/90"
                                >
                                    Enviar
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {isLoading && <Loading />}
            {newBroadcastModal &&
                <NewBroadcast
                    clients={clients}
                    onClose={() => setNewBroadcastModal(false)}
                    reload={() => setAux(!aux)}
                    accountId={selectedAccount.id} />
            }
        </div>
    );
};

export default BroadcastManager;