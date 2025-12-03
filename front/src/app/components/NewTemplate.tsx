'use client';

import { useState } from "react";
import Modal from "./Modal";
import { useForm } from "react-hook-form";

interface NewTemplateForm {
    HEADER?: string;
    TEXT_HEADER?: string;
}

const NewTemplate = ({ accountId, onClose }: { accountId: string, onClose: () => void }) => {
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<NewTemplateForm>();
    const [withHeader, setWithHeader] = useState(false);

    const deleteComponent = (component: string) => {
        if (component === 'HEADER') {
            setValue(component, undefined);
            setValue('TEXT_HEADER', undefined);
            setWithHeader(false);
        }
    }

    const header = watch('HEADER');

    const onSubmit = handleSubmit(async (data) => {
        console.log(accountId, data);
    });

    return (
        <Modal>
            <form onSubmit={onSubmit} className="border-2 border-verde rounded-2xl p-5 bg-background">
                <div className="my-5">
                    <div className="flex flex-col gap-3">
                        {
                            withHeader ?
                                <button
                                    type="button"
                                    onClick={() => deleteComponent('HEADER')}
                                    className="px-6 py-3 text-xs cursor-pointer rounded-2xl bg-verde hover:bg-verde/90"
                                >Tirar HEADER</button> :
                                <button
                                    type="button"
                                    onClick={() => setWithHeader(true)}
                                    className="px-6 py-3 text-xs cursor-pointer rounded-2xl bg-verde hover:bg-verde/90"
                                >Adicionar HEADER</button>
                        }
                        {
                            withHeader &&
                            <div className="flex flex-col gap-1">
                                <span className="text-xs">Tipo *</span>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                                    {...register('HEADER', {
                                        required: 'Campo obrigatório'
                                    })}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Seleccione uma opção</option>
                                    <option value="TEXT">Texto</option>
                                    <option value="IMAGE">Imagem</option>
                                    <option value="VIDEO">Video</option>
                                    <option value="DOCUMENT">Documento</option>
                                    <option value="LOCATION">Imagem</option>
                                </select>
                                {errors.HEADER && (
                                    <span className="text-red-400 text-sm">{errors.HEADER.message}</span>
                                )}
                            </div>
                        }
                        {
                            withHeader && header === 'TEXT' &&
                            <div className="flex flex-col gap-1">
                                <span className="text-xs">Adicionar o texto do HEADER</span>
                                <input
                                    {...register("TEXT_HEADER", {
                                        required: "Campo obrigatório"
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
                                    type="text"
                                />
                                {errors.TEXT_HEADER && (
                                    <span className="text-red-400 text-sm">{errors.TEXT_HEADER.message}</span>
                                )}
                            </div>
                        }

                    </div>
                </div>
                <div className="flex gap-3 text-white">
                    <button
                        className="px-6 py-3 font-semibold cursor-pointer rounded-2xl bg-verde hover:bg-verde/90"
                    >Submeter</button>
                    <button
                        className="px-6 py-3 font-semibold cursor-pointer rounded-2xl bg-gray-400 hover:bg-gray-400/90"
                        type="button"
                        onClick={onClose}
                    >Cancelar</button>
                </div>
            </form>
        </Modal>
    );
};

export default NewTemplate;