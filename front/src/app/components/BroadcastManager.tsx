// components/BroadcastManager.tsx
'use client';

import { useCallback, useEffect, useState } from "react";
import { Account, Broadcast, Client, MessageTemplate, TemplateAnalysis } from "../Types";
import { fetchClient } from "../lib/fetchClient";
import { toast } from "react-toastify";
import Loading from "./Loading";
import NewBroadcast from "./NewBroadcast";
import BroadcastModal from "./BroadcastModal";
import Pagination from "./Pagination";

const BroadcastManager = ({ selectedAccount }: { selectedAccount: Account }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [newBroadcastModal, setNewBroadcastModal] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [aux, setAux] = useState<boolean>(false);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [modelos, setModelos] = useState<TemplateAnalysis[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | undefined>(undefined);
    const [viewTemplate, setViewTemplate] = useState<boolean>(false);
    const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | undefined>(undefined);

    const sendBroadcast = async (broadcastId: string) => {
        try {
            setIsLoading(true);
            const response = await fetchClient.post(`/broadcast/send/${broadcastId}`, {});
            const ans = await response.json();

            if (response.ok) {
                toast.success(ans.message || 'Difusão enviada com sucesso!');
            } else {
                toast.error(ans.message || 'Erro ao enviar difusão');
            }

            setAux(!aux);
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Erro desconhecido');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const openViewer = (id: string) => {
        const selectedBc = broadcasts.find(bc => bc.id === id);
        setSelectedBroadcast(selectedBc);

        if (selectedBc) {
            const selectedT = templates.find(t => t.name === selectedBc.templateName);
            setSelectedTemplate(selectedT);
            setViewTemplate(true);
        }
    };

    const closeViewer = () => {
        setSelectedTemplate(undefined);
        setSelectedBroadcast(undefined);
        setViewTemplate(false);
    };

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);

            const [clientResponse, broadcastResponse, templatesResponse] = await Promise.all([
                fetchClient.get(`/client/${selectedAccount.id}`),
                fetchClient.get(`/broadcast/${selectedAccount.id}`),
                fetchClient.get(`/template/${selectedAccount.id}`)
            ]);

            const [clientAns, broadcastAns, templatesAns] = await Promise.all([
                clientResponse.json(),
                broadcastResponse.json(),
                templatesResponse.json()
            ]);

            // Clients
            if (clientResponse.ok) {
                setClients(clientAns.payload);
            } else {
                toast.error(clientAns.message);
            }

            // Broadcasts
            if (broadcastResponse.ok) {
                setBroadcasts(broadcastAns.payload);
            } else {
                toast.error(broadcastAns.message);
            }

            // Templates y Modelos
            if (templatesResponse.ok) {
                console.log('Templates response:', templatesAns.payload);
                setTemplates(templatesAns.payload.approvedTemplates);
                setModelos(templatesAns.payload.modelos);
            } else {
                toast.error(templatesAns.message);
            }
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Erro desconhecido');
            }
        } finally {
            setIsLoading(false);
        }
    }, [selectedAccount.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData, aux]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                    Difusões - {selectedAccount.name}
                </h2>
                <button
                    onClick={() => setNewBroadcastModal(true)}
                    className="bg-verde font-semibold cursor-pointer text-white px-4 py-2 rounded-2xl hover:bg-verde/80"
                >
                    Nova Difusão
                </button>
            </div>
            <Pagination
                data={broadcasts}
                filterFields={['templateName','createdAt','sentAt']}
                itemsPerPage={5}>
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
                        <div className="space-y-4">
                            {currentItems.length > 0 ? (
                                currentItems.map((broadcast) => (
                                    <div key={broadcast.id} className="bg-white rounded-lg shadow p-6">
                                        <div className="flex justify-between items-start">
                                            <button
                                                className="w-full text-start hover:bg-slate-50 h-10 cursor-pointer"
                                                onClick={() => openViewer(broadcast.id)}
                                            >
                                                <div className="mt-2 text-sm text-gray-500 space-x-5">
                                                    <span>Template: {broadcast.templateName}</span>
                                                    <span>Destinatários: {broadcast.recipients.length}</span>
                                                    <span className="ml-4">Estado: {broadcast.status}</span>
                                                    {broadcast.sentAt && (
                                                        <span className="ml-4">
                                                            Enviado: {new Date(broadcast.sentAt).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>

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
                                ))
                            ) : (
                                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                                    Nenhuma difusão criada ainda
                                </div>
                            )}
                        </div>
                        {BottomPaginationControls}
                    </>
                )}
            </Pagination>


            {isLoading && <Loading />}

            {newBroadcastModal && (
                <NewBroadcast
                    modelos={modelos}
                    templates={templates}
                    clients={clients}
                    onClose={() => setNewBroadcastModal(false)}
                    reload={() => setAux(!aux)}
                    accountId={selectedAccount.id}
                />
            )}

            {selectedTemplate && viewTemplate && selectedBroadcast && (
                <BroadcastModal
                    onClose={closeViewer}
                    template={selectedTemplate}
                    broadcast={selectedBroadcast}
                />
            )}
        </div>
    );
};

export default BroadcastManager;