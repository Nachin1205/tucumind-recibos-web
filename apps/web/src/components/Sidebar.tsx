import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Receipt,
    ScanText,
    Settings,
    LogOut
} from 'lucide-react';

export default function Sidebar() {
    const { logout, user } = useAuth();

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/recibos', icon: Receipt, label: 'Recibos' },
        { to: '/clientes', icon: Users, label: 'Clientes' },
        { to: '/ocr', icon: ScanText, label: 'OCR (Pronto)' },
        { to: '/config', icon: Settings, label: 'Configuración' },
    ];

    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    TUCUMIND
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`
                                }
                            >
                                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-slate-200">
                <div className="flex items-center px-3 py-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {user?.username}
                        </p>
                        <p className="text-xs text-slate-500 truncate">Administrador</p>
                    </div>
                    <button
                        onClick={logout}
                        className="ml-2 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
