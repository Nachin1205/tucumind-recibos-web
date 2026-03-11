import { useState, useEffect, useRef } from 'react';
import { Edit2, Plus, Trash2, Upload } from 'lucide-react';
import { Client } from '../types';
import api from '../api/client';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';

export default function Clients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        cuit: '',
        address: '',
        city: '',
        iva_type: '',
    });

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleOpenModal = (client?: Client) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                name: client.name,
                cuit: client.cuit,
                address: client.address || '',
                city: client.city || '',
                iva_type: client.iva_type || '',
            });
        } else {
            setEditingClient(null);
            setFormData({ name: '', cuit: '', address: '', city: '', iva_type: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await api.patch(`/clients/${editingClient.id}`, formData);
            } else {
                await api.post('/clients', formData);
            }
            handleCloseModal();
            fetchClients();
        } catch (error) {
            console.error('Failed to save client:', error);
            alert('Error al guardar el cliente');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/clients/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`Éxito: ${response.data.message}`);
            fetchClients();
        } catch (error: any) {
            console.error('Failed to upload file:', error);
            alert(`Error al importar: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
            setIsDeleting(id);
            try {
                await api.delete(`/clients/${id}`);
                fetchClients();
            } catch (error) {
                console.error('Failed to delete client:', error);
                alert('Error al eliminar el cliente');
            } finally {
                setIsDeleting(null);
            }
        }
    };

    const filteredClients = clients.filter((client) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.cuit.includes(searchQuery)
    );

    const columns = [
        { header: 'ID', accessor: 'id' as const, className: 'w-16 text-slate-500 font-medium' },
        { header: 'Razón Social / Nombre', accessor: 'name' as const, className: 'font-medium text-slate-900' },
        { header: 'CUIT/CUIL', accessor: 'cuit' as const },
        { header: 'Condición IVA', accessor: (c: Client) => c.iva_type || '-', className: 'text-slate-500' },
        { header: 'Localidad', accessor: (c: Client) => c.city || '-', className: 'text-slate-500' },
        {
            header: '',
            accessor: (client: Client) => (
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit2}
                        onClick={() => handleOpenModal(client)}
                        className="text-blue-600 hover:bg-blue-50"
                    >
                        Editar
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        isLoading={isDeleting === client.id}
                        onClick={() => handleDelete(client.id)}
                        className="text-red-600 hover:bg-red-50"
                    >
                        Eliminar
                    </Button>
                </div>
            ),
            className: 'text-right',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clientes</h1>
                    <p className="text-sm text-slate-500 mt-1">Gestione su cartera de clientes y consumidores finales.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".xlsx"
                    />
                    <Button
                        variant="secondary"
                        icon={Upload}
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={isUploading}
                    >
                        Importar Excel
                    </Button>
                    <Button onClick={() => handleOpenModal()} icon={Plus}>
                        Nuevo Cliente
                    </Button>
                </div>
            </div>

            <DataTable
                data={filteredClients}
                columns={columns}
                keyExtractor={(item) => item.id}
                searchPlaceholder="Buscar por nombre o CUIT..."
                onSearch={setSearchQuery}
                isLoading={isLoading}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                width="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <Input
                                label="Razón Social / Nombre Requerido"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Ej. Consumidor Final"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Input
                                label="CUIT / CUIL Requerido"
                                value={formData.cuit}
                                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                                required
                                placeholder="Sin guiones, ej. 20123456789"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Input
                                label="Domicilio"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Ej. San Martín 123"
                            />
                        </div>

                        <div className="sm:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Condición IVA
                            </label>
                            <select
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors py-2 px-3 border bg-white"
                                value={formData.iva_type}
                                onChange={(e) => setFormData({ ...formData, iva_type: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Responsable Inscripto">Responsable Inscripto</option>
                                <option value="Monotributo">Monotributo</option>
                                <option value="Exento">Exento</option>
                                <option value="Consumidor Final">Consumidor Final</option>
                            </select>
                        </div>

                        <div className="sm:col-span-1">
                            <Input
                                label="Localidad"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                placeholder="Ej. San Miguel de Tucumán"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={handleCloseModal} type="button">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
