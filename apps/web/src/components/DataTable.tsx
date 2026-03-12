import React, { useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search
} from 'lucide-react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string | number;
    searchPlaceholder?: string;
    onSearch?: (value: string) => void;
    isLoading?: boolean;
}

export function DataTable<T>({
    data,
    columns,
    keyExtractor,
    searchPlaceholder = 'Buscar...',
    onSearch,
    isLoading = false,
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = data.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {onSearch && (
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder={searchPlaceholder}
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className={`px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                                    <div className="flex justify-center items-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                        Cargando datos...
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                                    No se encontraron resultados
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item) => (
                                <tr key={keyExtractor(item)} className="hover:bg-slate-50 transition-colors">
                                    {columns.map((col, idx) => (
                                        <td key={idx} className={`px-6 py-4 whitespace-nowrap text-sm text-slate-700 ${col.className || ''}`}>
                                            {typeof col.accessor === 'function' ? col.accessor(item) : String(item[col.accessor])}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && data.length > itemsPerPage && (
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Mostrando <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                        <span className="font-medium text-slate-900">
                            {Math.min(currentPage * itemsPerPage, data.length)}
                        </span>{' '}
                        de <span className="font-medium text-slate-900">{data.length}</span> resultados
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-slate-700 px-2 font-medium">
                            Hoja {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
