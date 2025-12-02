'use client';

import { ReactNode } from "react";

const Modal = ({ children,className }: { children: ReactNode,className?:string }) => {
    return (
        <div className={`fixed inset-0 bg-background/30 flex items-center justify-center ${className}`}>
            {children}
        </div>
    );
};

export default Modal;