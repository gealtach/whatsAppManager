'use client';

import { IoIosCloseCircle } from "react-icons/io";
import { Broadcast, MessageTemplate } from "../Types";
import TemplateViewer from "./TemplateViewer";
import Tooltip from "./Tooltip";
import { CiWarning } from "react-icons/ci";
import { FaCheck } from "react-icons/fa";
import { MdPending } from "react-icons/md";

const BroadcastModal = ({ onClose, broadcast, template }: { onClose: () => void, template: MessageTemplate, broadcast: Broadcast }) => {
    const recipientStatusIcon = (status: string) => {
        if (status === 'PENDING') return <Tooltip text="Pendente"><MdPending className="text-blue-500" size={20} /></Tooltip>
        if (status === 'SENT') return <Tooltip text="Enviado"><FaCheck className="text-verde" size={20} /></Tooltip>
        if (status === 'FAILED') return <Tooltip text="Falhou o envio"><CiWarning className="text-red-500" size={20} /></Tooltip>
    }
    return (
        <div className="fixed inset-0 bg-white/30 flex items-center justify-center">
            <div className="bg-white border-verde border-2 p-5 rounded-2xl">
                <button
                    onClick={onClose}
                    className="hover:text-red-500 cursor-pointer">
                    <Tooltip text="Fechar">
                        <IoIosCloseCircle size={30} />
                    </Tooltip>
                </button>
                <div className="flex gap-5">
                    <TemplateViewer template={template} />
                    <div>
                        <h1 className="text-xl mb-3">Enviar para ({broadcast.recipients.length}):</h1>
                        <div className="h-[300px] overflow-scroll bg-slate-50 p-4 rounded-2xl">
                            {
                                broadcast.recipients.map(r => (
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
                    <span>Estado: {broadcast.status}</span>
                    <span>Agendado: {broadcast?.scheduledAt?.toString().split('T')[0] || 'Sem agendamento'}</span>
                    <span>Enviado: {broadcast?.sentAt?.toString().split('T')[0] || 'Ainda não foi enviado'}</span>
                </div>
            </div>
        </div>
    );
};

export default BroadcastModal;