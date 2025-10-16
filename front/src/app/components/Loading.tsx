import React from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

const Loading = () => {
    return (
        <div className='fixed inset-0 flex w-screen h-screen bg-white/50 items-center justify-center z-50'>
            <div className=''>
                <div className='flex flex-col justify-center items-center p-4 gap-3'>
                    <AiOutlineLoading3Quarters className='text-black animate-spin' size={40} />
                </div>
            </div>
        </div>
    )
}

export default Loading
