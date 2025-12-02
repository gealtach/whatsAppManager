'use client';

import Modal from "./Modal";

const NewTemplate = ({ accountId, onClose }: { accountId: string, onClose: () => void }) => {

    const onSubmit = async () => {
        console.log(accountId);
    };

    return (
        <Modal>
            <div className="border-2 border-verde rounded-2xl p-5 bg-background">
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
            </div>
        </Modal>
    );
};

export default NewTemplate;