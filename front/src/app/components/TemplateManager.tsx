'use client';

import { useCallback, useEffect, useState } from "react";
import { Account, MessageTemplate } from "../Types";
import { toast } from "react-toastify";
import { fetchClient } from "../lib/fetchClient";
import Loading from "./Loading";
import TemplateViewer from "./TemplateViewer";
import Pagination from "./Pagination";
import NewTemplate from "./NewTemplate";

const TemplateManager = ({ account }: { account: Account }) => {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [newTemplateModal, setNewTemplateModal] = useState<boolean>(false);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetchClient.get(`/template/${account.id}`);
            const ans = await response.json();
            if (response.ok) setTemplates(ans.payload.approvedTemplates);
            else toast.error(ans.message);
        } catch (error) {
            if (error instanceof Error) toast.error(error.message);
            else toast.error('Erro desconhecido');
        } finally { setIsLoading(false); }
    }, [account.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    return (
        <div>
            <div className="mb-3">
                <button
                    onClick={() => setNewTemplateModal(true)}
                    className="bg-verde font-semibold cursor-pointer text-white px-4 py-2 rounded-2xl hover:bg-verde/80"
                >
                    Novo Template
                </button>
            </div>
            <Pagination
                data={templates}
                itemsPerPage={5}>
                {({
                    currentItems,
                    PaginationInfo, PaginationControls,
                    BottomPaginationControls,
                }) => (
                    <>
                        <div className="flex justify-between items-center p-2 bg-verde mb-5">
                            {PaginationInfo}
                            {PaginationControls}
                        </div>
                        <div className="flex flex-wrap justify-around">
                            {
                                currentItems.length > 0 &&
                                currentItems.map(t => (
                                    <div key={t.id} className="flex flex-col gap-5 p-3">
                                        <h1 className="w-full border-b border-verde">{t.name}</h1>
                                        <TemplateViewer template={t} />
                                    </div>
                                ))
                            }
                        </div>
                        {BottomPaginationControls}
                    </>
                )}
            </Pagination>

            {
                newTemplateModal &&
                <NewTemplate
                    accountId={account.id}
                    onClose={() => setNewTemplateModal(false)} />
            }

            {isLoading && <Loading />}
        </div>
    );
};

export default TemplateManager;