import { useState, useEffect, useRef } from 'react';
import { Plus, FileText, Ban, Trash2, Printer } from 'lucide-react';
import { Receipt, Client, PaymentType, ReceiptPayment } from '../types';
import api from '../api/client';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';

export default function Receipts() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCanceling, setIsCanceling] = useState<number | null>(null);

    // Form State
    const [clientId, setClientId] = useState<string>('');
    const [concept, setConcept] = useState('');
    const [subtotal, setSubtotal] = useState(0);
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewTitle, setPreviewTitle] = useState('Vista del recibo');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [retentions, setRetentions] = useState({
        iibb: 0,
        ganancias: 0,
        suss: 0,
        tem: 0,
    });
    const [payments, setPayments] = useState<Omit<ReceiptPayment, 'id' | 'receipt_id' | 'payment_date'>[]>([]);
    const previewFrameRef = useRef<HTMLIFrameElement>(null);

    const fetchReceipts = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/receipts');
            setReceipts(response.data);
        } catch (error) {
            console.error('Failed to fetch receipts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        }
    };

    useEffect(() => {
        fetchReceipts();
        fetchClients();
    }, []);

    const handleOpenModal = () => {
        setClientId('');
        setConcept('');
        setSubtotal(0);
        setRetentions({ iibb: 0, ganancias: 0, suss: 0, tem: 0 });
        setPayments([{ type: PaymentType.CASH, amount: 0, ref_number: '', bank: '' }]);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const calculateTotal = () => {
        return subtotal - (retentions.iibb + retentions.ganancias + retentions.suss + retentions.tem);
    };

    const handleAddPayment = () => {
        setPayments([...payments, { type: PaymentType.CASH, amount: 0, ref_number: '', bank: '' }]);
    };

    const handleRemovePayment = (index: number) => {
        const newPayments = [...payments];
        newPayments.splice(index, 1);
        setPayments(newPayments);
    };

    const updatePayment = (index: number, field: string, value: any) => {
        const newPayments = [...payments] as any[];
        newPayments[index][field] = value;
        setPayments(newPayments);
    };

    const loadPrintableReceipt = async (receipt: Pick<Receipt, 'id' | 'receipt_number'>) => {
        setPreviewTitle(`Recibo ${String(receipt.receipt_number).padStart(8, '0')}`);
        setPreviewHtml('');
        setIsPreviewOpen(true);
        setIsPreviewLoading(true);

        try {
            const response = await api.get(`/receipts/${receipt.id}/print`, {
                responseType: 'text',
                headers: {
                    Accept: 'text/html',
                },
            });
            setPreviewHtml(response.data);
        } catch (error) {
            setIsPreviewOpen(false);
            console.error('Failed to print receipt:', error);
            alert('Error al generar la vista imprimible del recibo');
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handlePreviewPrint = () => {
        previewFrameRef.current?.contentWindow?.print();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const totalPayments = payments.reduce((acc, p) => acc + Number(p.amount), 0);
        const totalReceipt = calculateTotal();

        if (Math.abs(totalPayments - totalReceipt) > 0.01) {
            alert(`El total de los pagos ($${totalPayments}) debe coincidir con el total del recibo ($${totalReceipt})`);
            return;
        }

        try {
            const payload = {
                client_id: clientId ? parseInt(clientId) : null,
                concept,
                subtotal,
                withholding_iibb: retentions.iibb,
                withholding_ganancias: retentions.ganancias,
                withholding_suss: retentions.suss,
                withholding_tem: retentions.tem,
                total: totalReceipt,
                payments: payments.map(p => ({
                    ...p,
                    amount: Number(p.amount)
                }))
            };

            const response = await api.post<Receipt>('/receipts/', payload);
            await fetchReceipts();
            handleCloseModal();
            await loadPrintableReceipt(response.data);
        } catch (error: any) {
            console.error('Failed to create receipt:', error);
            alert(error.response?.data?.detail || 'Error al crear el recibo');
        }
    };

    const handleCancelReceipt = async (id: number) => {
        if (window.confirm('¿Está seguro de que desea anular este recibo? Esta acción no se puede deshacer.')) {
            setIsCanceling(id);
            try {
                await api.post(`/receipts/${id}/cancel`);
                fetchReceipts();
            } catch (error) {
                console.error('Failed to cancel receipt:', error);
                alert('Error al anular el recibo');
            } finally {
                setIsCanceling(null);
            }
        }
    };

    const handlePrint = async (id: number) => {
        const receipt = receipts.find((item) => item.id === id);
        await loadPrintableReceipt({
            id,
            receipt_number: receipt?.receipt_number ?? id,
        });
    };

    const filteredReceipts = receipts.filter((receipt) => {
        const searchLower = searchQuery.toLowerCase();
        const numberMatch = String(receipt.receipt_number).includes(searchQuery);
        const clientMatch = receipt.client_snapshot.name.toLowerCase().includes(searchLower) ||
            (receipt.client_snapshot.cuit && receipt.client_snapshot.cuit.includes(searchQuery));
        return numberMatch || clientMatch;
    });

    const columns = [
        {
            header: 'Nº Recibo',
            accessor: (r: Receipt) => String(r.receipt_number).padStart(8, '0'),
            className: 'font-mono text-slate-700 font-medium'
        },
        {
            header: 'Fecha',
            accessor: (r: Receipt) => new Date(r.issue_date).toLocaleDateString('es-AR'),
            className: 'text-slate-500'
        },
        {
            header: 'Cliente',
            accessor: (r: Receipt) => (
                <div>
                    <div className="font-medium text-slate-900">{r.client_snapshot.name}</div>
                    {r.client_snapshot.cuit && <div className="text-xs text-slate-500">CUIT: {r.client_snapshot.cuit}</div>}
                </div>
            )
        },
        {
            header: 'Total',
            accessor: (r: Receipt) => `$ ${r.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
            className: 'font-medium text-right'
        },
        {
            header: 'Estado',
            accessor: (r: Receipt) => r.canceled_at ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Anulado
                </span>
            ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Activo
                </span>
            )
        },
        {
            header: '',
            accessor: (r: Receipt) => (
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={FileText}
                        onClick={() => handlePrint(r.id)}
                        className="text-blue-600 hover:bg-blue-50"
                        title="Imprimir / PDF"
                    >
                        Imprimir
                    </Button>
                    {!r.canceled_at && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={Ban}
                            isLoading={isCanceling === r.id}
                            onClick={() => handleCancelReceipt(r.id)}
                            className="text-red-600 hover:bg-red-50"
                            title="Anular Recibo"
                        >
                        </Button>
                    )}
                </div>
            ),
            className: 'text-right',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recibos</h1>
                    <p className="text-sm text-slate-500 mt-1">Emisión y gestión de recibos digitales.</p>
                </div>
                <Button onClick={handleOpenModal} icon={Plus} className="w-full sm:w-auto">
                    Emitir Recibo
                </Button>
            </div>

            <DataTable
                data={filteredReceipts}
                columns={columns}
                keyExtractor={(item) => item.id}
                searchPlaceholder="Buscar por número, cliente o CUIT..."
                onSearch={setSearchQuery}
                isLoading={isLoading}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Emitir Nuevo Recibo"
                width="4xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Section: Cliente y Concepto */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Detalles Generales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                                <select
                                    className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white"
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                >
                                    <option value="">Consumidor Final (Sin registrar)</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.cuit ? `(${c.cuit})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="Concepto"
                                value={concept}
                                onChange={(e) => setConcept(e.target.value)}
                                placeholder="Ej. Pago factura 001-00123"
                            />
                        </div>
                    </div>

                    {/* Section: Importes y Retenciones */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wider">Importes y Retenciones</h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            <div className="sm:col-span-2 xl:col-span-1">
                                <Input
                                    label="Subtotal ($)"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={subtotal || ''}
                                    onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
                                    className="font-mono"
                                />
                            </div>
                            <Input
                                label="Ret. IIBB ($)"
                                type="number"
                                step="0.01"
                                min="0"
                                value={retentions.iibb || ''}
                                onChange={(e) => setRetentions({ ...retentions, iibb: parseFloat(e.target.value) || 0 })}
                                className="font-mono text-red-600"
                            />
                            <Input
                                label="Ret. Ganancias ($)"
                                type="number"
                                step="0.01"
                                min="0"
                                value={retentions.ganancias || ''}
                                onChange={(e) => setRetentions({ ...retentions, ganancias: parseFloat(e.target.value) || 0 })}
                                className="font-mono text-red-600"
                            />
                            <Input
                                label="Ret. SUSS ($)"
                                type="number"
                                step="0.01"
                                min="0"
                                value={retentions.suss || ''}
                                onChange={(e) => setRetentions({ ...retentions, suss: parseFloat(e.target.value) || 0 })}
                                className="font-mono text-red-600"
                            />
                            <Input
                                label="Ret. TEM ($)"
                                type="number"
                                step="0.01"
                                min="0"
                                value={retentions.tem || ''}
                                onChange={(e) => setRetentions({ ...retentions, tem: parseFloat(e.target.value) || 0 })}
                                className="font-mono text-red-600"
                            />
                        </div>
                        <div className="mt-4 flex flex-col gap-1 border-t border-slate-200 pt-3 sm:flex-row sm:justify-end">
                            <div className="text-lg">
                                <span className="mr-2 text-slate-500">Total a cobrar:</span>
                                <span className="font-bold text-slate-900 font-mono">$ {calculateTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Section: Pagos */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Medios de Pago</h4>
                            <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={handleAddPayment} className="w-full sm:w-auto">
                                Agregar Pago
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {payments.map((payment, index) => (
                                <div key={index} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
                                    <div className="min-w-0 flex-1 sm:min-w-[150px]">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                                        <select
                                            className="block w-full py-1.5 px-3 border border-slate-300 bg-white rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                            value={payment.type}
                                            onChange={(e) => updatePayment(index, 'type', e.target.value)}
                                        >
                                            <option value={PaymentType.CASH}>Efectivo</option>
                                            <option value={PaymentType.TRANSFER}>Transferencia</option>
                                            <option value={PaymentType.CHEQUE}>Cheque</option>
                                        </select>
                                    </div>

                                    <div className="min-w-0 flex-1 sm:min-w-[120px]">
                                        <Input
                                            label="Monto ($)"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={payment.amount || ''}
                                            onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                                            className="py-1.5 text-sm font-mono"
                                        />
                                    </div>

                                    {payment.type !== PaymentType.CASH && (
                                        <>
                                            <div className="min-w-0 flex-1 sm:min-w-[150px]">
                                                <Input
                                                    label="Banco"
                                                    value={payment.bank || ''}
                                                    onChange={(e) => updatePayment(index, 'bank', e.target.value)}
                                                    className="py-1.5 text-sm"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1 sm:min-w-[150px]">
                                                <Input
                                                    label="Referencia / Nº"
                                                    value={payment.ref_number || ''}
                                                    onChange={(e) => updatePayment(index, 'ref_number', e.target.value)}
                                                    className="py-1.5 text-sm"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {payments.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePayment(index)}
                                            className="inline-flex h-9 w-9 items-center justify-center self-end rounded-md text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                            title="Quitar pago"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex flex-col gap-1 pt-3 sm:flex-row sm:justify-end">
                            <div className="text-sm">
                                <span className="text-slate-500 mr-2">Suma de pagos:</span>
                                <span className={`font-semibold font-mono ${Math.abs(payments.reduce((acc, p) => acc + Number(p.amount), 0) - calculateTotal()) > 0.01
                                    ? 'text-red-500'
                                    : 'text-emerald-600'
                                    }`}>
                                    $ {payments.reduce((acc, p) => acc + Number(p.amount), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                        <Button variant="secondary" onClick={handleCloseModal} type="button" className="w-full sm:w-auto">
                            Cancelar
                        </Button>
                        <Button type="submit" className="w-full sm:w-auto">
                            Emitir Recibo
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title={previewTitle}
                width="4xl"
            >
                <div className="space-y-4">
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button variant="secondary" onClick={() => setIsPreviewOpen(false)} type="button" className="w-full sm:w-auto">
                            Cerrar
                        </Button>
                        <Button
                            type="button"
                            icon={Printer}
                            onClick={handlePreviewPrint}
                            disabled={!previewHtml || isPreviewLoading}
                            className="w-full sm:w-auto"
                        >
                            Imprimir
                        </Button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        {isPreviewLoading ? (
                            <div className="flex h-[70vh] items-center justify-center px-6 text-center text-slate-500">
                                Generando vista previa del recibo...
                            </div>
                        ) : (
                            <iframe
                                ref={previewFrameRef}
                                title={previewTitle}
                                srcDoc={previewHtml}
                                className="h-[70vh] w-full bg-white"
                            />
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
