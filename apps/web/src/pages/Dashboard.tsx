import { useEffect, useState } from 'react';
import { Users, Receipt, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        clientsCount: 0,
        receiptsCount: 0,
        activeReceiptsCount: 0,
        canceledReceiptsCount: 0,
        totalAmount: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [clientsRes, receiptsRes] = await Promise.all([
                    api.get('/clients'),
                    api.get('/receipts'),
                ]);

                const clients = clientsRes.data;
                const receipts = receiptsRes.data;

                const activeReceipts = receipts.filter((r: any) => !r.canceled_at);
                const totalAmount = activeReceipts.reduce((acc: number, r: any) => acc + r.total, 0);

                setStats({
                    clientsCount: clients.length,
                    receiptsCount: receipts.length,
                    activeReceiptsCount: activeReceipts.length,
                    canceledReceiptsCount: receipts.length - activeReceipts.length,
                    totalAmount,
                });
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        {
            name: 'Total Clientes',
            value: stats.clientsCount,
            icon: Users,
            color: 'bg-blue-500',
            lightColor: 'bg-blue-50',
            textColor: 'text-blue-600',
        },
        {
            name: 'Recibos Emitidos',
            value: stats.receiptsCount,
            icon: Receipt,
            color: 'bg-indigo-500',
            lightColor: 'bg-indigo-50',
            textColor: 'text-indigo-600',
        },
        {
            name: 'Recibos Activos / Anulados',
            value: `${stats.activeReceiptsCount} / ${stats.canceledReceiptsCount}`,
            icon: AlertCircle,
            color: 'bg-amber-500',
            lightColor: 'bg-amber-50',
            textColor: 'text-amber-600',
        },
        {
            name: 'Total Recaudado',
            value: `$ ${stats.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: 'bg-emerald-500',
            lightColor: 'bg-emerald-50',
            textColor: 'text-emerald-600',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
                    Hola de nuevo, <span className="text-blue-600">{user?.username}</span> 👋
                </h1>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <div
                            key={item.name}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-start transition-all hover:shadow-md"
                        >
                            <div className={`p-3 rounded-xl ${item.lightColor} mb-4`}>
                                <IconComponent className={`h-6 w-6 ${item.textColor}`} />
                            </div>
                            <p className="text-sm font-medium text-slate-500 truncate mb-1">
                                {item.name}
                            </p>
                            {isLoading ? (
                                <div className="h-8 bg-slate-200 rounded animate-pulse w-24"></div>
                            ) : (
                                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="relative mt-8 overflow-hidden rounded-2xl border border-blue-500 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-sm sm:p-8">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white bg-opacity-10 rounded-full blur-xl"></div>

                <div className="relative z-10">
                    <h2 className="mb-2 text-2xl font-bold">Bienvenido a TUCUMIND</h2>
                    <p className="text-blue-100 max-w-2xl mb-6">
                        Gestioná los recibos digitales de tu empresa de forma rápida, moderna y segura. Empezá agregando clientes o emitiendo nuevos recibos.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                        <a href="/recibos" className="inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2 font-medium text-blue-600 shadow-sm transition-colors hover:bg-slate-50 sm:w-auto">
                            <Receipt className="h-4 w-4 mr-2" />
                            Emitir Recibo
                        </a>
                        <a href="/clientes" className="inline-flex w-full items-center justify-center rounded-lg border border-blue-500 bg-blue-700 bg-opacity-50 px-4 py-2 font-medium text-white transition-colors hover:bg-opacity-70 sm:w-auto">
                            <Users className="h-4 w-4 mr-2" />
                            Ver Clientes
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
