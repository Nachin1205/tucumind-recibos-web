import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function Modal({ isOpen, onClose, title, children, width = 'md' }: ModalProps) {
    if (!isOpen) return null;

    const widths = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex min-h-full items-end justify-center p-3 text-center sm:p-4 md:items-center">
                <div
                    className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity backdrop-blur-sm"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <div className={`relative flex max-h-[calc(100vh-1.5rem)] w-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-xl transform transition-all sm:max-h-[calc(100vh-2rem)] ${widths[width]}`}>
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
                        <h3 className="pr-4 text-lg font-semibold leading-6 text-slate-900 sm:text-xl" id="modal-title">
                            {title}
                        </h3>
                        <button
                            type="button"
                            className="rounded-md bg-white text-slate-400 transition-colors hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            onClick={onClose}
                        >
                            <span className="sr-only">Cerrar</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
