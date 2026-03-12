import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = '', id, ...props }, ref) => {
        const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
                    {label}
                </label>
                <div className="relative">
                    <input
                        ref={ref}
                        id={inputId}
                        className={`block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors ${error ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : ''
                            } disabled:bg-slate-50 disabled:text-slate-500 ${className}`}
                        {...props}
                    />
                </div>
                {error ? (
                    <p className="mt-1.5 text-sm text-red-600">{error}</p>
                ) : helperText ? (
                    <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
                ) : null}
            </div>
        );
    }
);
