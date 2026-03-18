import { useState } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Copy, Loader2, FileArchive } from 'lucide-react';
import api from '../api/client';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';

interface OCRResult {
    filename: string;
    extracted_number: string | null;
    extracted_date: string | null;
    status: 'success' | 'error';
    error?: string;
}

export default function Digitization() {
    const [results, setResults] = useState<OCRResult[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFiles = async (files: FileList | File[]) => {
        setIsUploading(true);
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await api.post('/ocr/process-batch', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setResults(prev => [...response.data, ...prev]);
        } catch (error) {
            console.error('Batch OCR failed:', error);
            alert('Error al procesar los archivos.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        // Optional: show a toast or temporary "Copied!" state
    };

    const columns = [
        {
            header: 'Archivo',
            accessor: (r: OCRResult) => (
                <div className="flex items-center">
                    {r.filename.toLowerCase().includes('.zip') ? (
                        <FileArchive className="h-4 w-4 mr-2 text-amber-500" />
                    ) : r.filename.toLowerCase().includes('.pdf') ? (
                        <FileText className="h-4 w-4 mr-2 text-red-500" />
                    ) : (
                        <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    )}
                    <span className="truncate max-w-xs">{r.filename}</span>
                </div>
            )
        },
        {
            header: 'Número Extraído',
            accessor: (r: OCRResult) => r.extracted_number ? (
                <div className="flex items-center space-x-2">
                    <span className="font-mono font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {r.extracted_number}
                    </span>
                    <button 
                        onClick={() => copyToClipboard(r.extracted_number!)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400 hover:text-slate-600"
                        title="Copiar número"
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <span className="text-slate-400 italic text-sm">No detectado</span>
            )
        },
        {
            header: 'Fecha',
            accessor: (r: OCRResult) => r.extracted_date || '-',
            className: 'text-slate-500 text-sm'
        },
        {
            header: 'Estado',
            accessor: (r: OCRResult) => r.status === 'success' ? (
                <span className="inline-flex items-center text-emerald-600 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Completado
                </span>
            ) : (
                <div className="flex flex-col">
                    <span className="inline-flex items-center text-red-600 text-sm font-medium">
                        <XCircle className="h-4 w-4 mr-1" /> Error
                    </span>
                    {r.error && <span className="text-xs text-red-400 mt-0.5 max-w-[150px] truncate" title={r.error}>{r.error}</span>}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Digitalización OCR</h1>
                <p className="text-sm text-slate-500 mt-1">Carga imágenes o archivos ZIP para extraer números de comprobantes automáticamente.</p>
            </div>

            {/* Upload Zone */}
            <div
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:p-8 ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    multiple
                    accept="image/*,.zip,.pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    disabled={isUploading}
                />
                
                <div className={`p-4 rounded-full mb-4 ${dragActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    {isUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                        <Upload className="h-8 w-8" />
                    )}
                </div>
                
                <div className="max-w-xs">
                    <p className="text-lg font-semibold text-slate-900">
                        {isUploading ? 'Procesando archivos...' : 'Suelte sus archivos aquí'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                        Admite múltiples imágenes, archivos .ZIP o documentos .PDF con uno o varios comprobantes.
                    </p>
                </div>

                {!isUploading && (
                    <div className="mt-6">
                        <Button variant="secondary" size="sm">
                            Seleccionar Archivos
                        </Button>
                    </div>
                )}
            </div>

            {/* Results Table */}
            {results.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <h3 className="font-semibold text-slate-800">Resultados del Procesamiento</h3>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-slate-400 hover:text-red-600 sm:w-auto"
                            onClick={() => setResults([])}
                        >
                            Limpiar lista
                        </Button>
                    </div>
                    <DataTable
                        data={results}
                        columns={columns}
                        keyExtractor={(item) => item.filename}
                    />
                </div>
            )}
        </div>
    );
}
