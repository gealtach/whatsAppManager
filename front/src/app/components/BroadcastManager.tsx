'use client';

import { useEffect, useState } from "react";
import { Account, Broadcast, Client, MessageTemplate } from "../Types";
import { fetchClient } from "../lib/fetchClient";
import { toast } from "react-toastify";
import Loading from "./Loading";
import NewBroadcast from "./NewBroadcast";
import TemplateViewer from "./TemplateViewer";
import Tooltip from "./Tooltip";
import { IoIosCloseCircle } from "react-icons/io";
import { MdPending } from "react-icons/md";
import { FaCheck } from "react-icons/fa";
import { CiWarning } from "react-icons/ci";

const BroadcastManager = ({ selectedAccount }: { selectedAccount: Account }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [newBroadcastModal, setNewBroadcastModal] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [aux, setAux] = useState<boolean>(false);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | undefined>(undefined);
    const [viewTemplate, setViewTemplate] = useState<boolean>(false);
    const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | undefined>(undefined);

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

    const recipientStatusIcon = (status: string) => {
        if (status === 'PENDING') return <Tooltip text="Pendiente"><MdPending className="text-blue-500" size={20} /></Tooltip>
        if (status === 'SENT') return <Tooltip text="Enviado"><FaCheck className="text-verde" size={20} /></Tooltip>
        if (status === 'PENDING') return <Tooltip text="Falhou o envio"><CiWarning className="text-red-500" size={20} /></Tooltip>
    }

    useEffect(() => {
        const fetchData = async () => {
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

                if (clientResponse.ok) setClients(clientAns.payload);
                else toast.error(clientAns.message);

                if (broadcastResponse.ok) setBroadcasts(broadcastAns.payload);
                else toast.error(broadcastAns.message);

                if (templatesResponse.ok) setTemplates(templatesAns.payload);
                else toast.error(templatesAns.message);
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
                            <button className="cursor-pointer"
                                onClick={() => openViewer(broadcast.id)}>
                                <div className="mt-2 text-sm text-gray-500 space-x-5">
                                    <span>Template: {broadcast.templateName}</span>
                                    <span>Destinatarios: {broadcast.recipients.length}</span>
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
            {
                selectedTemplate && viewTemplate && selectedBroadcast &&
                <div className="fixed inset-0 bg-white/30 flex items-center justify-center">
                    <div className="bg-white border-verde border-2 p-5 rounded-2xl">
                        <button
                            onClick={closeViewer}
                            className="hover:text-red-500 cursor-pointer">
                            <Tooltip text="Fechar">
                                <IoIosCloseCircle size={30} />
                            </Tooltip>
                        </button>
                        <div className="flex gap-5">
                            <TemplateViewer template={selectedTemplate} />
                            <div>
                                <h1 className="text-xl mb-3">Enviar para:</h1>
                                <div className="h-[300px] overflow-scroll bg-slate-50 p-4 rounded-2xl">
                                    {
                                        selectedBroadcast.recipients.map(r => (
                                            <div key={r.id} className="flex gap-3">
                                                <span>{r.client.phone} - {r.client.name}</span>
                                                {recipientStatusIcon(r.status)}
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 text-xs my-3">
                            <span>Estado: {selectedBroadcast.status}</span>
                            <span>Agendado: {selectedBroadcast.scheduledAt?.toISOString() || 'Sem agendamento'}</span>
                            <span>Enviado: {selectedBroadcast.sentAt?.toISOString() || 'Ainda não foi enviado'}</span>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};

export default BroadcastManager;