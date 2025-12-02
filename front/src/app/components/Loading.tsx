import React from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import Modal from './Modal'

const Loading = () => {
    return (
        <Modal className='z-50'>
            <div>
                <div className='flex flex-col justify-center items-center p-4 gap-5'>
                    <FaWhatsapp className='text-verde animate-ping' size={50} />
                    <span>Loading...</span>
                </div>
            </div>
        </Modal>
    )
}

export default Loading
